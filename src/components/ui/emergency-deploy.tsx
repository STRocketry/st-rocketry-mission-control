import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface EmergencyDeployProps {
  isConnected: boolean;
  onDeploy: () => void;
}

export const EmergencyDeploy = ({ isConnected, onDeploy }: EmergencyDeployProps) => {
  const [isDeploying, setIsDeploying] = useState(false);

  const handleEmergencyDeploy = async () => {
    if (!isConnected) {
      toast.error("No connection to rocket");
      return;
    }

    setIsDeploying(true);
    toast.warning("Emergency parachute deploy initiated!");
    
    try {
      onDeploy();
    } finally {
      setTimeout(() => {
        setIsDeploying(false);
      }, 1000);
    }
  };

  return (
    <Card className="p-3 bg-destructive/10 backdrop-blur-sm border-destructive/30">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h4 className="text-sm font-semibold text-destructive">EMERGENCY</h4>
        </div>
        
        <Button
          variant="destructive"
          onClick={handleEmergencyDeploy}
          disabled={!isConnected || isDeploying}
          className="w-full text-xs font-bold"
        >
          {isDeploying ? "DEPLOYING..." : "DEPLOY PARACHUTE"}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          Manual emergency parachute deployment
        </p>
      </div>
    </Card>
  );
};