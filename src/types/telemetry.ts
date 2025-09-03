export interface TelemetryData {
  time: number;           // Time since launch (ms)
  altitude: number;       // Current altitude (m)
  maxAltitude: number;    // Maximum achieved altitude (m)
  temperature: number;    // Sensor temperature (°C)
  voltage: number;        // Battery voltage (V)
  accelY: number;         // Acceleration Y-axis (g)
  angleX: number;         // Absolute rotation angle X-axis (degrees) - Roll
  angleY: number;         // Absolute rotation angle Y-axis (degrees) - Pitch
  angleZ: number;         // Absolute rotation angle Z-axis (degrees) - Yaw
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
    
    if (values.length !== 10) {
      console.warn('Invalid packet length:', values.length, 'expected 10');
      return null;
    }

    return {
      time: parseInt(values[0]),
      altitude: parseFloat(values[1]),
      maxAltitude: parseFloat(values[2]),
      temperature: parseFloat(values[3]),
      voltage: parseFloat(values[4]),
      accelY: parseFloat(values[5]),
      angleX: parseFloat(values[6]),
      angleY: parseFloat(values[7]),
      angleZ: parseFloat(values[8]),
      statusFlags: parseInt(values[9])
    };
  } catch (error) {
    console.error('Error parsing telemetry packet:', error);
    return null;
  }
};