import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, OrbitControls, Stars, useTexture } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

function Earth() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Create enhanced ocean-focused earth texture
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create dynamic ocean gradient with depth layers
    const oceanGradient = ctx.createRadialGradient(512, 256, 50, 512, 256, 400);
    oceanGradient.addColorStop(0, '#1e40af'); // Deep blue center
    oceanGradient.addColorStop(0.2, '#1d4ed8'); // Ocean blue
    oceanGradient.addColorStop(0.4, '#2563eb'); // Medium blue
    oceanGradient.addColorStop(0.6, '#3b82f6'); // Light blue
    oceanGradient.addColorStop(0.8, '#06b6d4'); // Cyan edges
    oceanGradient.addColorStop(1, '#0891b2'); // Deep cyan
    
    ctx.fillStyle = oceanGradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    // Add landmasses with realistic coastlines
    ctx.fillStyle = '#1e293b';
    ctx.globalAlpha = 0.7;
    
    // Simulate continents with more detail
    const continents = [
      { x: 150, y: 200, size: 60 }, // Africa
      { x: 80, y: 180, size: 45 },  // Europe
      { x: 300, y: 150, size: 80 }, // Asia
      { x: 50, y: 300, size: 50 },  // Americas
      { x: 800, y: 350, size: 40 }, // Australia
    ];
    
    continents.forEach(continent => {
      for (let i = 0; i < 8; i++) {
        const offsetX = (Math.random() - 0.5) * continent.size;
        const offsetY = (Math.random() - 0.5) * continent.size;
        const radius = Math.random() * 25 + 15;
        
        ctx.beginPath();
        ctx.arc(continent.x + offsetX, continent.y + offsetY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    // Add ocean current lines
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < 20; i++) {
      ctx.beginPath();
      const startX = Math.random() * 1024;
      const startY = Math.random() * 512;
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = startY + (Math.random() - 0.5) * 100;
      
      ctx.moveTo(startX, startY);
      ctx.quadraticCurveTo(
        (startX + endX) / 2 + (Math.random() - 0.5) * 50,
        (startY + endY) / 2 + (Math.random() - 0.5) * 50,
        endX, endY
      );
      ctx.stroke();
    }
    
    return new THREE.CanvasTexture(canvas);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.08;
      // Add subtle breathing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Sphere ref={meshRef} args={[2, 128, 64]} position={[0, 0, 0]}>
      <meshPhysicalMaterial 
        map={texture}
        metalness={0.1}
        roughness={0.3}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        transmission={0.1}
        transparent
        opacity={0.95}
        emissive="#0f172a"
        emissiveIntensity={0.1}
      />
    </Sphere>
  );
}

function OceanLights() {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.position.x = Math.cos(state.clock.elapsedTime * 0.3) * 8;
      lightRef.current.position.z = Math.sin(state.clock.elapsedTime * 0.3) * 8;
    }
  });

  return (
    <>
      {/* Ambient ocean lighting */}
      <ambientLight intensity={0.3} color="#1e40af" />
      
      {/* Dynamic sun light */}
      <directionalLight 
        ref={lightRef}
        position={[8, 8, 5]} 
        intensity={2.5} 
        color="#fbbf24"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />
      
      {/* Deep ocean rim light */}
      <pointLight 
        position={[-8, -3, -8]} 
        intensity={1.2} 
        color="#0ea5e9"
        distance={20}
        decay={2}
      />
      
      {/* Surface reflection light */}
      <pointLight 
        position={[0, 6, 0]} 
        intensity={0.8} 
        color="#38bdf8"
        distance={15}
        decay={1.5}
      />
      
      {/* Atmospheric light */}
      <hemisphereLight 
        args={["#87ceeb", "#1e3a8a", 0.6]}
      />
    </>
  );
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  
  const { particles, velocities } = useMemo(() => {
    const particlePositions = new Float32Array(2000 * 3);
    const particleVelocities = new Float32Array(2000 * 3);
    
    for (let i = 0; i < 2000; i++) {
      const i3 = i * 3;
      // Create particles in spherical distribution around globe
      const radius = 3 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      particlePositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[i3 + 1] = radius * Math.cos(phi);
      particlePositions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      // Random velocities for organic movement
      particleVelocities[i3] = (Math.random() - 0.5) * 0.01;
      particleVelocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
      particleVelocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
    }
    
    return { particles: particlePositions, velocities: particleVelocities };
  }, []);

  useFrame((state) => {
    if (particlesRef.current && particlesRef.current.geometry.attributes.position) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        // Add flowing motion
        positions[i] += velocities[i] * Math.sin(state.clock.elapsedTime + i);
        positions[i + 1] += velocities[i + 1] * Math.cos(state.clock.elapsedTime + i);
        positions[i + 2] += velocities[i + 2] * Math.sin(state.clock.elapsedTime + i);
        
        // Keep particles in bounds
        const distance = Math.sqrt(positions[i] ** 2 + positions[i + 1] ** 2 + positions[i + 2] ** 2);
        if (distance > 12) {
          positions[i] *= 0.8;
          positions[i + 1] *= 0.8;
          positions[i + 2] *= 0.8;
        }
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.02;
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
        size={0.015} 
        color="#60a5fa" 
        transparent 
        opacity={0.8}
        sizeAttenuation
        vertexColors={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function Atmosphere() {
  return (
    <Sphere args={[2.2, 64, 32]} position={[0, 0, 0]}>
      <meshBasicMaterial 
        color="#38bdf8"
        transparent
        opacity={0.08}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </Sphere>
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
        camera={{ position: [0, 0, 8], fov: 50 }}
        className="w-full h-full"
        shadows
        gl={{ 
          antialias: true, 
          alpha: true
        }}
      >
        <fog attach="fog" args={['#0f172a', 8, 25]} />
        <OceanLights />
        <Stars 
          radius={100} 
          depth={60} 
          count={8000} 
          factor={6} 
          saturation={0.2} 
          fade 
          speed={0.8}
        />
        <Earth />
        <FloatingParticles />
        <Atmosphere />
        <OrbitControls 
          enableZoom={true}
          enablePan={false}
          minDistance={4}
          maxDistance={20}
          autoRotate
          autoRotateSpeed={0.3}
          dampingFactor={0.05}
          enableDamping
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