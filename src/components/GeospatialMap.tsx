import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface DataPoint {
  latitude: number;
  longitude: number;
  temperature: number;
  salinity: number;
  platform: string;
  region: string;
}

interface GeospatialMapProps {
  data: DataPoint[];
  className?: string;
}

function Globe() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create world map texture
    const gradient = ctx.createLinearGradient(0, 0, 1024, 512);
    gradient.addColorStop(0, '#1e40af');
    gradient.addColorStop(0.5, '#2563eb');
    gradient.addColorStop(1, '#3b82f6');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    // Add continents
    ctx.fillStyle = '#334155';
    ctx.globalAlpha = 0.8;
    
    const continents = [
      { x: 150, y: 200, w: 120, h: 80 }, // Africa
      { x: 300, y: 150, w: 200, h: 120 }, // Asia
      { x: 750, y: 200, w: 150, h: 100 }, // Americas
      { x: 650, y: 350, w: 80, h: 60 }, // Australia
    ];
    
    continents.forEach(continent => {
      ctx.fillRect(continent.x, continent.y, continent.w, continent.h);
    });
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[2, 64, 32]} />
      <meshLambertMaterial map={texture} />
    </mesh>
  );
}

function DataPoints({ data }: { data: DataPoint[] }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Convert lat/lon to 3D coordinates on sphere
  const points = useMemo(() => {
    return data.map(point => {
      const phi = (90 - point.latitude) * (Math.PI / 180);
      const theta = (point.longitude + 180) * (Math.PI / 180);
      const radius = 2.05; // Slightly above globe surface
      
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      
      return {
        position: [x, y, z] as [number, number, number],
        temperature: point.temperature,
        salinity: point.salinity,
        platform: point.platform
      };
    });
  }, [data]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      {points.map((point, index) => (
        <mesh key={index} position={point.position}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial 
            color={`hsl(${240 - point.temperature * 8}, 70%, 60%)`}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

export const GeospatialMap: React.FC<GeospatialMapProps> = ({ 
  data, 
  className = "h-[400px]" 
}) => {
  return (
    <motion.div 
      className={`relative ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#3b82f6" />
        
        <Globe />
        <DataPoints data={data} />
        
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={10}
          autoRotate
          autoRotateSpeed={1}
        />
      </Canvas>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border">
        <h4 className="text-sm font-semibold text-foreground mb-2">ARGO Float Locations</h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-blue-400"></div>
          <span>Cold (10-20°C)</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <span>Warm (25-30°C)</span>
        </div>
      </div>
      
      {/* Stats */}
      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border">
        <div className="text-center">
          <div className="text-lg font-bold text-primary">{data.length}</div>
          <div className="text-xs text-muted-foreground">Data Points</div>
        </div>
      </div>
    </motion.div>
  );
};