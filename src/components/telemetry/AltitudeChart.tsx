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
    time: d.time / 1000, // Convert to seconds for better readability
    altitude: d.altitude,
    maxAltitude: d.maxAltitude,
    accelY: d.accelY
  }));

  const apogee = data.reduce((max, current) => 
    current.altitude > max.altitude ? current : max, 
    data[0] || { altitude: 0, time: 0 }
  );

  // Find apogee detection time from text messages
  const apogeeDetectedTime = (() => {
    const apogeeMessage = textMessages.find(msg => msg.includes("DEPLOY:AUTO: Apogee detected"));
    if (!apogeeMessage || data.length === 0) return null;
    
    // Find the telemetry data point closest to when apogee was detected
    // Since we don't have exact timestamps in messages, we'll use the max altitude point
    return apogee.time / 1000; // Convert to seconds
  })();

  // Find parachute deployment time from status flags
  const parachuteDeploymentTime = (() => {
    for (let i = 1; i < data.length; i++) {
      const prevFlags = parseStatusFlags(data[i - 1].statusFlags);
      const currentFlags = parseStatusFlags(data[i].statusFlags);
      
      // Parachute just deployed (changed from false to true)
      if (!prevFlags.parachuteDeployed && currentFlags.parachuteDeployed) {
        return data[i].time / 1000; // Convert to seconds
      }
    }
    return null;
  })();

  const resetZoom = () => {
    setZoomDomain(null);
  };

  return (
    <Card className="p-4 lg:p-6 bg-card/50 backdrop-blur-sm border-primary/20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-4 gap-3">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg lg:text-xl font-bold">ALTITUDE TRACKING</h2>
            <p className="text-xs lg:text-sm text-muted-foreground">Real-time flight altitude monitoring</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {isLive && (
            <Badge className="bg-mission-success text-background animate-pulse text-xs">
              LIVE
            </Badge>
          )}
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-mission-warning" />
            <span className="text-xs lg:text-sm font-mono">
              MAX: {maxAltitude.toFixed(1)}m
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAcceleration(!showAcceleration)}
          className="text-xs"
        >
          {showAcceleration ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
          Y-Accel
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={resetZoom}
          disabled={!zoomDomain}
          className="text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset View
        </Button>
      </div>

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
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              fontSize={10}
              tickFormatter={(value) => `${value}s`}
              domain={zoomDomain ? [zoomDomain.left, zoomDomain.right] : ['dataMin', 'dataMax']}
            />
            <YAxis 
              yAxisId="altitude"
              stroke="hsl(var(--primary))"
              fontSize={10}
              tickFormatter={(value) => `${value}m`}
            />
            {showAcceleration && (
              <YAxis 
                yAxisId="accel"
                orientation="right"
                stroke="hsl(var(--mission-warning))"
                fontSize={10}
                tickFormatter={(value) => `${value}g`}
              />
            )}
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                color: 'hsl(var(--foreground))',
                fontSize: '12px'
              }}
              formatter={(value: number, name: string) => {
                if (name === 'altitude') return [`${value.toFixed(1)}m`, 'Altitude'];
                if (name === 'accelY') return [`${value.toFixed(2)}g`, 'Y-Acceleration'];
                return [`${value.toFixed(1)}m`, 'Max Altitude'];
              }}
              labelFormatter={(value) => `Time: ${value}s`}
            />
            <Line 
              yAxisId="altitude"
              type="monotone" 
              dataKey="altitude" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
            />
            {showAcceleration && (
              <Line 
                yAxisId="accel"
                type="monotone" 
                dataKey="accelY" 
                stroke="hsl(var(--mission-warning))" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, stroke: 'hsl(var(--mission-warning))', strokeWidth: 2 }}
              />
            )}
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
            {apogeeDetectedTime && (
              <ReferenceLine 
                x={apogeeDetectedTime}
                stroke="hsl(var(--mission-critical))" 
                strokeWidth={2}
                label={{ 
                  value: "APOGEE DETECTED", 
                  position: "top",
                  fontSize: 9
                }}
              />
            )}
            {parachuteDeploymentTime && (
              <ReferenceLine 
                x={parachuteDeploymentTime}
                stroke="hsl(var(--mission-success))" 
                strokeWidth={2}
                label={{ 
                  value: "PARACHUTE DEPLOYED", 
                  position: "bottom",
                  fontSize: 9
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