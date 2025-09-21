import React, { useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import earthTexture from '@/assets/earth-texture.jpg';
import earthClouds from '@/assets/earth-clouds.jpg';

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

function RealisticGlobe() {
  const earthRef = useRef<THREE.Mesh>(null);
  const cloudsRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);
  
  // Load realistic earth textures
  const earthMap = useLoader(THREE.TextureLoader, earthTexture);
  const cloudsMap = useLoader(THREE.TextureLoader, earthClouds);
  
  // Create atmosphere shader material
  const atmosphereMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(0.3, 0.6, 1.0, 1.0) * intensity;
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });
  }, []);

  useFrame((state) => {
    if (earthRef.current) {
      earthRef.current.rotation.y = state.clock.elapsedTime * 0.02;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y = state.clock.elapsedTime * 0.025;
    }
  });

  return (
    <group>
      {/* Atmosphere */}
      <mesh ref={atmosphereRef} scale={[1.05, 1.05, 1.05]}>
        <sphereGeometry args={[2, 64, 32]} />
        <primitive object={atmosphereMaterial} />
      </mesh>
      
      {/* Earth */}
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 64, 32]} />
        <meshPhongMaterial 
          map={earthMap}
          bumpScale={0.02}
          shininess={0.3}
        />
      </mesh>
      
      {/* Clouds */}
      <mesh ref={cloudsRef} scale={[1.005, 1.005, 1.005]}>
        <sphereGeometry args={[2, 64, 32]} />
        <meshPhongMaterial
          map={cloudsMap}
          transparent={true}
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
    </group>
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
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[5, 3, 5]} 
          intensity={1.2} 
          color="#ffffff"
        />
        <pointLight position={[-5, -5, -5]} intensity={0.4} color="#4F46E5" />
        
        <RealisticGlobe />
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