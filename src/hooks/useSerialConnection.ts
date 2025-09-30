import { useState, useCallback, useRef, useEffect } from 'react';
import { TelemetryData, ConnectionStatus, parseTelemetryPacket, parseStatusFlags } from '@/types/telemetry';
import { toast } from 'sonner';

export const useSerialConnection = (speakFunction?: (text: string) => void) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [telemetryData, setTelemetryData] = useState<TelemetryData[]>([]);
  const [currentData, setCurrentData] = useState<TelemetryData | null>(null);
  const [rawData, setRawData] = useState<string[]>([]);
  const [textMessages, setTextMessages] = useState<string[]>([]);
  const [maxAltitudeAnnounced, setMaxAltitudeAnnounced] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  
  const [parachuteAnnounced, setParachuteAnnounced] = useState(false);
  
  const [flightState, setFlightState] = useState<'pre-flight' | 'launched' | 'landed'>('pre-flight');
  const [launchTime, setLaunchTime] = useState<number | null>(null);
  const [landingTime, setLandingTime] = useState<number | null>(null);
  const [baselineAltitude, setBaselineAltitude] = useState<number | null>(null);
  const [baselineGForce, setBaselineGForce] = useState<number | null>(null);
  
  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const bufferRef = useRef<string>('');

  const parachuteAnnouncedRef = useRef(false);
  const maxAltitudeAnnouncedRef = useRef(false);
  const maxAltitudeRef = useRef(0);
  
  // ИСПРАВЛЕНИЕ: Флаг для отслеживания того, что мы уже обработали парашют
  const parachuteProcessingRef = useRef(false);
  // ИСПРАВЛЕНИЕ: Флаг для отслеживания текущего процесса речи
  const isSpeakingRef = useRef(false);
  // ИСПРАВЛЕНИЕ: Очередь для сообщений
  const speechQueueRef = useRef<string[]>([]);

  // ИСПРАВЛЕНИЕ: Функция для управления очередью речи
  const processSpeechQueue = useCallback(async () => {
    if (isSpeakingRef.current || speechQueueRef.current.length === 0 || !speakFunction) {
      return;
    }

    isSpeakingRef.current = true;
    const text = speechQueueRef.current.shift()!;

    try {
      console.log(`🔊 Speaking: "${text}"`);
      
      // Создаем промис для ожидания завершения речи
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        
        utterance.onend = () => {
          console.log(`✅ Finished speaking: "${text}"`);
          resolve();
        };
        
        utterance.onerror = (event) => {
          console.error(`❌ Speech error:`, event);
          resolve();
        };

        window.speechSynthesis.speak(utterance);
      });

      // Небольшая пауза между сообщениями
      await new Promise(resolve => setTimeout(resolve, 5000));
      
    } catch (error) {
      console.error('Error in speech synthesis:', error);
    } finally {
      isSpeakingRef.current = false;
      // Обрабатываем следующее сообщение в очереди
      processSpeechQueue();
    }
  }, [speakFunction]);

  // ИСПРАВЛЕНИЕ: Функция для добавления сообщения в очередь
  const queueSpeech = useCallback((text: string) => {
    speechQueueRef.current.push(text);
    processSpeechQueue();
  }, [processSpeechQueue]);

  const handleConnect = useCallback(async (port: any) => {
    try {
      console.log('🔌 Starting connection...');
      setConnectionStatus('connecting');
      portRef.current = port;
      
      const reader = port.readable!.getReader();
      readerRef.current = reader;
      
      setIsConnected(true);
      setConnectionStatus('connected');
      console.log('✅ Connected to serial port');
      
      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              console.log('📭 Reader done');
              break;
            }
            
            const text = new TextDecoder().decode(value);
            bufferRef.current += text;
            
            const lines = bufferRef.current.split('\n');
            bufferRef.current = lines.pop() || '';
            
            for (const line of lines) {
              if (line.trim()) {
                console.log('📨 Raw line:', line.trim());
                
                setRawData(prev => [...prev, line.trim()]);
                
                if (/[a-zA-Z]/.test(line) && !line.includes(',')) {
                  console.log('📝 Text message detected:', line.trim());
                  setTextMessages(prev => [...prev, line.trim()]);
                  toast.info(`Flight Event: ${line.trim()}`);
                  
                } else {
                  const data = parseTelemetryPacket(line);
                  console.log('📊 Parsed telemetry data:', data);
                  
                  if (data) {
                    setCurrentData(data);
                    
                    // Обновляем максимальную высоту
                    if (data.altitude > maxAltitudeRef.current) {
                      console.log('📈 New max altitude detected:', data.altitude);
                      maxAltitudeRef.current = data.altitude;
                    }
                    
                    setTelemetryData(prev => {
                      const newData = [...prev, data];
                      
                      if (newData.length >= 2) {
                        const lastPoint = newData[newData.length - 2];
                        const currentPoint = data;
                        const timeDiff = (currentPoint.time - lastPoint.time) / 1000;
                        const altitudeDiff = currentPoint.altitude - lastPoint.altitude;
                        
                        if (timeDiff > 0) {
                          const speed = Math.abs(altitudeDiff / timeDiff);
                          setCurrentSpeed(speed);
                        }
                      }
                      
                      return newData;
                    });
                    
                    setFlightState(prevState => {
                      if (baselineAltitude === null || baselineGForce === null) {
                        console.log('🎯 Setting baseline values:', { altitude: data.altitude, gForce: data.accelY });
                        setBaselineAltitude(data.altitude);
                        setBaselineGForce(data.accelY);
                        return prevState;
                      }
                      
                      if (prevState === 'pre-flight' && 
                          data.altitude > (baselineAltitude + 5) && 
                          Math.abs(data.accelY - baselineGForce) > 2) {
                        console.log('🚀 Launch detected!');
                        setLaunchTime(Date.now());
                        toast.success("🚀 Launch detected! Flight timer started.");
                        return 'launched';
                      }
                      
                      if (prevState === 'launched' && 
                          data.altitude <= (baselineAltitude + 3) && 
                          Math.abs(data.accelY - baselineGForce) < 0.5) {
                        console.log('🏁 Landing detected!');
                        setLandingTime(Date.now());
                        toast.success("🏁 Landing detected! Flight timer stopped.");
                        return 'landed';
                      }
                      
                      return prevState;
                    });
                    
                    console.log('🔊 Checking parachute voice alert...');
                    console.log('   - speakFunction exists:', !!speakFunction);
                    console.log('   - parachuteAnnouncedRef.current:', parachuteAnnouncedRef.current);
                    console.log('   - parachuteProcessingRef.current:', parachuteProcessingRef.current);
                    console.log('   - data.statusFlags:', data.statusFlags);
                    console.log('   - maxAltitudeRef.current:', maxAltitudeRef.current);
                    
                    if (speakFunction) {
                      const flags = parseStatusFlags(data.statusFlags);
                      console.log('   - Parsed flags:', flags);
                      console.log('   - parachuteDeployed:', flags.parachuteDeployed);
                      
                      // ИСПРАВЛЕНИЕ: Обрабатываем парашют только ОДИН раз
                      if (flags.parachuteDeployed && !parachuteProcessingRef.current) {
                        console.log('🎉 PARACHUTE DEPLOYED - Starting voice sequence!');
                        
                        // Устанавливаем флаг, что начали обработку парашюта
                        parachuteProcessingRef.current = true;
                        
                        // 1. Озвучиваем парашют сразу (добавляем в очередь)
                        console.log('🔊 Queueing parachute deployed message');
                        queueSpeech("parachute successfully deployed");
                        
                        // 2. Через 3 секунды озвучиваем максимальную высоту (даем время на произношение)
                        console.log('⏰ Scheduling max altitude announcement in 3 seconds...');
                        console.log('   - Current max altitude:', maxAltitudeRef.current);
                        
                        setTimeout(() => {
                          console.log('🕐 Max altitude timeout executed');
                          console.log('   - maxAltitudeRef.current:', maxAltitudeRef.current);
                          
                          if (maxAltitudeRef.current > 0) {
                            const roundedAltitude = Math.round(maxAltitudeRef.current * 10) / 10;
                            console.log(`📢 Queueing max altitude: ${roundedAltitude}m`);
                            queueSpeech(`maximum altitude is ${roundedAltitude} meters`);
                            setMaxAltitudeAnnounced(true);
                            maxAltitudeAnnouncedRef.current = true;
                            console.log(`✅ Max altitude queued: ${roundedAltitude}m`);
                          } else {
                            console.log('❌ Max altitude is 0, not announcing');
                          }
                        }, 3000); // Увеличил до 3 секунд чтобы дать время на произношение
                        
                        setParachuteAnnounced(true);
                        parachuteAnnouncedRef.current = true;
                        console.log('✅ Voice sequence started');
                        
                      } else if (flags.parachuteDeployed && parachuteProcessingRef.current) {
                        console.log('⚠️ Parachute already processed - ignoring duplicate packets');
                      } else {
                        console.log('❌ Parachute not deployed in this packet');
                      }
                    } else {
                      console.log('🔇 speakFunction not available');
                    }
                    
                  } else {
                    console.log('❌ Failed to parse telemetry data');
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('📕 Read error:', error);
          setConnectionStatus('error');
          toast.error('Connection lost. Please reconnect.');
        }
      };
      
      readLoop();
      
    } catch (error) {
      console.error('📕 Connection error:', error);
      setConnectionStatus('error');
      toast.error('Failed to establish connection');
    }
  }, [speakFunction, baselineAltitude, baselineGForce, queueSpeech]);

  // ... остальной код остается таким же ...

  const clearData = useCallback(() => {
    console.log('🗑️ Clearing all data and resetting states');
    
    // ИСПРАВЛЕНИЕ: Очищаем очередь речи и сбрасываем флаги
    speechQueueRef.current = [];
    isSpeakingRef.current = false;
    
    setTelemetryData([]);
    setCurrentData(null);
    setCurrentSpeed(0);
    setFlightState('pre-flight');
    setLaunchTime(null);
    setLandingTime(null);
    setBaselineAltitude(null);
    setBaselineGForce(null);
    setMaxAltitudeAnnounced(false);
    setParachuteAnnounced(false);
    parachuteAnnouncedRef.current = false;
    maxAltitudeAnnouncedRef.current = false;
    maxAltitudeRef.current = 0;
    parachuteProcessingRef.current = false;
    console.log('✅ All states reset');
  }, []);

  // ... остальной код остается таким же ...

  return {
    isConnected,
    connectionStatus,
    telemetryData,
    currentData,
    rawData,
    textMessages,
    maxAltitude,
    flightTime,
    flightState,
    currentSpeed,
    handleConnect,
    handleDisconnect,
    sendCommand,
    clearData,
    clearRawData,
    exportData
  };
};
