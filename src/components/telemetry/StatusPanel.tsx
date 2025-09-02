import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TelemetryData, parseStatusFlags } from "@/types/telemetry";
import { Rocket, Umbrella, AlertTriangle, CheckCircle, Timer, Zap } from "lucide-react";
interface StatusPanelProps {
  data: TelemetryData | null;
  isLive: boolean;
  flightTime: number;
  dataPoints: number;
}
export const StatusPanel = ({
  data,
  isLive,
  flightTime,
  dataPoints
}: StatusPanelProps) => {
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
  const flags = data ? parseStatusFlags(data.statusFlags) : null;
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  const getStatusItems = (flags: any) => {
    if (!flags) return [];
    const items = [];
    if (flags.servoOpen) items.push({
      text: "SERVO OPEN",
      color: "bg-mission-info"
    });
    if (flags.launchDetected) items.push({
      text: "LAUNCH DETECTED",
      color: "bg-mission-warning"
    });
    if (flags.hatchOpen) items.push({
      text: "HATCH OPEN",
      color: "bg-mission-info"
    });
    if (flags.parachuteDeployed) items.push({
      text: "PARACHUTE DEPLOYED",
      color: "bg-mission-success"
    });
    if (flags.criticalError) items.push({
      text: "CRITICAL ERROR",
      color: "bg-mission-critical"
    });
    return items;
  };
  return <div className="space-y-4">
      {/* Flight Status */}
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

      {/* System Status */}
      <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
        <h3 className="text-lg font-bold mb-4">SYSTEM STATUS</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Servo:</span>
            <Badge variant={flags?.servoOpen ? "default" : "secondary"}>
              {flags?.servoOpen ? "OPEN" : "CLOSED"}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Launch:</span>
            <Badge variant={flags?.launchDetected ? "default" : "secondary"}>
              {flags?.launchDetected ? "DETECTED" : "STANDBY"}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Hatch:</span>
            <Badge variant={flags?.hatchOpen ? "default" : "secondary"}>
              {flags?.hatchOpen ? "OPEN" : "CLOSED"}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Parachute:</span>
            <Badge variant={flags?.parachuteDeployed ? "default" : "secondary"}>
              {flags?.parachuteDeployed ? "DEPLOYED" : "STOWED"}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">System:</span>
            <Badge variant={flags?.criticalError ? "destructive" : "default"}>
              {flags?.criticalError ? "ERROR" : "NORMAL"}
            </Badge>
          </div>
        </div>

        
      </Card>

    </div>;
};
