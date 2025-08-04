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
  const [lastStatusFlags, setLastStatusFlags] = useState<number>(0);
  const [maxAltitudeAnnounced, setMaxAltitudeAnnounced] = useState(false);
  
  const portRef = useRef<any>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const bufferRef = useRef<string>('');

  const handleConnect = useCallback(async (port: any) => {
    try {
      setConnectionStatus('connecting');
      portRef.current = port;
      
      // Start reading data
      const reader = port.readable!.getReader();
      readerRef.current = reader;
      
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Read loop
      const readLoop = async () => {
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            
            // Convert Uint8Array to string and append to buffer
            const text = new TextDecoder().decode(value);
            bufferRef.current += text;
            
            // Process complete lines
            const lines = bufferRef.current.split('\n');
            bufferRef.current = lines.pop() || ''; // Keep incomplete line in buffer
            
            for (const line of lines) {
              if (line.trim()) {
                // Store all raw data
                setRawData(prev => [...prev, line.trim()]);
                
                // Check if it's a text message (contains letters)
                if (/[a-zA-Z]/.test(line) && !line.includes(',')) {
                  setTextMessages(prev => [...prev, line.trim()]);
                  toast.info(`Flight Event: ${line.trim()}`);
                  
                  // Voice alerts for specific events
                  if (speakFunction) {
                    const message = line.trim().toLowerCase();
                    if (message.includes('apogee')) {
                      const altMatch = message.match(/(\d+\.?\d*)/);
                      const altitude = altMatch ? altMatch[1] : 'unknown';
                      speakFunction(`Apogee detected at ${altitude} meters`);
                    }
                    if (message.includes('parachute') && message.includes('deploy')) {
                      speakFunction('Parachute deployed');
                    }
                  }
                } else {
                  // Try to parse as telemetry data
                  const data = parseTelemetryPacket(line);
                  if (data) {
                    setCurrentData(data);
                    setTelemetryData(prev => [...prev, data]);
                    
                    // Voice alerts for status changes
                    if (speakFunction && data.statusFlags !== lastStatusFlags) {
                      const currentFlags = parseStatusFlags(data.statusFlags);
                      const lastFlags = parseStatusFlags(lastStatusFlags);
                      
                      if (currentFlags.parachuteDeployed && !lastFlags.parachuteDeployed) {
                        speakFunction("Parachute deployed");
                      }
                      
                      setLastStatusFlags(data.statusFlags);
                    }
                    
                    // Announce max altitude when descending significantly
                    if (speakFunction && !maxAltitudeAnnounced && data.altitude < data.maxAltitude * 0.8 && data.maxAltitude > 10) {
                      speakFunction(`Maximum altitude ${data.maxAltitude.toFixed(0)} meters`);
                      setMaxAltitudeAnnounced(true);
                    }
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Read error:', error);
          setConnectionStatus('error');
          toast.error('Connection lost. Please reconnect.');
        }
      };
      
      readLoop();
      
    } catch (error) {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      toast.error('Failed to establish connection');
    }
  }, []);

  const handleDisconnect = useCallback(async () => {
    try {
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
      
      toast.success('Disconnected successfully');
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Error during disconnect');
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      handleDisconnect();
    };
  }, [handleDisconnect]);

  const clearData = useCallback(() => {
    setTelemetryData([]);
    setCurrentData(null);
  }, []);

  const clearRawData = useCallback(() => {
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
      const headers = 'time,altitude,maxAltitude,temperature,voltage,accelX,accelY,accelZ,statusFlags\n';
      const rows = telemetryData.map(d => 
        `${d.time},${d.altitude},${d.maxAltitude},${d.temperature},${d.voltage},${d.accelX},${d.accelY},${d.accelZ},${d.statusFlags}`
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

  const flightTime = currentData?.time || 0;

  return {
    isConnected,
    connectionStatus,
    telemetryData,
    currentData,
    rawData,
    textMessages,
    maxAltitude,
    flightTime,
    handleConnect,
    handleDisconnect,
    clearData,
    clearRawData,
    exportData
  };
};