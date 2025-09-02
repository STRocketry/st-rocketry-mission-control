import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { TelemetryData } from '@/types/telemetry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plane, RotateCcw, Plus, Minus } from 'lucide-react';
import * as THREE from 'three';

interface RocketMeshProps {
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}

const RocketMesh: React.FC<RocketMeshProps> = ({
  gyroX,
  gyroY,
  gyroZ
}) => {
  const rocketRef = useRef<THREE.Group>(null);
  const rotationVelocity = useRef({
    x: 0,
    y: 0,
    z: 0
  });

  useEffect(() => {
    // Update rotation velocities (convert deg/s to rad/s)
    rotationVelocity.current = {
      x: gyroX * Math.PI / 180,
      y: gyroY * Math.PI / 180,
      z: gyroZ * Math.PI / 180
    };
  }, [gyroX, gyroY, gyroZ]);

  useFrame((state, delta) => {
    if (rocketRef.current) {
      // Apply rotation based on gyro data
      rocketRef.current.rotation.x += rotationVelocity.current.x * delta;
      rocketRef.current.rotation.y += rotationVelocity.current.y * delta;
      rocketRef.current.rotation.z += rotationVelocity.current.z * delta;
    }
  });

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
      
      {/* Fins - colorful triangular shapes */}
      <mesh position={[0.5, -1.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.4, 0.1, 3]} />
        <meshPhongMaterial color="#ff0000" />
      </mesh>
      <mesh position={[-0.5, -1.2, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.4, 0.1, 3]} />
        <meshPhongMaterial color="#00ff00" />
      </mesh>
      <mesh position={[0, -1.2, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.4, 0.1, 3]} />
        <meshPhongMaterial color="#0000ff" />
      </mesh>
      <mesh position={[0, -1.2, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.4, 0.1, 3]} />
        <meshPhongMaterial color="#ff8800" />
      </mesh>

      {/* Axis labels */}
      <Text position={[2, 0, 0]} fontSize={0.3} color="red" anchorX="left">
        X (Roll)
      </Text>
      <Text position={[0, 2.5, 0]} fontSize={0.3} color="green" anchorX="center">
        Y (Pitch)
      </Text>
      <Text position={[0, 0, 2]} fontSize={0.3} color="blue" anchorX="center">
        Z (Yaw)
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
  const gyroX = data?.gyroX || 0;
  const gyroY = data?.gyroY || 0;
  const gyroZ = data?.gyroZ || 0;
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
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
          {/* 3D Visualization - без рамки */}
          <div className="relative h-80 rounded-lg overflow-hidden">
            <Canvas 
              key={cameraDistance} 
              camera={{
                position: [cameraDistance, cameraDistance, cameraDistance],
                fov: 50
              }}
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 10, 5]} intensity={0.8} />
              <RocketMesh gyroX={gyroX} gyroY={gyroY} gyroZ={gyroZ} />
              {/* Axis helpers */}
              <axesHelper args={[2]} />
            </Canvas>
            
            {/* Zoom Controls */}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <Button size="sm" variant="outline" onClick={handleZoomIn} className="w-8 h-8 p-0">
                <Plus className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomOut} className="w-8 h-8 p-0">
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Gyro Data Readouts - без рамок */}
          <div className="space-y-4">
            <h4 className="font-semibold text-xs text-muted-foreground mb-2 text-center">
              ANGULAR
              <br />
              VELOCITIES
            </h4>
            
            <div className="space-y-3">
              {/* Roll (X) */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <RotateCcw className="h-3 w-3 text-red-500" />
                  <span className="font-medium text-xs">Roll (X)</span>
                </div>
                <span className="font-mono text-lg font-bold block">
                  {gyroX.toFixed(1)}°/s
                </span>
              </div>

              {/* Pitch (Y) */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <RotateCcw className="h-3 w-3 text-green-500" />
                  <span className="font-medium text-xs">Pitch (Y)</span>
                </div>
                <span className="font-mono text-lg font-bold block">
                  {gyroY.toFixed(1)}°/s
                </span>
              </div>

              {/* Yaw (Z) */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <RotateCcw className="h-3 w-3 text-blue-500" />
                  <span className="font-medium text-xs">Yaw (Z)</span>
                </div>
                <span className="font-mono text-lg font-bold block">
                  {gyroZ.toFixed(1)}°/s
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
