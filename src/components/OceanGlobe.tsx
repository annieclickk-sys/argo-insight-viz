import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';
import earthTexture from '@/assets/earth-texture.jpg';
import earthClouds from '@/assets/earth-clouds.jpg';

function RealisticEarth() {
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
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
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

// Data connection lines (like in the reference image)
function DataConnections() {
  const linesRef = useRef<THREE.LineSegments>(null);
  
  const linesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const lineCount = 50;
    const positions = new Float32Array(lineCount * 6); // 2 points per line, 3 coords per point
    
    for (let i = 0; i < lineCount; i++) {
      // Start point on earth surface
      const radius = 2.1;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      const startX = radius * Math.sin(phi) * Math.cos(theta);
      const startY = radius * Math.cos(phi);
      const startZ = radius * Math.sin(phi) * Math.sin(theta);
      
      // End point extending outward
      const endRadius = 2.5 + Math.random() * 2;
      const endX = endRadius * Math.sin(phi) * Math.cos(theta);
      const endY = endRadius * Math.cos(phi);
      const endZ = endRadius * Math.sin(phi) * Math.sin(theta);
      
      positions[i * 6] = startX;
      positions[i * 6 + 1] = startY;
      positions[i * 6 + 2] = startZ;
      positions[i * 6 + 3] = endX;
      positions[i * 6 + 4] = endY;
      positions[i * 6 + 5] = endZ;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame((state) => {
    if (linesRef.current) {
      linesRef.current.rotation.y = state.clock.elapsedTime * 0.01;
    }
  });

  return (
    <lineSegments ref={linesRef}>
      <primitive object={linesGeometry} />
      <lineBasicMaterial 
        color="#3B82F6" 
        transparent={true} 
        opacity={0.6}
        linewidth={1}
      />
    </lineSegments>
  );
}

function FloatingParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  
  const particlesGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const particleCount = 1000;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const radius = 2.5 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.cos(phi);
      positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.elapsedTime * 0.01;
      particlesRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.01) * 0.1;
    }
  });

  return (
    <points ref={particlesRef}>
      <primitive object={particlesGeometry} />
      <pointsMaterial
        size={0.02}
        color="#60A5FA"
        transparent
        opacity={0.6}
        sizeAttenuation={true}
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
        camera={{ position: [0, 0, 8], fov: 50 }}
        className="w-full h-full"
        shadows
        gl={{ 
          antialias: true, 
          alpha: true
        }}
      >
        <fog attach="fog" args={['#0f172a', 8, 25]} />
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[5, 3, 5]} 
          intensity={1.2} 
          color="#ffffff"
          castShadow
        />
        <pointLight position={[-5, -5, -5]} intensity={0.4} color="#4F46E5" />
        
        <Stars 
          radius={100} 
          depth={60} 
          count={8000} 
          factor={6} 
          saturation={0.2} 
          fade 
          speed={0.8}
        />
        <RealisticEarth />
        <FloatingParticles />
        <DataConnections />
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