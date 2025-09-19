import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls, Stars, useTexture } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create ocean-focused earth texture programmatically
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    
    // Create ocean gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, '#1e3a8a'); // Deep blue
    gradient.addColorStop(0.3, '#1e40af'); // Ocean blue
    gradient.addColorStop(0.7, '#0ea5e9'); // Light blue
    gradient.addColorStop(1, '#06b6d4'); // Cyan
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 256);
    
    // Add land masses as darker areas
    ctx.fillStyle = '#0f172a';
    ctx.globalAlpha = 0.3;
    
    // Simulate simple continents
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 256;
      const radius = Math.random() * 30 + 10;
      
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <Sphere ref={meshRef} args={[2, 64, 32]} position={[0, 0, 0]}>
      <meshPhongMaterial 
        map={texture}
        shininess={100}
        specular="#4fc3f7"
        transparent
        opacity={0.9}
      />
    </Sphere>
  );
}

function OceanLights() {
  return (
    <>
      <ambientLight intensity={0.4} color="#4fc3f7" />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1} 
        color="#ffffff"
        castShadow
      />
      <pointLight 
        position={[-5, -5, -5]} 
        intensity={0.5} 
        color="#0ea5e9"
      />
    </>
  );
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particles = useMemo(() => {
    const temp = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      const i3 = i * 3;
      temp[i3] = (Math.random() - 0.5) * 10;
      temp[i3 + 1] = (Math.random() - 0.5) * 10;
      temp[i3 + 2] = (Math.random() - 0.5) * 10;
    }
    return temp;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          count={particles.length / 3} 
          array={particles} 
          itemSize={3} 
        />
      </bufferGeometry>
      <pointsMaterial 
        size={0.02} 
        color="#4fc3f7" 
        transparent 
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}

export const OceanGlobe = () => {
  return (
    <motion.div 
      className="w-full h-full relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
    >
      <Canvas 
        camera={{ position: [0, 0, 6], fov: 60 }}
        className="w-full h-full"
      >
        <OceanLights />
        <Stars 
          radius={100} 
          depth={50} 
          count={5000} 
          factor={4} 
          saturation={0} 
          fade 
          speed={1}
        />
        <Earth />
        <FloatingParticles />
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={15}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
      
      {/* Overlay Info */}
      <motion.div 
        className="absolute top-8 left-8 data-card max-w-sm"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h3 className="text-xl font-bold text-foreground mb-2">ARGO Global Ocean</h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Explore real-time ocean data from autonomous profiling floats deployed worldwide. 
          Interact with the globe to discover temperature, salinity, and biogeochemical measurements.
        </p>
        <div className="flex gap-2 mt-4">
          <button className="ocean-button text-sm py-2 px-4">
            Explore Data
          </button>
        </div>
      </motion.div>

      {/* Stats Overlay */}
      <motion.div 
        className="absolute bottom-8 right-8 data-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">4,000+</div>
            <div className="text-xs text-muted-foreground">Active Floats</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-accent">2.5M+</div>
            <div className="text-xs text-muted-foreground">Profiles</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};