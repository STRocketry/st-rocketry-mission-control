import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TelemetryData } from "@/types/telemetry";
import { Rocket, Umbrella, AlertTriangle, CheckCircle, Timer } from "lucide-react";

interface FlightStatusPanelProps {
  data: TelemetryData | null;
  isLive: boolean;
  flightTime: number;
  dataPoints: number;
}

export const FlightStatusPanel = ({
  data,
  isLive,
  flightTime,
  dataPoints
}: FlightStatusPanelProps) => {
  const getFlightPhase = (statusFlags: number) => {
    if (statusFlags & 128) return {
      phase: "CRITICAL ERROR",
      color: "text-mission-critical",
      icon: AlertTriangle
    };
    if (statusFlags & 8) return {
      phase: "RECOVERY",
      color: "text-mission-success",
      icon: Umbrella
    };
    if (statusFlags & 2) return {
      phase: "POWERED FLIGHT",
      color: "text-mission-warning",
      icon: Rocket
    };
    return {
      phase: "STANDBY",
      color: "text-mission-neutral",
      icon: CheckCircle
    };
  };

  const flightPhase = data ? getFlightPhase(data.statusFlags) : null;
  const IconComponent = flightPhase?.icon || CheckCircle;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 relative">
      {isLive && <div className="absolute inset-0 border border-primary/50 rounded-lg animate-pulse" />}
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">FLIGHT STATUS</h3>
        {isLive && <Badge className="bg-mission-success text-background animate-pulse">
            LIVE
          </Badge>}
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
  );
};