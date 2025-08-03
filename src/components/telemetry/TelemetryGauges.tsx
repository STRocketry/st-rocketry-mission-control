import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TelemetryData } from "@/types/telemetry";
import { Gauge, Thermometer, Battery, Activity } from "lucide-react";

interface TelemetryGaugesProps {
  data: TelemetryData | null;
  isLive: boolean;
}

export const TelemetryGauges = ({ data, isLive }: TelemetryGaugesProps) => {
  if (!data) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 bg-card/30 border-border/30">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-2xl font-mono font-bold">--</p>
              <p className="text-sm text-muted-foreground">No Data</p>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const getVoltageStatus = (voltage: number) => {
    if (voltage < 3.2) return { color: "text-mission-critical", status: "CRITICAL" };
    if (voltage < 3.5) return { color: "text-mission-warning", status: "LOW" };
    return { color: "text-mission-success", status: "GOOD" };
  };

  const voltageStatus = getVoltageStatus(data.voltage);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Altitude */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 relative overflow-hidden">
        {isLive && (
          <div className="absolute top-0 left-0 w-1 h-full bg-mission-success animate-pulse-data" />
        )}
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/20 flex items-center justify-center">
            <Gauge className="h-6 w-6 text-primary" />
          </div>
          <p className="text-3xl font-mono font-bold telemetry-display text-primary">
            {data.altitude.toFixed(1)}
          </p>
          <p className="text-sm text-muted-foreground">ALTITUDE (m)</p>
          <Badge variant="secondary" className="mt-2 text-xs">
            MAX: {data.maxAltitude.toFixed(1)}m
          </Badge>
        </div>
      </Card>

      {/* Temperature */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-mission-info/20 flex items-center justify-center">
            <Thermometer className="h-6 w-6 text-mission-info" />
          </div>
          <p className="text-3xl font-mono font-bold telemetry-display text-mission-info">
            {data.temperature.toFixed(1)}
          </p>
          <p className="text-sm text-muted-foreground">TEMP (°C)</p>
        </div>
      </Card>

      {/* Battery Voltage */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-mission-success/20 flex items-center justify-center">
            <Battery className="h-6 w-6 text-mission-success" />
          </div>
          <p className={`text-3xl font-mono font-bold telemetry-display ${voltageStatus.color}`}>
            {data.voltage.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">VOLTAGE (V)</p>
          <Badge className={`mt-2 text-xs ${voltageStatus.color}`}>
            {voltageStatus.status}
          </Badge>
        </div>
      </Card>

      {/* G-Force */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-mission-warning/20 flex items-center justify-center">
            <Activity className="h-6 w-6 text-mission-warning" />
          </div>
          <p className="text-3xl font-mono font-bold telemetry-display text-mission-warning">
            {Math.sqrt(data.accelX ** 2 + data.accelY ** 2 + data.accelZ ** 2).toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground">G-FORCE</p>
          <div className="mt-2 text-xs text-muted-foreground">
            <div>X: {data.accelX.toFixed(2)}g</div>
            <div>Y: {data.accelY.toFixed(2)}g</div>
            <div>Z: {data.accelZ.toFixed(2)}g</div>
          </div>
        </div>
      </Card>
    </div>
  );
};