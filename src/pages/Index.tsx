import { useState, useRef, useEffect } from "react";
import { ConnectionPanel } from "@/components/telemetry/ConnectionPanel";
import { TelemetryGauges } from "@/components/telemetry/TelemetryGauges";
import { AltitudeChart } from "@/components/telemetry/AltitudeChart";
import { FlightStatusPanel } from "@/components/telemetry/FlightStatusPanel";
import { SystemStatusPanel } from "@/components/telemetry/SystemStatusPanel";
import { RawDataPanel } from "@/components/telemetry/RawDataPanel";
import RocketVisualization from "@/components/telemetry/RocketVisualization";
import { DateTimeDisplay } from "@/components/ui/date-time-display";
import { VoiceAlerts } from "@/components/ui/voice-alerts";
import { MissionButton } from "@/components/ui/mission-button";
import { useSerialConnection } from "@/hooks/useSerialConnection";
import { ConfigurableCommandPanel } from "@/components/telemetry/ConfigurableCommandPanel";
import { Download, Trash2, Rocket } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  // СОЗДАЕМ ФУНКЦИЮ SPEAK СРАЗУ, не ждем VoiceAlerts
  const [speakFunction, setSpeakFunction] = useState<((text: string) => Promise<void>) | null>(() => {
    if ('speechSynthesis' in window) {
      return (text: string): Promise<void> => {
        return new Promise((resolve) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.volume = 0.8;
          utterance.rate = 0.9;
          utterance.pitch = 1.1;
          
          utterance.onend = () => resolve();
          utterance.onerror = () => resolve();
          
          speechSynthesis.cancel();
          speechSynthesis.speak(utterance);
          console.log('🔊 Speaking (immediate):', text);
        });
      };
    }
    return null;
  });

  const {
    isConnected,
    connectionStatus,
    telemetryData,
    currentData,
    rawData,
    textMessages,
    maxAltitude,
    flightTime,
    currentSpeed,
    apogeeLineAltitude,
    handleConnect,
    handleDisconnect,
    sendCommand,
    clearData,
    clearRawData,
    exportData
  } = useSerialConnection(speakFunction || undefined);

  // ОБНОВЛЯЕМ функцию когда VoiceAlerts готов (для настроек голоса)
  const handleVoiceAlertsReady = useRef((speakFn: (text: string) => Promise<void>) => {
    setSpeakFunction(() => speakFn);
    console.log('🔊 VoiceAlerts function updated');
  }).current;

  const handleClearData = () => {
    if (telemetryData.length === 0) {
      toast.error("No data to clear");
      return;
    }
    clearData();
    toast.success("Telemetry data cleared");
  };

  return (
    <div className="h-screen bg-background mission-grid relative overflow-y-auto overflow-x-hidden">
      {/* Animated scan line effect */}
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 scan-line opacity-20" />
      
      <div className="relative z-10 p-3 lg:p-6 space-y-4 lg:space-y-6 pb-8">
        {/* Header */}
        <div className="relative mb-4 lg:mb-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Rocket className="h-6 w-6 lg:h-8 lg:w-8 text-primary" />
              <h1 className="text-2xl lg:text-4xl font-bold text-primary">
                ST ROCKETRY MISSION CONTROL
              </h1>
            </div>
          </div>
          <div className="absolute top-0 right-0">
            <DateTimeDisplay />
          </div>
        </div>

        {/* Responsive Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Left Column - Charts and Gauges */}
          <div className="lg:col-span-3 space-y-4 lg:space-y-6 order-2 lg:order-1">
            {/* Telemetry Gauges */}
            <TelemetryGauges 
              data={currentData} 
              isLive={isConnected && connectionStatus === 'connected'} 
              currentSpeed={currentSpeed}
            />

            {/* Altitude Chart */}
            <div className="w-full">
              <AltitudeChart data={telemetryData} maxAltitude={maxAltitude} isLive={isConnected && connectionStatus === 'connected'} apogeeLineAltitude={apogeeLineAltitude} />
            </div>

            {/* System Status Panel - Moved from right column */}
            <SystemStatusPanel data={currentData} textMessages={textMessages} />

            {/* Raw Data Panel - Always visible */}
            <div>
              <RawDataPanel rawData={rawData} textMessages={textMessages} isLive={isConnected && connectionStatus === 'connected'} onClearData={clearRawData} />
            </div>
          </div>

          {/* Right Column - Status and Controls */}
          <div className="lg:col-span-1 space-y-4 order-1 lg:order-2">
            {/* Connection Panel - Compact */}
            <div className="lg:block">
              <ConnectionPanel onConnect={handleConnect} onDisconnect={handleDisconnect} isConnected={isConnected} connectionStatus={connectionStatus} />
            </div>

            <FlightStatusPanel data={currentData} isLive={isConnected && connectionStatus === 'connected'} flightTime={flightTime} dataPoints={telemetryData.length} />

            {/* 3D Rocket Visualization */}
            <RocketVisualization data={currentData} isLive={isConnected && connectionStatus === 'connected'} />

            {/* Configurable Command Panel */}
            <ConfigurableCommandPanel 
              onSendCommand={sendCommand}
              isConnected={isConnected && connectionStatus === 'connected'}
            />

            {/* Data Export Controls - Now in a panel */}
            <div className="bg-card rounded-lg border border-border p-4 shadow-sm">
              <h3 className="text-base lg:text-lg font-bold mb-3 text-card-foreground">DATA EXPORT</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-1 gap-2">
                <MissionButton variant="outline" onClick={() => exportData('csv')} disabled={telemetryData.length === 0} className="w-full text-xs lg:text-sm">
                  <Download className="h-3 w-3 lg:h-4 lg:w-4" />
                  Export CSV
                </MissionButton>

                <MissionButton variant="destructive" onClick={handleClearData} disabled={telemetryData.length === 0} className="w-full text-xs lg:text-sm">
                  <Trash2 className="h-3 w-3 lg:h-4 lg:w-4" />
                  Clear Data
                </MissionButton>
              </div>
            </div>

            {/* Voice Alerts - Moved to right column under Data Export */}
            <div className="hidden lg:block">
              <VoiceAlerts onSpeak={handleVoiceAlertsReady} />
            </div>
          </div>
        </div>

        {/* Voice Alerts - Mobile Only */}
        <div className="lg:hidden">
          <VoiceAlerts onSpeak={handleVoiceAlertsReady} />
        </div>

        {/* Footer */}
        <div className="text-center text-xs lg:text-sm text-muted-foreground border-t border-border pt-4">
          <p>ST Rocketry Mission Control v1.0 | WebSerial API Required (Chrome/Edge)</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
