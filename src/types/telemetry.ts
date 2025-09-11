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
  eepromEnabled: boolean;       // 0b000000001 (1) - EEPROM enabled
  bmp180OK: boolean;           // 0b000000010 (2) - BMP180 sensor OK
  mpu6050OK: boolean;          // 0b000000100 (4) - MPU6050 sensor OK
  servoOpen: boolean;          // 0b000001000 (8) - Servo position
  calibDone: boolean;          // 0b000010000 (16) - Calibration complete
  systemReady: boolean;        // 0b000100000 (32) - System ready
  launchDetected: boolean;     // 0b001000000 (64) - Launch detected
  hatchOpen: boolean;          // 0b010000000 (128) - Hatch status
  parachuteDeployed: boolean;  // 0b100000000 (256) - Parachute deployed
}

export const parseStatusFlags = (flags: number): StatusFlags => ({
  eepromEnabled: !!(flags & 1),      // 0b000000001 (1) - EEPROM enabled
  bmp180OK: !!(flags & 2),           // 0b000000010 (2) - BMP180 sensor OK
  mpu6050OK: !!(flags & 4),          // 0b000000100 (4) - MPU6050 sensor OK
  servoOpen: !!(flags & 8),          // 0b000001000 (8) - Servo position (0=closed, 1=open)
  calibDone: !!(flags & 16),         // 0b000010000 (16) - Calibration complete
  systemReady: !!(flags & 32),       // 0b000100000 (32) - System ready
  launchDetected: !!(flags & 64),    // 0b001000000 (64) - Launch detected (1=launched)
  hatchOpen: !!(flags & 128),        // 0b010000000 (128) - Hatch status (0=closed, 1=open)
  parachuteDeployed: !!(flags & 256) // 0b100000000 (256) - Parachute deployed (1=deployed)
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