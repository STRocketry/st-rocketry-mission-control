import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TelemetryData } from "@/types/telemetry";
import { 
  Rocket, 
  Umbrella, 
  AlertTriangle, 
  CheckCircle, 
  Timer,
  Zap
} from "lucide-react";

interface StatusPanelProps {
  data: TelemetryData | null;
  isLive: boolean;
  flightTime: number;
  dataPoints: number;
}

export const StatusPanel = ({ data, isLive, flightTime, dataPoints }: StatusPanelProps) => {
  const getFlightPhase = (statusFlags: number) => {
    if (statusFlags & 128) return { phase: "CRITICAL ERROR", color: "text-mission-critical", icon: AlertTriangle };
    if (statusFlags & 1) return { phase: "RECOVERY", color: "text-mission-success", icon: Umbrella };
    if (statusFlags & 2) return { phase: "POWERED FLIGHT", color: "text-mission-warning", icon: Rocket };
    return { phase: "STANDBY", color: "text-mission-neutral", icon: CheckCircle };
  };

  const flightPhase = data ? getFlightPhase(data.statusFlags) : null;
  const IconComponent = flightPhase?.icon || CheckCircle;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusFlags = (flags: number) => {
    const statuses = [];
    if (flags & 1) statuses.push({ text: "PARACHUTE DEPLOYED", color: "bg-mission-success" });
    if (flags & 2) statuses.push({ text: "LAUNCH DETECTED", color: "bg-mission-warning" });
    if (flags & 4) statuses.push({ text: "LOW VOLTAGE", color: "bg-mission-warning" });
    if (flags & 128) statuses.push({ text: "CRITICAL ERROR", color: "bg-mission-critical" });
    return statuses;
  };

  return (
    <div className="space-y-4">
      {/* Flight Status */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 relative">
        {isLive && (
          <div className="absolute inset-0 border border-primary/50 rounded-lg animate-pulse" />
        )}
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">FLIGHT STATUS</h3>
          {isLive && (
            <Badge className="bg-mission-success text-background animate-pulse">
              LIVE
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <IconComponent className={`h-8 w-8 ${flightPhase?.color || 'text-muted-foreground'}`} />
            <div>
              <p className="font-bold text-lg">
                {flightPhase?.phase || "NO DATA"}
              </p>
              <p className="text-sm text-muted-foreground">Current Phase</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Timer className="h-8 w-8 text-primary" />
            <div>
              <p className="font-bold text-lg font-mono telemetry-display">
                {formatTime(flightTime)}
              </p>
              <p className="text-sm text-muted-foreground">Flight Time</p>
            </div>
          </div>
        </div>
      </Card>

      {/* System Status */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <h3 className="text-lg font-bold mb-4">SYSTEM STATUS</h3>
        
        <div className="space-y-3">
          {data && getStatusFlags(data.statusFlags).map((status, index) => (
            <div key={index} className="flex items-center gap-2">
              <Badge className={status.color}>
                {status.text}
              </Badge>
            </div>
          ))}
          
          {(!data || getStatusFlags(data.statusFlags).length === 0) && (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-mission-success" />
              <span className="text-sm">All systems nominal</span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Data Points:</span>
            <span className="font-mono font-bold">{dataPoints}</span>
          </div>
          {data && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Mission Time:</span>
              <span className="font-mono font-bold">
                T+{(data.time / 1000).toFixed(1)}s
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Stats */}
      {data && (
        <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
          <h3 className="text-lg font-bold mb-4">QUICK STATS</h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max Alt:</span>
              <span className="font-mono font-bold text-primary">
                {data.maxAltitude.toFixed(1)}m
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Alt:</span>
              <span className="font-mono font-bold">
                {data.altitude.toFixed(1)}m
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Temperature:</span>
              <span className="font-mono font-bold">
                {data.temperature.toFixed(1)}°C
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Battery:</span>
              <span className="font-mono font-bold">
                {data.voltage.toFixed(2)}V
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};