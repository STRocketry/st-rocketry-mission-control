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
  
  // ДОБАВЛЕНО: Ref для хранения timeout ID
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
                    console.log('   - data.statusFlags:', data.statusFlags);
                    console.log('   - maxAltitudeRef.current:', maxAltitudeRef.current);
                    
                    if (speakFunction) {
                      const flags = parseStatusFlags(data.statusFlags);
                      console.log('   - Parsed flags:', flags);
                      console.log('   - parachuteDeployed:', flags.parachuteDeployed);
                      
                      if (flags.parachuteDeployed && !parachuteAnnouncedRef.current) {
                        console.log('🎉 PARACHUTE DEPLOYED - Triggering voice alert!');
                        
                        // Озвучиваем парашют сразу
                        speakFunction("parachute successfully deployed");
                        
                        console.log('⏰ Scheduling max altitude announcement...');
                        console.log('   - Current max altitude from ref:', maxAltitudeRef.current);
                        console.log('   - maxAltitudeAnnouncedRef.current:', maxAltitudeAnnouncedRef.current);
                        
                        // ДОБАВЛЕНО: Очищаем предыдущий timeout если есть
                        if (timeoutRef.current) {
                          clearTimeout(timeoutRef.current);
                        }
                        
                        // ИСПРАВЛЕНИЕ: Создаем новый timeout
                        timeoutRef.current = setTimeout(() => {
                          console.log('🕐 Timeout executed - checking max altitude...');
                          console.log('   - maxAltitudeRef.current in timeout:', maxAltitudeRef.current);
                          console.log('   - maxAltitudeAnnouncedRef.current in timeout:', maxAltitudeAnnouncedRef.current);
                          
                          if (maxAltitudeRef.current > 0 && !maxAltitudeAnnouncedRef.current) {
                            const roundedAltitude = Math.round(maxAltitudeRef.current * 10) / 10;
                            console.log(`📢 Speaking max altitude: ${roundedAltitude}m`);
                            speakFunction(`maximum altitude is ${roundedAltitude} meters`);
                            setMaxAltitudeAnnounced(true);
                            maxAltitudeAnnouncedRef.current = true;
                            console.log(`✅ Max altitude announced: ${roundedAltitude}m`);
                          } else {
                            console.log('❌ Max altitude not announced because:', {
                              maxAltitude: maxAltitudeRef.current,
                              maxAltitudeAnnounced: maxAltitudeAnnouncedRef.current
                            });
                          }
                          
                          // Очищаем ref после выполнения
                          timeoutRef.current = null;
                        }, 2000);
                        
                        setParachuteAnnounced(true);
                        parachuteAnnouncedRef.current = true;
                        console.log('✅ Voice alert triggered and state updated');
                      } else if (flags.parachuteDeployed) {
                        console.log('⚠️ Parachute deployed but already announced');
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
  }, [speakFunction, baselineAltitude, baselineGForce]);

  useEffect(() => {
    console.log('📈 telemetryData updated:', {
      length: telemetryData.length,
      maxAltitude: telemetryData.length > 0 ? Math.max(...telemetryData.map(d => d.altitude)) : 0,
      lastAltitude: telemetryData[telemetryData.length - 1]?.altitude,
      maxAltitudeRef: maxAltitudeRef.current
    });
  }, [telemetryData]);

  // ДОБАВЛЕНО: Очистка timeout при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const sendCommand = useCallback(async (command: string, count: number = 1, intervalMs: number = 100) => {
    if (!portRef.current || !isConnected) {
      toast.error("Not connected to serial port");
      return;
    }

    try {
      const writer = portRef.current.writable.getWriter();
      
      for (let i = 0; i < count; i++) {
        const data = new TextEncoder().encode(command + '\n');
        await writer.write(data);
        
        if (i < count - 1) {
          await new Promise(resolve => setTimeout(resolve, intervalMs));
        }
      }
      
      writer.releaseLock();
    } catch (error) {
      console.error('Error sending command:', error);
      toast.error(`Failed to send command: ${error}`);
    }
  }, [isConnected]);

  const handleDisconnect = useCallback(async () => {
    try {
      console.log('🔌 Disconnecting...');
      
      // ДОБАВЛЕНО: Очищаем timeout при отключении
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      if (readerRef.current) {
        await readerRef.current.cancel();
        readerRef.current = null;
      }
      
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
      
      setIsConnected(false);
      setConnectionStatus('disconnected');
      bufferRef.current = '';
      
      console.log('✅ Disconnected successfully');
      toast.success('Disconnected successfully');
    } catch (error) {
      console.error('📕 Disconnect error:', error);
      toast.error('Error during disconnect');
    }
  }, []);

  useEffect(() => {
    return () => {
      handleDisconnect();
    };
  }, [handleDisconnect]);

  const clearData = useCallback(() => {
    console.log('🗑️ Clearing all data and resetting states');
    
    // ДОБАВЛЕНО: Очищаем timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
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
    console.log('✅ All states reset');
  }, []);

  const clearRawData = useCallback(() => {
    console.log('🗑️ Clearing raw data');
    setRawData([]);
    setTextMessages([]);
  }, []);

  const exportData = useCallback((format: 'csv' | 'json') => {
    if (telemetryData.length === 0) {
      toast.error('No data to export');
      return;
    }

    let content: string;
    let mimeType: string;
    let extension: string;

    if (format === 'csv') {
      const headers = 'time,altitude,maxAltitude,temperature,voltage,accelY,angleX,angleY,angleZ,statusFlags\n';
      const rows = telemetryData.map(d => 
        `${d.time},${d.altitude},${d.maxAltitude},${d.temperature},${d.voltage},${d.accelY},${d.angleX},${d.angleY},${d.angleZ},${d.statusFlags}`
      ).join('\n');
      content = headers + rows;
      mimeType = 'text/csv';
      extension = 'csv';
    } else {
      content = JSON.stringify({
        exportTime: new Date().toISOString(),
        dataPoints: telemetryData.length,
        maxAltitude: Math.max(...telemetryData.map(d => d.maxAltitude)),
        flightDuration: telemetryData[telemetryData.length - 1]?.time || 0,
        telemetryData
      }, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rocket_telemetry_${new Date().toISOString().split('T')[0]}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Data exported as ${format.toUpperCase()}`);
  }, [telemetryData]);

  const maxAltitude = telemetryData.length > 0 
    ? Math.max(...telemetryData.map(d => d.maxAltitude))
    : 0;

  const flightTime = (() => {
    if (!launchTime) return 0;
    if (landingTime) return landingTime - launchTime;
    if (flightState === 'launched') return Date.now() - launchTime;
    return 0;
  })();

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
