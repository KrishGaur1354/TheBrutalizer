import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows,
  Cloud,
  useHelper,
  useTexture,
  Html
} from '@react-three/drei';
import { EffectComposer, SSAO, Bloom, ToneMapping } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import styled from 'styled-components';
import Building from '../components/Building';
import { captureSceneImage } from '../utils/imageCapture';
import Bench from '../components/Bench';
import Tree from '../components/Tree';
import SharePanel from '../components/SharePanel';

// Styled component for the canvas container with concrete-inspired styling
const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: #d0d0d0;
  position: relative;
`;

// Export button overlay
const ExportButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: #333333;
  color: #ffffff;
  border: none;
  padding: 12px 20px;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 2px;
  cursor: pointer;
  z-index: 10;
  font-family: 'Courier New', monospace;
  box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.2);
  
  &:hover {
    background: #555555;
  }
  
  &:active {
    transform: translate(2px, 2px);
    box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.2);
  }
`;

// Function to create a concrete ground with optional park
function ConcreteGround({ groundPark = false }) {
  const groundSize = 500;
  
  if (!groundPark) {
    // Regular concrete ground
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[groundSize, groundSize]} />
        <meshStandardMaterial color="#bbbbbb" roughness={0.9} />
      </mesh>
    );
  } else {
    // Park ground with grass and paths
    return (
      <group>
        {/* Base concrete around the edges */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
          <planeGeometry args={[groundSize, groundSize]} />
          <meshStandardMaterial color="#bbbbbb" roughness={0.9} />
        </mesh>
        
        {/* Grass area */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#4a7c59" roughness={0.9} />
        </mesh>
        
        {/* Central path - horizontal */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[60, 5]} />
          <meshStandardMaterial color="#b5a57e" roughness={1} />
        </mesh>
        
        {/* Central path - vertical */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[5, 60]} />
          <meshStandardMaterial color="#b5a57e" roughness={1} />
        </mesh>
        
        {/* Place trees randomly in the park area */}
        {Array(30).fill().map((_, i) => {
          const angle = Math.random() * Math.PI * 2;
          const radius = 10 + Math.random() * 35;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const scale = 0.8 + Math.random() * 1.2;
          
          // Don't place trees on the path
          if (Math.abs(x) < 3 && Math.abs(z) < 30) return null;
          if (Math.abs(z) < 3 && Math.abs(x) < 30) return null;
          
          return (
            <Tree 
              key={`ground-tree-${i}`} 
              position={[x, 0, z]} 
              scale={[scale, scale, scale]} 
            />
          );
        })}
        
        {/* Add some benches along the paths */}
        {Array(8).fill().map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const radius = 20;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const rotation = [0, angle + Math.PI/2, 0];
          
          return (
            <Bench 
              key={`bench-${i}`} 
              position={[x, 0, z]} 
              rotation={rotation} 
            />
          );
        })}
      </group>
    );
  }
}

// Procedural clouds component with optimized cloud rendering
function ProceduralSky({ cloudDensity = 0.7 }) {
  const sunRef = useRef();
  const sunPosition = useMemo(() => new THREE.Vector3(100, 50, 100), []);
  
  // Calculate cloud parameters based on density - optimized to reduce WebGL warnings
  const cloudParams = useMemo(() => {
    // Limit maximum cloud count based on density to prevent GPU overload
    const cloudCount = Math.min(Math.floor(cloudDensity * 8) + 1, 8); 
    const cloudOpacity = 0.3 + (cloudDensity * 0.7);
    
    const clouds = [];
    for (let i = 0; i < cloudCount; i++) {
      const angle = (i / cloudCount) * Math.PI * 2;
      const distance = 50 + (i * 15) % 50; // More structured placement to reduce randomness
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const y = 80 + ((i * 10) % 40); // Higher elevation with structured variation
      
      // Limit max cloud width to prevent texture size issues
      const width = 40 + ((i * 5) % 30);
      const depth = 3 + ((i * 0.5) % 4);
      
      clouds.push({
        position: [x, y, z],
        opacity: cloudOpacity * (0.8 + ((i * 0.05) % 0.4)),
        speed: 0.05 + ((i * 0.02) % 0.15),
        width: width,
        depth: depth,
        segments: Math.min(8 + Math.floor(width / 15), 12), // Reduced segment count
      });
    }
    
    return clouds;
  }, [cloudDensity]);
  
  // Optimize sun animation to be less resource-intensive
  useFrame(({ clock }) => {
    const time = clock.getElapsedTime() * 0.03; // Slower movement
    sunRef.current.position.x = Math.cos(time) * 100;
    sunRef.current.position.z = Math.sin(time) * 100;
    sunRef.current.position.y = 50 + Math.sin(time/2) * 20; // Slower vertical movement
  });

  return (
    <>
      {/* Sun sphere */}
      <mesh ref={sunRef} position={sunPosition.toArray()}>
        <sphereGeometry args={[5, 8, 8]} /> {/* Reduced geometry complexity */}
        <meshBasicMaterial color="#FDB813" />
      </mesh>
      
      {/* Optimized cloud rendering */}
      {cloudParams.map((cloud, index) => (
        <Cloud
          key={`cloud-${index}`}
          opacity={cloud.opacity}
          speed={cloud.speed}
          width={cloud.width}
          depth={cloud.depth}
          segments={cloud.segments}
          position={cloud.position}
        />
      ))}
    </>
  );
}

// Camera setup component
function CameraSetup({ config }) {
  const { camera } = useThree();
  
  // Calculate camera position based on building size
  useEffect(() => {
    const { width, depth, floors } = config;
    const size = Math.max(width, depth, floors * 3);
    const distance = size * 2;
    
    camera.position.set(distance, distance * 0.7, distance);
    camera.lookAt(0, floors * 1.5, 0);
    camera.updateProjectionMatrix();
  }, [camera, config]);
  
  return null;
}

// Enhanced lighting setup component
function LightingSetup() {
  const directionalLightRef = useRef();
  
  return (
    <>
      {/* Main directional light (sun) */}
      <directionalLight
        ref={directionalLightRef}
        position={[10, 20, 15]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={0.7} />
      
      {/* Additional fill light */}
      <directionalLight position={[-10, 10, -5]} intensity={0.3} />
    </>
  );
}

// Main scene component
function Scene({ config }) {
  const { scene, camera, gl } = useThree();
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  
  // Building params calculated from config
  const buildingParams = useMemo(() => {
    return {
      width: config.width,
      depth: config.depth,
      floors: config.floors,
      floorHeight: 3,
      windowDensity: config.windowDensity,
    };
  }, [config.width, config.depth, config.floors, config.windowDensity]);
  
  // Position benches around the building
  const benchPositions = useMemo(() => {
    const positions = [];
    const { width, depth } = buildingParams;
    
    // Front benches
    positions.push({
      position: [-width/4, 0, -depth/2 - 3],
      rotation: [0, 0, 0]
    });
    
    positions.push({
      position: [width/4, 0, -depth/2 - 3],
      rotation: [0, 0, 0]
    });
    
    // Side benches
    positions.push({
      position: [-width/2 - 3, 0, 0],
      rotation: [0, Math.PI/2, 0]
    });
    
    positions.push({
      position: [width/2 + 3, 0, 0],
      rotation: [0, Math.PI/2, 0]
    });
    
    return positions;
  }, [buildingParams]);

  return (
    <>
      {/* Brutalist building */}
      <Building config={config} />
      
      {/* Additional benches */}
      {benchPositions.map((bench, index) => (
        <Bench
          key={`bench-${index}`}
          position={bench.position}
          rotation={bench.rotation}
        />
      ))}
      
      {/* Dynamic sky with clouds */}
      <ProceduralSky cloudDensity={config.cloudDensity || 0.7} />
      
      {/* Ground - with optional park */}
      <ConcreteGround groundPark={config.groundPark || false} />
      
      {/* Ground shadows - optimized for performance */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        scale={100}
        blur={1}
        far={10}
        resolution={512}
        color="#000000"
      />
      
      {/* Enhanced post-processing */}
      <EffectComposer multisampling={2}>
        <SSAO
          blendFunction={BlendFunction.MULTIPLY}
          samples={10}
          radius={2}
          intensity={3}
        />
        <Bloom
          intensity={0.05}
          luminanceThreshold={0.8}
          luminanceSmoothing={0.9}
        />
        <ToneMapping
          blendFunction={BlendFunction.NORMAL}
          adaptive={true}
          resolution={256}
          middleGrey={0.6}
          maxLuminance={16.0}
          averageLuminance={1.0}
          adaptationRate={1.0}
        />
      </EffectComposer>
      
      {/* Share options overlay - commented out as requested */}
      {/* {showShareOptions && capturedImageUrl && (
        <Html fullscreen>
          <div onClick={() => setShowShareOptions(false)} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <SharePanel 
              imageUrl={capturedImageUrl} 
              onClose={() => setShowShareOptions(false)}
              buildingName={config.buildingName}
            />
          </div>
        </Html>
      )} */}
    </>
  );
}

// Main component that wraps the Canvas
function BrutalistScene({ config }) {
  return (
    <CanvasContainer className="brutalist-canvas-container">
      {/* Export button removed as requested */}
      
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault fov={45} near={0.1} far={1000} />
        <color attach="background" args={['#d0d0d0']} />
        
        <Scene config={config} />
        
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={100}
          target={[0, config.floors * 1.5 / 2, 0]}
        />
        
        <Environment preset="city" />
      </Canvas>
    </CanvasContainer>
  );
}

export default BrutalistScene; 