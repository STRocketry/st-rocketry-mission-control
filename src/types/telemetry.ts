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
  servoOpen: boolean;          // 0b0001 (1) - Servo position (bit 0)
  launchDetected: boolean;     // 0b0010 (2) - Launch detected (bit 1)
  hatchOpen: boolean;          // 0b0100 (4) - Hatch status (bit 2)
  parachuteDeployed: boolean;  // 0b1000 (8) - Parachute deployed (bit 3)
  eepromEnabled: boolean;      // 0b00010000 (16) - EEPROM enabled (bit 4)
  bmp180OK: boolean;           // 0b00100000 (32) - BMP180 sensor OK (bit 5)
  mpu6050OK: boolean;          // 0b01000000 (64) - MPU6050 sensor OK (bit 6)
  calibDone: boolean;          // 0b10000000 (128) - Calibration complete (bit 7)
  systemReady: boolean;        // Higher bits - System ready
}

export const parseStatusFlags = (flags: number): StatusFlags => ({
  servoOpen: !!(flags & 1),          // 0b0001 (1) - Servo position (bit 0)
  launchDetected: !!(flags & 2),     // 0b0010 (2) - Launch detected (bit 1)
  hatchOpen: !!(flags & 4),          // 0b0100 (4) - Hatch status (bit 2)
  parachuteDeployed: !!(flags & 8),  // 0b1000 (8) - Parachute deployed (bit 3)
  eepromEnabled: !!(flags & 16),     // 0b00010000 (16) - EEPROM enabled (bit 4)
  bmp180OK: !!(flags & 32),          // 0b00100000 (32) - BMP180 sensor OK (bit 5)
  mpu6050OK: !!(flags & 64),         // 0b01000000 (64) - MPU6050 sensor OK (bit 6)
  calibDone: !!(flags & 128),        // 0b10000000 (128) - Calibration complete (bit 7)
  systemReady: !!(flags & 256)       // Higher bits - System ready
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