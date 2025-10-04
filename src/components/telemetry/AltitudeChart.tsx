import { useState, useMemo, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TelemetryData } from "@/types/telemetry";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity, TrendingUp, RotateCcw, Eye, EyeOff, Ruler } from "lucide-react";

interface AltitudeChartProps {
  data: TelemetryData[];
  maxAltitude: number;
  isLive: boolean;
  apogeeLineAltitude?: number | null;
}

export const AltitudeChart = ({ data, maxAltitude, isLive, apogeeLineAltitude }: AltitudeChartProps) => {
  const [showAcceleration, setShowAcceleration] = useState(false);
  const [zoomDomain, setZoomDomain] = useState<{ left: string; right: string } | null>(null);
  const [yAxisScale, setYAxisScale] = useState<number>(5);
  const [isAutoScaled, setIsAutoScaled] = useState<boolean>(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Логируем входные пропсы
  useEffect(() => {
    console.log("🔍 [AltitudeChart] Props received:", {
      apogeeLineAltitude,
      dataLength: data.length,
      maxAltitude,
      isLive
    });
  }, [apogeeLineAltitude, data.length, maxAltitude, isLive]);

  // Safe apogee calculation with empty array handling
  const apogee = useMemo(() => {
    if (data.length === 0) return null;
    return data.reduce((max, current) => 
      current.altitude > max.altitude ? current : max, 
      data[0]
    );
  }, [data]);

  // Find the index where apogee is reached
  const apogeeIndex = useMemo(() => {
    if (!apogee || data.length === 0) return -1;
    return data.findIndex(d => d.time === apogee.time && d.altitude === apogee.altitude);
  }, [apogee, data]);

  // Memoized chart data for better performance
  const chartData = useMemo(() => 
    data.map((d) => ({
      time: d.time / 1000,
      altitude: d.altitude,
      accelY: d.accelY
    })),
    [data]
  );

  // Calculate Y position for max altitude horizontal line
  const maxAltitudeLinePosition = useMemo(() => {
    console.log("🔄 [maxAltitudeLinePosition] Calculation started");
    console.log("📥 [maxAltitudeLinePosition] Inputs:", {
      apogeeLineAltitude,
      dataLength: data.length,
      yAxisScale,
      isAutoScaled
    });

    const lineAltitude = apogeeLineAltitude ?? null;
    console.log("📊 [maxAltitudeLinePosition] lineAltitude:", lineAltitude);
    
    if (!lineAltitude || data.length === 0) {
      console.log("❌ [maxAltitudeLinePosition] RETURN NULL - no lineAltitude or no data");
      return null;
    }
    
    try {
      const [yMin, yMax] = getYAxisDomain();
      console.log("📈 [maxAltitudeLinePosition] Y Axis Domain:", { yMin, yMax });
      
      const altitudeRange = yMax - yMin;
      console.log("📏 [maxAltitudeLinePosition] Altitude Range:", altitudeRange);
      
      if (!isFinite(altitudeRange) || altitudeRange <= 0) {
        console.log("❌ [maxAltitudeLinePosition] RETURN NULL - invalid altitude range");
        return null;
      }

      // Clamp altitude within current Y domain to avoid out-of-range positions
      const clampedAltitude = Math.min(Math.max(lineAltitude, yMin), yMax);
      console.log("🎯 [maxAltitudeLinePosition] Clamped Altitude:", clampedAltitude);

      // Calculate position from bottom (0 = bottom, 1 = top)
      const position = (clampedAltitude - yMin) / altitudeRange;
      const finalPosition = Math.max(0, Math.min(1, 1 - position));
      
      console.log("📐 [maxAltitudeLinePosition] Position calculation:", {
        rawPosition: position,
        finalPosition,
        lineAltitude
      });
      
      const result = {
        position: finalPosition,
        altitude: lineAltitude
      };
      
      console.log("✅ [maxAltitudeLinePosition] RETURN RESULT:", result);
      return result;
    } catch (error) {
      console.error('❌ [maxAltitudeLinePosition] ERROR:', error);
      return null;
    }
  }, [apogeeLineAltitude, data, yAxisScale, isAutoScaled]);

  // Find parachute deployment - SIMPLE VERSION
  const parachuteDeploymentData = useMemo(() => {
    if (data.length === 0) return null;
    
    try {
      let firstDeploymentData = null;
      let gotFirstPacket = false;
      
      for (const d of data) {
        if (d.statusFlags == null) continue;
        
        const flags = Number(d.statusFlags);
        if (isNaN(flags)) continue;
        
        if (flags & 8) {
          // First packet with parachute flag - save data
          if (firstDeploymentData === null) {
            firstDeploymentData = {
              time: d.time / 1000,
              altitude: d.altitude
            };
            gotFirstPacket = true;
          }
          
          // If we already have first packet and this is ANY next packet - render
          if (gotFirstPacket) {
            return firstDeploymentData;
          }
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }, [data]);

  // Calculate position for parachute line
  const parachuteLinePosition = useMemo(() => {
    if (!parachuteDeploymentData || !chartData.length) return null;
    
    try {
      // Calculate relative position based on actual time range
      const timeValues = chartData.map(d => d.time);
      const minTime = Math.min(...timeValues);
      const maxTime = Math.max(...timeValues);
      
      // Calculate relative position (0 to 1)
      const position = (parachuteDeploymentData.time - minTime) / (maxTime - minTime);
      
      return {
        position: Math.max(0, Math.min(1, position)),
        time: parachuteDeploymentData.time,
        altitude: parachuteDeploymentData.altitude
      };
    } catch (error) {
      console.error('Error calculating parachute position:', error);
      return null;
    }
  }, [parachuteDeploymentData, chartData]);

  // Calculate Y-axis domain based on scale and auto-scale mode
  const getYAxisDomain = () => {
    if (data.length === 0) {
      console.log("📊 [getYAxisDomain] no data, returning [0, 100]");
      return [0, 100];
    }
    
    if (isAutoScaled) {
      const maxAlt = Math.max(...data.map(d => d.altitude));
      const roundedMax = Math.ceil(maxAlt / 50) * 50;
      const result = [0, Math.max(roundedMax, 100)];
      console.log("📊 [getYAxisDomain] auto-scaled", { maxAlt, roundedMax, result });
      return result;
    } else {
      const result = [0, yAxisScale];
      console.log("📊 [getYAxisDomain] fixed scale", { yAxisScale, result });
      return result;
    }
  };

  // Эффект для проверки выхода данных за пределы масштаба
  useEffect(() => {
    if (data.length === 0 || isAutoScaled) return;

    const currentMaxY = yAxisScale;
    const margin = yAxisScale * 0.1;
    
    const dataExceedsScale = data.some(d => d.altitude > currentMaxY + margin);
    
    if (dataExceedsScale) {
      setIsAutoScaled(true);
    }
  }, [data, yAxisScale, isAutoScaled]);

  const resetZoom = () => {
    setZoomDomain(null);
  };

  const handleResetView = () => {
    setZoomDomain(null);
    setIsAutoScaled(false);
  };

  const handleMouseDown = (e: any) => {
    if (e?.activeLabel !== undefined) {
      setZoomDomain({ left: e.activeLabel, right: e.activeLabel });
    }
  };

  const handleScaleChange = (value: string) => {
    const newScale = Number(value);
    setYAxisScale(newScale);
    setIsAutoScaled(false);
  };

  const formatTooltip = (value: number, name: string) => {
    if (name === 'altitude') return [`${value.toFixed(1)}m`, 'Altitude'];
    if (name === 'accelY') return [`${value.toFixed(2)}g`, 'Y-Acceleration'];
    return [`${value.toFixed(1)}m`, 'Max Altitude'];
  };

  const getYAxisTicks = () => {
    const [min, max] = getYAxisDomain();
    
    if (isAutoScaled) {
      const step = Math.ceil((max - min) / 5 / 50) * 50;
      const ticks = [];
      
      for (let i = min; i <= max; i += step) {
        ticks.push(i);
      }
      
      return ticks;
    } else {
      const ticks = [];
      const step = yAxisScale / 5;
      
      for (let i = min; i <= max; i += step) {
        ticks.push(i);
      }
      
      return ticks;
    }
  };

  // Логируем финальное состояние рендера
  useEffect(() => {
    console.log("🎯 [AltitudeChart] Render state:", {
      showMaxAltitudeLine: !!maxAltitudeLinePosition,
      maxAltitudeLinePosition,
      showParachuteLine: !!parachuteLinePosition,
      chartDataLength: chartData.length
    });
  });

  return (
    <Card className="p-4 lg:p-6 bg-card/50 backdrop-blur-sm border-primary/20">
      {/* Header */}
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
          {isAutoScaled && (
            <Badge variant="outline" className="text-xs bg-mission-warning/20">
              AUTO SCALE
            </Badge>
          )}
          {parachuteDeploymentData && (
            <Badge className="bg-mission-success text-background text-xs">
              PARACHUTE: {parachuteDeploymentData.time.toFixed(1)}s
            </Badge>
          )}
          {apogeeLineAltitude && (
            <Badge variant="outline" className="text-xs bg-mission-warning/20">
              APOGEE DETECTED
            </Badge>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAcceleration(!showAcceleration)}
          className="text-xs"
          aria-label="Toggle acceleration display"
        >
          {showAcceleration ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
          Y-Accel
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetView}
          disabled={!zoomDomain && !isAutoScaled}
          className="text-xs"
          aria-label="Reset view"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Reset View
        </Button>

        <div className="flex items-center gap-2">
          <Ruler className="h-3 w-3 text-muted-foreground" />
          <Select value={yAxisScale.toString()} onValueChange={handleScaleChange}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1m</SelectItem>
              <SelectItem value="5">5m</SelectItem>
              <SelectItem value="10">10m</SelectItem>
              <SelectItem value="25">25m</SelectItem>
              <SelectItem value="50">50m</SelectItem>
              <SelectItem value="100">100m</SelectItem>
              <SelectItem value="250">250m</SelectItem>
              <SelectItem value="500">500m</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chart Container with Overlay */}
      <div className="h-[300px] lg:h-[400px] w-full relative" ref={chartContainerRef}>
        {/* Main Chart */}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={chartData} 
            margin={{ top: 5, right: showAcceleration ? 50 : 30, left: 20, bottom: 5 }}
            onMouseDown={handleMouseDown}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.3} 
            />
            
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
              domain={getYAxisDomain()}
              ticks={getYAxisTicks()}
            />
            
            {showAcceleration && (
              <YAxis 
                yAxisId="accel"
                orientation="right"
                stroke="hsl(var(--mission-warning))"
                fontSize={10}
                tickFormatter={(value) => `${value}g`}
                domain={[-20, 20]}
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
              formatter={formatTooltip}
              labelFormatter={(value) => `Time: ${value}s`}
            />
            
            {/* Altitude Line */}
            <Line 
              yAxisId="altitude"
              type="monotone" 
              dataKey="altitude" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
            />
            
            {/* Acceleration Line */}
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
          </LineChart>
        </ResponsiveContainer>

        {/* Max Altitude Horizontal Line Overlay */}
        {maxAltitudeLinePosition && (
          <div className="absolute inset-0 pointer-events-none" style={{ paddingTop: '5px', paddingBottom: '5px' }}>
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              {/* Horizontal dashed line at max altitude */}
              <line
                x1="0%"
                x2="100%"
                y1={`${maxAltitudeLinePosition.position * 100}%`}
                y2={`${maxAltitudeLinePosition.position * 100}%`}
                stroke="hsl(var(--mission-warning))"
                strokeDasharray="5 5"
                strokeWidth={2}
              />
              
              {/* Label with background */}
              <g transform={`translate(10, ${maxAltitudeLinePosition.position * 100 - 15})`}>
                {/* Background rectangle */}
                <rect
                  x="-5"
                  y="-5"
                  width="100"
                  height="20"
                  rx="4"
                  fill="hsl(var(--background))"
                  fillOpacity="0.95"
                  stroke="hsl(var(--mission-warning))"
                  strokeWidth="1.5"
                />
                
                {/* Text content */}
                <text
                  x="0"
                  y="9"
                  fill="hsl(var(--mission-warning))"
                  fontSize="12"
                  fontWeight="bold"
                  className="font-mono"
                >
                  {maxAltitudeLinePosition.altitude.toFixed(1)} meters
                </text>
              </g>
            </svg>
          </div>
        )}

        {/* Parachute Line Overlay */}
        {parachuteLinePosition && (
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
              {/* Vertical line */}
              <line
                x1={`${parachuteLinePosition.position * 100}%`}
                x2={`${parachuteLinePosition.position * 100}%`}
                y1="0%"
                y2="100%"
                stroke="hsl(var(--mission-success))"
                strokeDasharray="4 2"
                strokeWidth={2}
              />
              
              {/* Parachute icon */}
              <g transform={`translate(${parachuteLinePosition.position * 100}, 10)`}>
                {/* Parachute canopy */}
                <path
                  d="M-8,0 Q0,-12 8,0"
                  fill="hsl(var(--mission-success))"
                  stroke="hsl(var(--background))"
                  strokeWidth="1"
                />
                {/* Lines */}
                <line x1="-6" y1="0" x2="-4" y2="8" stroke="hsl(var(--mission-success))" strokeWidth="1.5"/>
                <line x1="6" y1="0" x2="4" y2="8" stroke="hsl(var(--mission-success))" strokeWidth="1.5"/>
                <line x1="0" y1="0" x2="0" y2="8" stroke="hsl(var(--mission-success))" strokeWidth="1.5"/>
              </g>
              
              {/* Label with background */}
              <g transform={`translate(${Math.min(parachuteLinePosition.position * 100 + 15, 85)} 25)`}>
                {/* Background rectangle */}
                <rect
                  x="-5"
                  y="-12"
                  width="110"
                  height="32"
                  rx="4"
                  fill="hsl(var(--background))"
                  fillOpacity="0.9"
                  stroke="hsl(var(--mission-success))"
                  strokeWidth="1"
                />
                
                {/* Text content */}
                <text
                  x="0"
                  y="0"
                  fill="hsl(var(--mission-success))"
                  fontSize="11"
                  fontWeight="bold"
                  className="font-mono"
                >
                  <tspan x="0" dy="0">🪂 {parachuteLinePosition.altitude.toFixed(1)}m</tspan>
                  <tspan x="0" dy="12">{parachuteLinePosition.time.toFixed(1)}s</tspan>
                </text>
              </g>
            </svg>
          </div>
        )}
      </div>
      
      {/* Empty State */}
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
