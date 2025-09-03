import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MissionButton } from "@/components/ui/mission-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
import { toast } from "sonner";
interface ButtonConfig {
  title: string;
  command: string;
  color: string;
  numberOfCommands: number;
  intervalMs: number;
}
interface ConfigurableCommandPanelProps {
  onSendCommand: (command: string, count: number, intervalMs: number) => void;
  isConnected: boolean;
}
const defaultButtonConfig: ButtonConfig = {
  title: "DEPLOY",
  command: "DEPLOY",
  color: "#ef4444",
  // red-500
  numberOfCommands: 1,
  intervalMs: 100
};
const predefinedColors = [{
  name: "Red",
  value: "#ef4444"
}, {
  name: "Blue",
  value: "#3b82f6"
}, {
  name: "Green",
  value: "#22c55e"
}, {
  name: "Orange",
  value: "#f97316"
}, {
  name: "Purple",
  value: "#a855f7"
}, {
  name: "Yellow",
  value: "#eab308"
}];
export const ConfigurableCommandPanel = ({
  onSendCommand,
  isConnected
}: ConfigurableCommandPanelProps) => {
  const [button1Config, setButton1Config] = useState<ButtonConfig>({
    ...defaultButtonConfig
  });
  const [button2Config, setButton2Config] = useState<ButtonConfig>({
    ...defaultButtonConfig,
    title: "ABORT",
    command: "ABORT",
    color: "#f97316" // orange-500
  });
  const [editingButton, setEditingButton] = useState<1 | 2 | null>(null);
  const [tempConfig, setTempConfig] = useState<ButtonConfig>(defaultButtonConfig);
  const handleConfigureButton = (buttonNumber: 1 | 2) => {
    const config = buttonNumber === 1 ? button1Config : button2Config;
    setTempConfig({
      ...config
    });
    setEditingButton(buttonNumber);
  };
  const handleSaveConfig = () => {
    // Validate inputs
    if (!tempConfig.title.trim()) {
      toast.error("Button title cannot be empty");
      return;
    }
    if (!tempConfig.command.trim()) {
      toast.error("Command cannot be empty");
      return;
    }
    if (tempConfig.numberOfCommands < 1 || tempConfig.numberOfCommands > 50) {
      toast.error("Number of commands must be between 1 and 50");
      return;
    }
    if (tempConfig.intervalMs < 1) {
      toast.error("Interval must be at least 1ms");
      return;
    }
    if (editingButton === 1) {
      setButton1Config({
        ...tempConfig
      });
    } else if (editingButton === 2) {
      setButton2Config({
        ...tempConfig
      });
    }
    setEditingButton(null);
    toast.success("Button configuration saved");
  };
  const handleButtonClick = (config: ButtonConfig) => {
    if (!isConnected) {
      toast.error("Not connected to serial port");
      return;
    }
    onSendCommand(config.command, config.numberOfCommands, config.intervalMs);
    toast.success(`Sending ${config.numberOfCommands}x "${config.command}" command(s)`);
  };
  const renderButton = (config: ButtonConfig, buttonNumber: 1 | 2) => <div key={buttonNumber} className="flex gap-2">
      <Button onClick={() => handleButtonClick(config)} disabled={!isConnected} className="flex-1 h-12 text-sm font-bold transition-all duration-200" style={{
      backgroundColor: config.color,
      borderColor: config.color,
      color: 'white'
    }}>
        {config.title}
      </Button>
      <Button variant="outline" size="icon" onClick={() => handleConfigureButton(buttonNumber)} className="h-12 w-12 shrink-0">
        <Settings className="h-4 w-4" />
      </Button>
    </div>;
  return <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
      <h3 className="text-base lg:text-lg font-bold mb-3 text-card-foreground">COMMANDS</h3>
      
      <div className="space-y-3">
        {renderButton(button1Config, 1)}
        {renderButton(button2Config, 2)}
      </div>

      <Dialog open={editingButton !== null} onOpenChange={() => setEditingButton(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configure Button {editingButton}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Button Title</Label>
              <Input id="title" value={tempConfig.title} onChange={e => setTempConfig({
              ...tempConfig,
              title: e.target.value
            })} placeholder="Enter button title" />
            </div>

            <div>
              <Label htmlFor="command">Command</Label>
              <Input id="command" value={tempConfig.command} onChange={e => setTempConfig({
              ...tempConfig,
              command: e.target.value
            })} placeholder="Enter command to send" />
            </div>

            <div>
              <Label htmlFor="numberOfCommands">Number of Commands (1-50)</Label>
              <Input id="numberOfCommands" type="number" min={1} max={50} value={tempConfig.numberOfCommands} onChange={e => setTempConfig({
              ...tempConfig,
              numberOfCommands: parseInt(e.target.value) || 1
            })} />
            </div>

            <div>
              <Label htmlFor="intervalMs">Interval (ms)</Label>
              <Input id="intervalMs" type="number" min={1} value={tempConfig.intervalMs} onChange={e => setTempConfig({
              ...tempConfig,
              intervalMs: parseInt(e.target.value) || 1
            })} />
            </div>

            <div>
              <Label>Button Color</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {predefinedColors.map(color => <button key={color.value} className={`h-8 rounded border-2 ${tempConfig.color === color.value ? 'border-primary' : 'border-border'}`} style={{
                backgroundColor: color.value
              }} onClick={() => setTempConfig({
                ...tempConfig,
                color: color.value
              })} title={color.name} />)}
              </div>
              <Input className="mt-2" value={tempConfig.color} onChange={e => setTempConfig({
              ...tempConfig,
              color: e.target.value
            })} placeholder="Or enter HEX color (e.g., #ff0000)" />
            </div>

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingButton(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveConfig} className="flex-1">
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
};