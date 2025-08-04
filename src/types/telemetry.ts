export interface TelemetryData {
  time: number;           // Time since launch (ms)
  altitude: number;       // Current altitude (m)
  maxAltitude: number;    // Maximum achieved altitude (m)
  temperature: number;    // Sensor temperature (°C)
  voltage: number;        // Battery voltage (V)
  accelX: number;         // Acceleration X-axis (g)
  accelY: number;         // Acceleration Y-axis (g)
  accelZ: number;         // Acceleration Z-axis (g)
  statusFlags: number;    // Status bitmask
}

export interface FlightSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  telemetryData: TelemetryData[];
  maxAltitude: number;
  flightDuration: number;
  status: 'active' | 'completed' | 'error';
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface StatusFlags {
  servoOpen: boolean;           // 0b00000001 (1) - Servo position
  launchDetected: boolean;      // 0b00000010 (2) - Launch detected
  hatchOpen: boolean;           // 0b00000100 (4) - Hatch status
  parachuteDeployed: boolean;   // 0b00001000 (8) - Parachute deployed
  criticalError: boolean;       // 0b10000000 (128) - Critical error
}

export const parseStatusFlags = (flags: number): StatusFlags => ({
  servoOpen: !!(flags & 1),          // 0b00000001 (1) - Servo position (0=closed, 1=open)
  launchDetected: !!(flags & 2),     // 0b00000010 (2) - Launch detected (1=launched)
  hatchOpen: !!(flags & 4),          // 0b00000100 (4) - Hatch status (0=closed, 1=open)
  parachuteDeployed: !!(flags & 8),  // 0b00001000 (8) - Parachute deployed (1=deployed)
  criticalError: !!(flags & 128)     // 0b10000000 (128) - Critical error
});

export const parseTelemetryPacket = (csvLine: string): TelemetryData | null => {
  try {
    const values = csvLine.trim().split(',').map(v => v.trim());
    
    if (values.length !== 9) {
      console.warn('Invalid packet length:', values.length);
      return null;
    }

    return {
      time: parseInt(values[0]),
      altitude: parseFloat(values[1]),
      maxAltitude: parseFloat(values[2]),
      temperature: parseFloat(values[3]),
      voltage: parseFloat(values[4]),
      accelX: parseFloat(values[5]),
      accelY: parseFloat(values[6]),
      accelZ: parseFloat(values[7]),
      statusFlags: parseInt(values[8])
    };
  } catch (error) {
    console.error('Error parsing telemetry packet:', error);
    return null;
  }
};