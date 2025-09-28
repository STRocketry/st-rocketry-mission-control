import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TelemetryData } from "@/types/telemetry";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Activity, TrendingUp, RotateCcw, Eye, EyeOff, Ruler } from "lucide-react";

interface AltitudeChartProps {
  data: TelemetryData[];
  maxAltitude: number;
  isLive: boolean;
}

export const AltitudeChart = ({ data, maxAltitude, isLive }: AltitudeChartProps) => {
  const [showAcceleration, setShowAcceleration] = useState(false);
  const [zoomDomain, setZoomDomain] = useState<{ left: string; right: string } | null>(null);
  const [yAxisScale, setYAxisScale] = useState<number>(5); // Дефолтный масштаб 5м
  const [isAutoScaled, setIsAutoScaled] = useState<boolean>(false); // Флаг автомасштабирования

  // Debug: log data structure
  useEffect(() => {
    if (data.length > 0) {
      console.log('=== TELEMETRY DATA STRUCTURE ===');
      console.log('Last data point:', data[data.length - 1]);
      console.log('Data length:', data.length);
      console.log('==============================');
    }
  }, [data]);

  // Memoized chart data for better performance
  const chartData = useMemo(() => 
    data.map(d => ({
      time: d.time / 1000,
      altitude: d.altitude,
      maxAltitude: d.maxAltitude,
      accelY: d.accelY
    })),
    [data]
  );

  // Safe apogee calculation with empty array handling
  const apogee = useMemo(() => {
    if (data.length === 0) return null;
    return data.reduce((max, current) => 
      current.altitude > max.altitude ? current : max, 
      data[0]
    );
  }, [data]);

  // Find first parachute deployment time - DEBUG VERSION
  const parachuteDeploymentTime = useMemo(() => {
    if (data.length === 0) {
      console.log('Parachute: No data');
      return null;
    }
    
    console.log('=== PARACHUTE DEBUG START ===');
    console.log('Data length:', data.length);
    
    try {
      let deploymentPointFound = null;

      for (let i = 0; i < data.length; i++) {
        const d = data[i];
        console.log(`Checking point ${i}:`, {
          time: d.time,
          statusFlags: d.statusFlags,
          altitude: d.altitude,
          statusFlagsType: typeof d.statusFlags
        });
        
        try {
          // Проверяем, что statusFlags существует
          if (d.statusFlags === undefined || d.statusFlags === null) {
            console.log(`  Point ${i}: statusFlags is undefined/null`);
            continue;
          }
          
          // Преобразуем в число
          let flags;
          if (typeof d.statusFlags === 'string') {
            flags = parseInt(d.statusFlags, 10);
            console.log(`  Point ${i}: parsed string to number:`, flags);
          } else {
            flags = Number(d.statusFlags);
            console.log(`  Point ${i}: converted to number:`, flags);
          }
          
          // Проверяем, что это валидное число
          if (isNaN(flags)) {
            console.log(`  Point ${i}: flags is NaN`);
            continue;
          }
          
          const bitCheck = flags & 8;
          const hasParachute = !!(bitCheck);
          console.log(`  Point ${i}: flags=${flags}, flags&8=${bitCheck}, hasParachute=${hasParachute}`);
          
          if (hasParachute) {
            deploymentPointFound = d;
            console.log(`  >>> PARACHUTE FOUND at index ${i} <<<`);
            break;
          }
        } catch (error) {
          console.error(`Error checking point ${i}:`, error);
          continue;
        }
      }
      
      const result = deploymentPointFound ? deploymentPointFound.time / 1000 : null;
      console.log('Final deployment point:', deploymentPointFound);
      console.log('Result time (seconds):', result);
      console.log('=== PARACHUTE DEBUG END ===');
      
      return result;
    } catch (error) {
      console.error('Error calculating parachute deployment time:', error);
      return null;
    }
  }, [data]);

  // Эффект для проверки выхода данных за пределы масштаба
  useEffect(() => {
    if (data.length === 0 || isAutoScaled) return;

    const currentMaxY = yAxisScale;
    const margin = yAxisScale * 0.1; // Запас 10% от текущего масштаба
    
    // Проверяем, вышли ли данные за пределы текущего масштаба
    const dataExceedsScale = data.some(d => d.altitude > currentMaxY + margin);
    
    if (dataExceedsScale) {
      setIsAutoScaled(true); // Включаем автомасштаб
    }
  }, [data, yAxisScale, isAutoScaled]);

  const resetZoom = () => {
    setZoomDomain(null);
  };

  const handleResetView = () => {
    setZoomDomain(null);
    setIsAutoScaled(false); // Возвращаем к фиксированному масштабу
  };

  const handleMouseDown = (e: any) => {
    if (e?.activeLabel !== undefined) {
      setZoomDomain({ left: e.activeLabel, right: e.activeLabel });
    }
  };

  // Обработчик изменения масштаба
  const handleScaleChange = (value: string) => {
    const newScale = Number(value);
    setYAxisScale(newScale);
    setIsAutoScaled(false); // При ручном изменении масштаба отключаем автомасштаб
  };

  // Format tooltip values
  const formatTooltip = (value: number, name: string) => {
    if (name === 'altitude') return [`${value.toFixed(1)}m`, 'Altitude'];
    if (name === 'accelY') return [`${value.toFixed(2)}g`, 'Y-Acceleration'];
    return [`${value.toFixed(1)}m`, 'Max Altitude'];
  };

  // Calculate Y-axis domain based on scale and auto-scale mode
  const getYAxisDomain = () => {
    if (data.length === 0) return [0, 100];
    
    if (isAutoScaled) {
      // Режим автомасштаба - используем данные
      const maxAlt = Math.max(...data.map(d => d.altitude));
      const roundedMax = Math.ceil(maxAlt / 50) * 50; // Округляем до 50м для красоты
      return [0, Math.max(roundedMax, 100)]; // Минимум 100м
    } else {
      // Фиксированный масштаб
      return [0, yAxisScale];
    }
  };

  // Generate ticks based on scale
  const getYAxisTicks = () => {
    const [min, max] = getYAxisDomain();
    
    if (isAutoScaled) {
      // Для автомасштаба генерируем деления динамически
      const step = Math.ceil((max - min) / 5 / 50) * 50; // Округляем до 50м
      const ticks = [];
      
      for (let i = min; i <= max; i += step) {
        ticks.push(i);
      }
      
      return ticks;
    } else {
      // Для фиксированного масштаба - равномерные деления
      const ticks = [];
      const step = yAxisScale / 5; // 5 делений на шкале
      
      for (let i = min; i <= max; i += step) {
        ticks.push(i);
      }
      
      return ticks;
    }
  };

  // Debug render of parachute line
  console.log('RENDER - parachuteDeploymentTime:', parachuteDeploymentTime);

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

      {/* Chart */}
      <div className="h-[300px] lg:h-[400px] w-full">
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
                domain={[-20, 20]} // Fixed range for acceleration
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
            
            {/* Apogee Reference Line */}
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

            {/* Parachute Deployment Reference Line - SAFE RENDER */}
            {parachuteDeploymentTime !== null && parachuteDeploymentTime !== undefined && parachuteDeploymentTime > 0 && (
              <ReferenceLine 
                x={parachuteDeploymentTime} 
                stroke="hsl(var(--mission-success))" 
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{ 
                  value: `CHUTE: ${parachuteDeploymentTime.toFixed(1)}s`, 
                  position: "insideTopRight",
                  fontSize: 10
                }}
              />
            )}

            {/* TEMPORARY: Uncomment to test without parachute line */}
            {/* {false && parachuteDeploymentTime && (
              <ReferenceLine 
                x={parachuteDeploymentTime} 
                stroke="hsl(var(--mission-success))" 
                strokeDasharray="3 3"
                strokeWidth={2}
                label={{ 
                  value: `CHUTE: ${parachuteDeploymentTime.toFixed(1)}s`, 
                  position: "insideTopRight",
                  fontSize: 10
                }}
              />
            )} */}
          </LineChart>
        </ResponsiveContainer>
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
