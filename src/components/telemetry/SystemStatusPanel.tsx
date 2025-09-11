import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TelemetryData, parseStatusFlags } from "@/types/telemetry";

interface SystemStatusPanelProps {
  data: TelemetryData | null;
  textMessages: string[];
}

export const SystemStatusPanel = ({ data, textMessages }: SystemStatusPanelProps) => {
  const flags = data ? parseStatusFlags(data.statusFlags) : null;

  // Helper function to determine badge variant and status text
  const getStatusBadge = (condition: boolean | null, trueText: string, falseText: string, useErrorVariant = false) => {
    if (condition === null) return { variant: "secondary" as const, text: "N/A" };
    if (useErrorVariant) {
      return {
        variant: condition ? "default" as const : "destructive" as const,
        text: condition ? trueText : falseText
      };
    }
    return {
      variant: condition ? "default" as const : "secondary" as const,
      text: condition ? trueText : falseText
    };
  };

  // Sensor status logic based on text messages
  const getSensorStatus = (sensorName: string) => {
    const hasSystemReady = textMessages.some(msg => msg.includes("SYSTEM: READY"));
    const hasError = textMessages.some(msg => msg.includes(`ERR:${sensorName}_INIT`));
    
    if (hasError) return { variant: "destructive" as const, text: "ERROR" };
    if (hasSystemReady) return { variant: "default" as const, text: "OK" };
    return { variant: "secondary" as const, text: "NO DATA" };
  };

  // System status logic based on text messages
  const getSystemStatus = () => {
    const hasSystemReady = textMessages.some(msg => msg.includes("SYSTEM: READY"));
    const hasError = textMessages.some(msg => msg.includes("ERR:"));
    
    if (hasError) return { variant: "destructive" as const, text: "ERROR" };
    if (hasSystemReady) return { variant: "default" as const, text: "READY" };
    return { variant: "secondary" as const, text: "NO DATA" };
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50">
      <h3 className="text-lg font-bold mb-4">ROCKET STATUS</h3>
      
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">EEPROM:</span>
          <Badge {...getStatusBadge(flags?.eepromEnabled, "ENABLED", "DISABLED")}>
            {getStatusBadge(flags?.eepromEnabled, "ENABLED", "DISABLED").text}
          </Badge>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">BMP180:</span>
          <Badge {...getSensorStatus("BMP180")}>
            {getSensorStatus("BMP180").text}
          </Badge>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">MPU6050:</span>
          <Badge {...getSensorStatus("MPU6050")}>
            {getSensorStatus("MPU6050").text}
          </Badge>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">SERVO:</span>
          <Badge {...getStatusBadge(flags?.servoOpen, "OPEN", "CLOSED")}>
            {getStatusBadge(flags?.servoOpen, "OPEN", "CLOSED").text}
          </Badge>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">CALIB:</span>
          <Badge {...getStatusBadge(flags?.calibDone, "DONE", "EMPTY")}>
            {getStatusBadge(flags?.calibDone, "DONE", "EMPTY").text}
          </Badge>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">SYSTEM:</span>
          <Badge {...getSystemStatus()}>
            {getSystemStatus().text}
          </Badge>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Launch:</span>
          <Badge {...getStatusBadge(flags?.launchDetected, "DETECTED", "NO")}>
            {getStatusBadge(flags?.launchDetected, "DETECTED", "NO").text}
          </Badge>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Hatch:</span>
          <Badge {...getStatusBadge(flags?.hatchOpen, "OPENED", "CLOSED")}>
            {getStatusBadge(flags?.hatchOpen, "OPENED", "CLOSED").text}
          </Badge>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Parachute:</span>
          <Badge {...getStatusBadge(flags?.parachuteDeployed, "DEPLOYED", "SAFE")}>
            {getStatusBadge(flags?.parachuteDeployed, "DEPLOYED", "SAFE").text}
          </Badge>
        </div>
      </div>
    </Card>
  );
};