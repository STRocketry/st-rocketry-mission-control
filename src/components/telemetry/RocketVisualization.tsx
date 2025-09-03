import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { TelemetryData } from '@/types/telemetry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, RotateCcw, Plus, Minus } from 'lucide-react';
import * as THREE from 'three';

interface RocketMeshProps {
  angleX: number;
  angleY: number;
  angleZ: number;
}

const RocketMesh: React.FC<RocketMeshProps> = ({
  angleX,
  angleY,
  angleZ
}) => {
  const rocketRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (rocketRef.current) {
      // Apply absolute rotation angles (convert degrees to radians)
      rocketRef.current.rotation.x = angleX * Math.PI / 180;
      rocketRef.current.rotation.y = angleY * Math.PI / 180;
      rocketRef.current.rotation.z = angleZ * Math.PI / 180;
    }
  }, [angleX, angleY, angleZ]);

  return (
    <group ref={rocketRef}>
      {/* Main rocket body (cylinder) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 3, 12]} />
        <meshPhongMaterial color="#ffffff" />
      </mesh>
      
      {/* Nose cone */}
      <mesh position={[0, 1.8, 0]}>
        <coneGeometry args={[0.3, 0.6, 12]} />
        <meshPhongMaterial color="#ffffff" />
      </mesh>
      
      {/* Fins - triangular shaped stabilizers */}
      {/* Right fin (X+) */}
      <mesh position={[0.3, -1.2, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.2, 0.4, 3]} />
        <meshPhongMaterial color="#ff0000" />
      </mesh>
      
      {/* Left fin (X-) */}
      <mesh position={[-0.3, -1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.2, 0.4, 3]} />
        <meshPhongMaterial color="#00ff00" />
      </mesh>
      
      {/* Front fin (Z+) */}
      <mesh position={[0, -1.2, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 0.4, 3]} />
        <meshPhongMaterial color="#0000ff" />
      </mesh>
      
      {/* Back fin (Z-) */}
      <mesh position={[0, -1.2, -0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.2, 0.4, 3]} />
        <meshPhongMaterial color="#ff8800" />
      </mesh>

      {/* Axis labels */}
      <Text position={[2.5, 0, 0]} fontSize={0.3} color="red" anchorX="left">
        X
      </Text>
      <Text position={[0, 3, 0]} fontSize={0.3} color="green" anchorX="center">
        Y
      </Text>
      <Text position={[0, 0, 2.5]} fontSize={0.3} color="blue" anchorX="center">
        Z
      </Text>
    </group>
  );
};

interface RocketVisualizationProps {
  data: TelemetryData | null;
  isLive: boolean;
}

const RocketVisualization: React.FC<RocketVisualizationProps> = ({
  data,
  isLive
}) => {
  const angleX = data?.angleX || 0;
  const angleY = data?.angleY || 0;
  const angleZ = data?.angleZ || 0;
  const [cameraDistance, setCameraDistance] = useState(6);

  const handleZoomIn = () => {
    setCameraDistance(prev => Math.max(3, prev - 0.5));
  };

  const handleZoomOut = () => {
    setCameraDistance(prev => Math.min(10, prev + 0.5));
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Plane className="h-5 w-5 text-primary" />
          ROCKET ORIENTATION
          {isLive && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_1fr] gap-6">
          {/* 3D Visualization - шире с рамкой */}
          <div className="relative h-80 border border-border rounded-lg overflow-hidden">
            <Canvas 
              key={cameraDistance} 
              camera={{
                position: [cameraDistance, cameraDistance, cameraDistance],
                fov: 50
              }}
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 10, 5]} intensity={0.8} />
              <RocketMesh angleX={angleX} angleY={angleY} angleZ={angleZ} />
              {/* Axis helpers */}
              <axesHelper args={[2]} />
            </Canvas>
            
            {/* Zoom Controls - moved to bottom left to avoid overlap */}
            <div className="absolute bottom-2 left-2 flex gap-1">
              <Button size="sm" variant="outline" onClick={handleZoomIn} className="w-8 h-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomOut} className="w-8 h-8 p-0">
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Gyro Data Readouts - без рамок, уже */}
          <div className="space-y-4">
            <h4 className="font-semibold text-xs text-muted-foreground mb-2 text-center">
              ROTATION
              <br />
              ANGLES
            </h4>
            
            <div className="space-y-3">
              {/* Roll (X) */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <RotateCcw className="h-3 w-3 text-red-500" />
                  <span className="font-medium text-xs">Roll (X)</span>
                </div>
                <span className="font-mono text-lg font-bold block">
                  {angleX.toFixed(1)}°
                </span>
              </div>

              {/* Pitch (Y) */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <RotateCcw className="h-3 w-3 text-green-500" />
                  <span className="font-medium text-xs">Pitch (Y)</span>
                </div>
                <span className="font-mono text-lg font-bold block">
                  {angleY.toFixed(1)}°
                </span>
              </div>

              {/* Yaw (Z) */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <RotateCcw className="h-3 w-3 text-blue-500" />
                  <span className="font-medium text-xs">Yaw (Z)</span>
                </div>
                <span className="font-mono text-lg font-bold block">
                  {angleZ.toFixed(1)}°
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RocketVisualization;
