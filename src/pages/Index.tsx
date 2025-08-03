import { useState } from "react";
import { ConnectionPanel } from "@/components/telemetry/ConnectionPanel";
import { TelemetryGauges } from "@/components/telemetry/TelemetryGauges";
import { AltitudeChart } from "@/components/telemetry/AltitudeChart";
import { StatusPanel } from "@/components/telemetry/StatusPanel";
import { RawDataPanel } from "@/components/telemetry/RawDataPanel";
import { MissionButton } from "@/components/ui/mission-button";
import { useSerialConnection } from "@/hooks/useSerialConnection";
import { Download, Trash2, FileText } from "lucide-react";
import { toast } from "sonner";

const Index = () => {
  const {
    isConnected,
    connectionStatus,
    telemetryData,
    currentData,
    rawData,
    textMessages,
    maxAltitude,
    flightTime,
    handleConnect,
    handleDisconnect,
    clearData,
    clearRawData,
    exportData
  } = useSerialConnection();

  const handleClearData = () => {
    if (telemetryData.length === 0) {
      toast.error("No data to clear");
      return;
    }
    clearData();
    toast.success("Telemetry data cleared");
  };

  return (
    <div className="min-h-screen bg-background mission-grid relative overflow-hidden">
      {/* Animated scan line effect */}
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/30 scan-line opacity-20" />
      
      <div className="relative z-10 p-6 space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            ROCKET TELEMETRY CONTROL
          </h1>
          <p className="text-muted-foreground">
            Real-time rocket telemetry monitoring and data acquisition system
          </p>
        </div>

        {/* Connection Panel */}
        <ConnectionPanel
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          isConnected={isConnected}
          connectionStatus={connectionStatus}
        />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column - Charts and Gauges */}
          <div className="xl:col-span-3 space-y-6">
            {/* Telemetry Gauges */}
            <TelemetryGauges 
              data={currentData} 
              isLive={isConnected && connectionStatus === 'connected'} 
            />

            {/* Altitude Chart */}
            <AltitudeChart
              data={telemetryData}
              maxAltitude={maxAltitude}
              isLive={isConnected && connectionStatus === 'connected'}
            />

            {/* Raw Data Panel */}
            <RawDataPanel
              rawData={rawData}
              textMessages={textMessages}
              isLive={isConnected && connectionStatus === 'connected'}
              onClearData={clearRawData}
            />
          </div>

          {/* Right Column - Status and Controls */}
          <div className="xl:col-span-1 space-y-6">
            <StatusPanel
              data={currentData}
              isLive={isConnected && connectionStatus === 'connected'}
              flightTime={flightTime}
              dataPoints={telemetryData.length}
            />

            {/* Data Export Controls */}
            <div className="space-y-3">
              <h3 className="text-lg font-bold">DATA MANAGEMENT</h3>
              
              <div className="grid grid-cols-1 gap-2">
                <MissionButton
                  variant="outline"
                  onClick={() => exportData('csv')}
                  disabled={telemetryData.length === 0}
                  className="w-full"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </MissionButton>

                <MissionButton
                  variant="outline"
                  onClick={() => exportData('json')}
                  disabled={telemetryData.length === 0}
                  className="w-full"
                >
                  <FileText className="h-4 w-4" />
                  Export JSON
                </MissionButton>

                <MissionButton
                  variant="destructive"
                  onClick={handleClearData}
                  disabled={telemetryData.length === 0}
                  className="w-full"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear Data
                </MissionButton>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground border-t border-border pt-4">
          <p>Rocket Telemetry System v1.0 | WebSerial API Required (Chrome/Edge)</p>
          <p className="mt-1">
            Connect your rocket via USB and click CONNECT to begin data acquisition
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;