import React, { useRef, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows,
  useHelper
} from '@react-three/drei';
import { EffectComposer, SSAO, Bloom } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import styled from 'styled-components';
import Building from '../components/Building';
import { captureSceneImage } from '../utils/imageCapture';

// Styled component for the canvas container
const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
`;

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

// Lighting setup component
function LightingSetup() {
  const directionalLightRef = useRef();
  
  // Helper to visualize light direction (only in development)
  // useHelper(directionalLightRef, THREE.DirectionalLightHelper, 5, 'red');
  
  return (
    <>
      {/* Main directional light (sun) */}
      <directionalLight
        ref={directionalLightRef}
        position={[10, 20, 15]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      
      {/* Ambient light for overall illumination */}
      <ambientLight intensity={0.5} />
      
      {/* Additional fill light */}
      <directionalLight position={[-10, 10, -5]} intensity={0.2} />
    </>
  );
}

// Main scene component
function Scene({ config, onCaptureImage, onCaptureComplete }) {
  const { gl, scene, camera } = useThree();
  
  // Handle image capture request
  useEffect(() => {
    if (config.captureRequested) {
      // Capture the scene
      captureSceneImage(gl, scene, camera, config.buildingName)
        .then((imageData) => {
          onCaptureImage(imageData);
          onCaptureComplete();
        })
        .catch((error) => {
          console.error('Failed to capture image:', error);
          onCaptureComplete();
        });
    }
  }, [config.captureRequested, gl, scene, camera, config.buildingName, onCaptureImage, onCaptureComplete]);
  
  return (
    <>
      <CameraSetup config={config} />
      <LightingSetup />
      
      {/* Main building - positioned slightly above the floor to prevent door clipping */}
      <group position={[0, 0.01, 0]}>
        <Building config={config} />
      </group>
      
      {/* Ground shadows - optimized for performance */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.3}
        scale={80}
        blur={0.5}
        far={8}
        resolution={256}
        color="#000000"
      />
      
      {/* Simplified post-processing for better performance */}
      <EffectComposer multisampling={0}>
        <SSAO
          blendFunction={BlendFunction.MULTIPLY}
          samples={10}
          radius={0.3}
          intensity={8}
          luminanceInfluence={0.7}
          color="black"
        />
        {/* Bloom disabled for better performance */}
        {/* <Bloom
          intensity={0.05}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.9}
        /> */}
      </EffectComposer>
    </>
  );
}

// Main component that wraps the Canvas
function BrutalistScene({ config, onCaptureImage, onCaptureComplete }) {
  return (
    <CanvasContainer className="brutalist-canvas-container">
      <Canvas shadows dpr={[1, 1.2]}>
        <PerspectiveCamera makeDefault fov={45} near={0.1} far={1000} />
        <color attach="background" args={['#e0e0e0']} />
        
        <Scene 
          config={config} 
          onCaptureImage={onCaptureImage} 
          onCaptureComplete={onCaptureComplete} 
        />
        
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