import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { TelemetryData } from '@/types/telemetry';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, RotateCcw } from 'lucide-react';
import * as THREE from 'three';

interface RocketMeshProps {
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}

const RocketMesh: React.FC<RocketMeshProps> = ({ gyroX, gyroY, gyroZ }) => {
  const rocketRef = useRef<THREE.Group>(null);
  const rotationVelocity = useRef({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    // Update rotation velocities (convert deg/s to rad/s)
    rotationVelocity.current = {
      x: (gyroX * Math.PI) / 180,
      y: (gyroY * Math.PI) / 180, 
      z: (gyroZ * Math.PI) / 180
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
        <meshPhongMaterial color="#e11d48" />
      </mesh>
      
      {/* Nose cone */}
      <mesh position={[0, 1.8, 0]}>
        <coneGeometry args={[0.3, 0.6, 12]} />
        <meshPhongMaterial color="#dc2626" />
      </mesh>
      
      {/* Fins */}
      <mesh position={[0.4, -1.2, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
        <meshPhongMaterial color="#991b1b" />
      </mesh>
      <mesh position={[-0.4, -1.2, 0]} rotation={[0, 0, -Math.PI / 4]}>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
        <meshPhongMaterial color="#991b1b" />
      </mesh>
      <mesh position={[0, -1.2, 0.4]} rotation={[Math.PI / 4, 0, 0]}>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
        <meshPhongMaterial color="#991b1b" />
      </mesh>
      <mesh position={[0, -1.2, -0.4]} rotation={[-Math.PI / 4, 0, 0]}>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
        <meshPhongMaterial color="#991b1b" />
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

const RocketVisualization: React.FC<RocketVisualizationProps> = ({ data, isLive }) => {
  const gyroX = data?.gyroX || 0;
  const gyroY = data?.gyroY || 0; 
  const gyroZ = data?.gyroZ || 0;

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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 3D Visualization */}
          <div className="h-64 border border-border rounded-lg overflow-hidden">
            <Canvas camera={{ position: [4, 4, 4], fov: 50 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 10, 5]} intensity={0.8} />
              <RocketMesh gyroX={gyroX} gyroY={gyroY} gyroZ={gyroZ} />
              <OrbitControls enableZoom={true} enablePan={false} />
              {/* Axis helpers */}
              <axesHelper args={[2]} />
            </Canvas>
          </div>

          {/* Gyro Data Readouts */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm mb-3">ANGULAR VELOCITIES</h4>
            
            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center p-3 bg-card border rounded-lg">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-red-500" />
                  <span className="font-medium text-sm">Roll (X)</span>
                </div>
                <span className="font-mono text-lg font-bold">
                  {gyroX.toFixed(1)}°/s
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-card border rounded-lg">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-green-500" />
                  <span className="font-medium text-sm">Pitch (Y)</span>
                </div>
                <span className="font-mono text-lg font-bold">
                  {gyroY.toFixed(1)}°/s
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-card border rounded-lg">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-blue-500" />
                  <span className="font-medium text-sm">Yaw (Z)</span>
                </div>
                <span className="font-mono text-lg font-bold">
                  {gyroZ.toFixed(1)}°/s
                </span>
              </div>
            </div>

            <div className="text-xs text-muted-foreground mt-4">
              <p>Real-time rocket orientation visualization based on gyroscope data.</p>
              <p className="mt-1">Drag to orbit • Scroll to zoom</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RocketVisualization;