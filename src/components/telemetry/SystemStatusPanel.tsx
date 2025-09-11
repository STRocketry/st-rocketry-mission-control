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
    if (condition === null) return { variant: "secondary" as const, text: "NO DATA" };
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
      <h3 className="text-lg font-bold mb-6 text-center">SYSTEM STATUS</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Memory & Sensors Column */}
        <div className="space-y-4 p-4 rounded-lg border-2 border-border/30 bg-muted/10">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">EEPROM:</span>
            <Badge {...getStatusBadge(flags?.eepromEnabled, "ENABLED", "DISABLED")}>
              {getStatusBadge(flags?.eepromEnabled, "ENABLED", "DISABLED").text}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">BMP180:</span>
            <Badge {...getSensorStatus("BMP180")}>
              {getSensorStatus("BMP180").text}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">MPU6050:</span>
            <Badge {...getSensorStatus("MPU6050")}>
              {getSensorStatus("MPU6050").text}
            </Badge>
          </div>
        </div>
        
        {/* System Status Column */}
        <div className="space-y-4 p-4 rounded-lg border-2 border-border/30 bg-muted/10">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">SERVO:</span>
            <Badge {...getStatusBadge(flags?.servoOpen, "OPEN", "CLOSED")}>
              {getStatusBadge(flags?.servoOpen, "OPEN", "CLOSED").text}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">CALIB:</span>
            <Badge {...getStatusBadge(flags?.calibDone, "DONE", "EMPTY")}>
              {getStatusBadge(flags?.calibDone, "DONE", "EMPTY").text}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">SYSTEM:</span>
            <Badge {...getSystemStatus()}>
              {getSystemStatus().text}
            </Badge>
          </div>
        </div>
        
        {/* Flight Events Column */}
        <div className="space-y-4 p-4 rounded-lg border-2 border-border/30 bg-muted/10">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Launch:</span>
            <Badge {...getStatusBadge(flags?.launchDetected, "DETECTED", "NO")}>
              {getStatusBadge(flags?.launchDetected, "DETECTED", "NO").text}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Hatch:</span>
            <Badge {...getStatusBadge(flags?.hatchOpen, "OPENED", "CLOSED")}>
              {getStatusBadge(flags?.hatchOpen, "OPENED", "CLOSED").text}
            </Badge>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Parachute:</span>
            <Badge {...getStatusBadge(flags?.parachuteDeployed, "DEPLOYED", "SAFE")}>
              {getStatusBadge(flags?.parachuteDeployed, "DEPLOYED", "SAFE").text}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
};
