import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TelemetryData } from "@/types/telemetry";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp } from "lucide-react";

interface AltitudeChartProps {
  data: TelemetryData[];
  maxAltitude: number;
  isLive: boolean;
}

export const AltitudeChart = ({ data, maxAltitude, isLive }: AltitudeChartProps) => {
  const chartData = data.map(point => ({
    time: point.time / 1000, // Convert to seconds
    altitude: point.altitude,
    temperature: point.temperature
  }));

  const apogeeTime = data.find(point => point.altitude === maxAltitude)?.time || 0;

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 relative overflow-hidden">
      {isLive && (
        <div className="absolute top-0 right-0 w-1 h-full bg-primary animate-pulse-data" />
      )}
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold">ALTITUDE PROFILE</h3>
        </div>
        
        <div className="flex gap-2">
          <Badge className="bg-primary text-background">
            APOGEE: {maxAltitude.toFixed(1)}m
          </Badge>
          {isLive && (
            <Badge className="bg-mission-success text-background animate-pulse">
              LIVE
            </Badge>
          )}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.3}
            />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12, fontFamily: 'mono' }}
              tickFormatter={(value) => `${value}s`}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12, fontFamily: 'mono' }}
              tickFormatter={(value) => `${value}m`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontFamily: 'mono'
              }}
              labelFormatter={(value) => `Time: ${value}s`}
              formatter={(value: number, name: string) => [
                `${value.toFixed(1)}${name === 'altitude' ? 'm' : '°C'}`,
                name === 'altitude' ? 'Altitude' : 'Temperature'
              ]}
            />
            <Line
              type="monotone"
              dataKey="altitude"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={false}
              activeDot={{ 
                r: 4, 
                fill: "hsl(var(--primary))",
                stroke: "hsl(var(--background))",
                strokeWidth: 2
              }}
            />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="hsl(var(--mission-info))"
              strokeWidth={1}
              dot={false}
              strokeDasharray="5 5"
              opacity={0.7}
            />
            {maxAltitude > 0 && (
              <ReferenceLine 
                x={apogeeTime / 1000}
                stroke="hsl(var(--mission-success))"
                strokeDasharray="2 2"
                label={{ 
                  value: "APOGEE", 
                  position: "top",
                  style: { 
                    fill: "hsl(var(--mission-success))",
                    fontSize: "12px",
                    fontFamily: "mono"
                  }
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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