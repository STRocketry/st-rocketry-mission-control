import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { MissionButton } from "@/components/ui/mission-button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Wifi, WifiOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface ConnectionPanelProps {
  onConnect: (port: any) => void;
  onDisconnect: () => void;
  isConnected: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
}

export const ConnectionPanel = ({ 
  onConnect, 
  onDisconnect, 
  isConnected, 
  connectionStatus 
}: ConnectionPanelProps) => {
  const [isRequestingPort, setIsRequestingPort] = useState(false);

  const handleConnect = useCallback(async () => {
    if (!('serial' in navigator)) {
      toast.error("WebSerial API not supported. Please use Chrome or Edge browser.");
      return;
    }

    setIsRequestingPort(true);
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ 
        baudRate: 9600,
        dataBits: 8,
        stopBits: 1,
        parity: 'none'
      });
      
      onConnect(port);
      toast.success("Rocket telemetry connected successfully!");
    } catch (error) {
      console.error("Connection failed:", error);
      toast.error("Failed to connect to rocket. Please check your connection.");
    } finally {
      setIsRequestingPort(false);
    }
  }, [onConnect]);

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-mission-success text-background">CONNECTED</Badge>;
      case 'connecting':
        return <Badge className="bg-mission-warning text-background">CONNECTING</Badge>;
      case 'error':
        return <Badge className="bg-mission-critical text-background">ERROR</Badge>;
      default:
        return <Badge variant="secondary">OFFLINE</Badge>;
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-5 w-5 text-mission-success" />;
      case 'connecting':
        return <Wifi className="h-5 w-5 text-mission-warning animate-pulse" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-mission-critical" />;
      default:
        return <WifiOff className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-bold">ROCKET TELEMETRY</h2>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="flex items-center gap-4">
          {getStatusIcon()}
          
          {!isConnected ? (
            <MissionButton
              variant="mission"
              onClick={handleConnect}
              disabled={isRequestingPort}
              className="min-w-[120px]"
            >
              {isRequestingPort ? "Requesting..." : "CONNECT"}
            </MissionButton>
          ) : (
            <MissionButton
              variant="destructive"
              onClick={onDisconnect}
              className="min-w-[120px]"
            >
              DISCONNECT
            </MissionButton>
          )}
        </div>
      </div>
      
      {connectionStatus === 'disconnected' && (
        <div className="mt-4 p-4 rounded-md bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            Click CONNECT to establish USB connection with your rocket's telemetry system.
            Make sure your rocket is powered on and connected via USB.
          </p>
        </div>
      )}
    </Card>
  );
};