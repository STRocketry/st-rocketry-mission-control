import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TelemetryData, parseStatusFlags } from "@/types/telemetry";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity, TrendingUp, RotateCcw, Eye, EyeOff } from "lucide-react";

interface AltitudeChartProps {
  data: TelemetryData[];
  maxAltitude: number;
  isLive: boolean;
  textMessages?: string[];
}

export const AltitudeChart = ({ data, maxAltitude, isLive, textMessages = [] }: AltitudeChartProps) => {
  const [showAcceleration, setShowAcceleration] = useState(false);
  const [zoomDomain, setZoomDomain] = useState<any>(null);

  const chartData = data.map(d => ({
    time: d.time / 1000,
    altitude: d.altitude,
    maxAltitude: d.maxAltitude,
    accelY: d.accelY
  }));

  const apogee = data.reduce((max, current) => 
    current.altitude > max.altitude ? current : max, 
    data[0] || { altitude: 0, time: 0 }
  );

  // Safe apogee detection time finding
  const apogeeDetectedTime = (() => {
    try {
      const apogeeMessage = textMessages?.find(msg => msg.includes("DEPLOY:AUTO: Apogee detected"));
      if (!apogeeMessage || data.length === 0) return null;
      
      // Use the time of maximum altitude as apogee detection time
      return apogee?.time / 1000 || null;
    } catch {
      return null;
    }
  })();

  // Safe parachute deployment time finding
  const parachuteDeploymentTime = (() => {
    try {
      if (data.length === 0) return null;
      
      for (let i = 1; i < data.length; i++) {
        const prevFlags = parseStatusFlags(data[i - 1].statusFlags);
        const currentFlags = parseStatusFlags(data[i].statusFlags);
        
        // Parachute just deployed (changed from false to true)
        if (!prevFlags.parachuteDeployed && currentFlags.parachuteDeployed) {
          return data[i].time / 1000;
        }
      }
      return null;
    } catch {
      return null;
    }
  })();

  const resetZoom = () => {
    setZoomDomain(null);
  };

  return (
    <Card className="p-4 lg:p-6 bg-card/50 backdrop-blur-sm border-primary/20">
      {/* ... остальная разметка без изменений ... */}
      
      <div className="h-[300px] lg:h-[400px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 5, right: showAcceleration ? 50 : 30, left: 20, bottom: 5 }}
            onMouseDown={(e) => {
              if (e && e.activeLabel !== undefined) {
                setZoomDomain({ left: e.activeLabel, right: e.activeLabel });
              }
            }}
          >
            {/* ... остальные элементы графика ... */}
            
            {apogee && apogee.altitude > 0 && (
              <ReferenceLine 
                yAxisId="altitude"
                y={apogee.altitude} 
                stroke="hsl(var(--mission-critical))" 
                strokeDasharray="5 5"
                label={{ 
                  value: `APOGEE: ${apogee.altitude.toFixed(1)}m`, 
                  position: "top",
                  fontSize: 10
                }}
              />
            )}
            
            {/* Apogee detection line - ORANGE */}
            {apogeeDetectedTime && (
              <ReferenceLine 
                x={apogeeDetectedTime}
                stroke="hsl(var(--mission-warning))" 
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{ 
                  value: "APOGEE DETECTED", 
                  position: "insideTop",
                  fontSize: 9,
                  fill: "hsl(var(--mission-warning))"
                }}
              />
            )}
            
            {/* Parachute deployment line - GREEN */}
            {parachuteDeploymentTime && (
              <ReferenceLine 
                x={parachuteDeploymentTime}
                stroke="hsl(var(--mission-success))" 
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{ 
                  value: "PARACHUTE DEPLOYED", 
                  position: "insideBottom",
                  fontSize: 9,
                  fill: "hsl(var(--mission-success))"
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
          <div className="text-center">
            <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-semibold text-muted-foreground">
              Waiting for telemetry data...
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Connect your rocket to see live altitude tracking
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
