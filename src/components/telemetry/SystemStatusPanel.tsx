import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TelemetryData, parseStatusFlags } from "@/types/telemetry";

interface SystemStatusPanelProps {
  data: TelemetryData | null;
}

export const SystemStatusPanel = ({ data }: SystemStatusPanelProps) => {
  const flags = data ? parseStatusFlags(data.statusFlags) : null;

  return (
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
      </div>
    </Card>
  );
};