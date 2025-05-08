import React, { useRef, useEffect, useMemo, useState, useCallback, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  PerspectiveCamera, 
  Environment, 
  ContactShadows,
  Cloud,
  Html,
  KeyboardControls
} from '@react-three/drei';
import { EffectComposer, SSAO, Bloom, ToneMapping } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';
import styled from 'styled-components';
import Building from '../components/Building';
import { captureCanvasImage } from '../utils/imageCapture';
import Bench from '../components/Bench';
import Tree from '../components/Tree';
import SharePanel from '../components/SharePanel';
import Car from '../components/Car';
import { toPng } from 'html-to-image';
import { MathUtils } from 'three';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import PlayerCar from '/src/components/PlayerCar.jsx';

// Simple seeded random function
function seededRandom(seed) {
  const a = 1664525;
  const c = 1013904223;
  const m = Math.pow(2, 32);
  let _seed = seed;
  
  return {
    // Get next random number between 0 and 1
    random: function() {
      _seed = (_seed * a + c) % m;
      return _seed / m;
    },
    // Get a random number between min and max
    range: function(min, max) {
      return min + this.random() * (max - min);
    }
  };
}

// Styled component for the canvas container with concrete-inspired styling
const CanvasContainer = styled.div`
  width: 100%;
  height: 100%;
  background-color: #d0d0d0;
  position: relative;
`;

// Control button styling
const ControlButton = styled.button`
  position: absolute;
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

const ZoomInButton = styled(ControlButton)`
  top: 20px;
  left: 20px;
`;

const ZoomOutButton = styled(ControlButton)`
  top: 20px;
  left: 100px;
`;

const ScreenshotButton = styled(ControlButton)`
  top: 20px;
  right: 20px;
`;

// Camera mode toggle button
const CameraToggleButton = styled(ControlButton)`
  top: 20px;
  left: 200px;
`;

// Physics-aware Tree component
function PhysicsTree({ position, scale, treeKey }) {
  // Approximate bounding box for collision
  const height = 4 * scale[1];
  const radius = 1.5 * Math.max(scale[0], scale[2]);

  return (
    <RigidBody 
      key={`${treeKey}-physics`} 
      type="fixed" 
      colliders="cuboid" 
      position={position}
    >
      <Tree position={[0, 0, 0]} scale={scale} />
      <CuboidCollider args={[radius / 2, height / 2, radius / 2]} position={[0, height / 2, 0]} />
    </RigidBody>
  );
}

// Function to create a concrete ground with physics-aware trees
function ConcreteGround({ groundPark = false, seed }) {
  const groundSize = 500;
  
  // Memoize tree data based on the seed to trigger re-calculation/animation
  const treeData = useMemo(() => {
    const trees = [];
    const treeCount = groundPark ? 30 : 0; // Only generate trees if it's a park
    const random = seededRandom(seed || 12345); // Create seeded random function

    for (let i = 0; i < treeCount; i++) {
      const angle = random.random() * Math.PI * 2;
      const radius = random.range(10, 35);
      let x = Math.cos(angle) * radius;
      let z = Math.sin(angle) * radius;
      const scale = random.range(0.8, 1.2);
      
      // Add slight random offset based on seed for animation effect
      x += (random.random() - 0.5) * 0.5;
      z += (random.random() - 0.5) * 0.5;
      
      // Don't place trees on the path
      if (Math.abs(x) < 3 && Math.abs(z) < 30) continue;
      if (Math.abs(z) < 3 && Math.abs(x) < 30) continue;

      trees.push({ 
        key: `ground-tree-${i}-${seed}`, // Include seed in key for re-rendering
        position: [x, 0, z], 
        scale: [scale, scale, scale] 
      });
    }
    return trees;
  }, [groundPark, seed]);

  // Bench data - can also be memoized if needed
  const benchData = useMemo(() => {
    if (!groundPark) return [];
    const benches = [];
    const random = seededRandom(seed || 12345);
    
    for(let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 20;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const rotation = [0, angle + Math.PI/2, 0];
      benches.push({ key: `bench-${i}`, position: [x, 0, z], rotation });
    }
    return benches;
  }, [groundPark, seed]);
  
  if (!groundPark) {
    // Regular concrete ground
    return (
      <RigidBody type="fixed" colliders="cuboid">
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
          <planeGeometry args={[groundSize, groundSize]} />
          <meshStandardMaterial color="#aaaaaa" roughness={0.9} />
        </mesh>
      </RigidBody>
    );
  } else {
    // Park ground with grass and paths
    return (
      <group>
        {/* Ground Plane with Collider */}
        <RigidBody type="fixed" colliders="cuboid">
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
            <planeGeometry args={[groundSize, groundSize]} />
            <meshStandardMaterial color="#aaaaaa" roughness={0.9} />
          </mesh>
        </RigidBody>
        
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
        {treeData.map(tree => (
          <PhysicsTree 
            key={tree.key} 
            treeKey={tree.key}
            position={tree.position} 
            scale={tree.scale} 
          />
        ))}
        
        {/* Add some benches along the paths */}
        {benchData.map(bench => (
            <Bench 
              key={bench.key} 
              position={bench.position} 
              rotation={bench.rotation} 
            />
        ))}
      </group>
    );
  }
}

// Procedural clouds component with optimized cloud rendering and reduced height
function ProceduralSky({ cloudDensity = 0.7 }) {
  const sunRef = useRef();
  const sunPosition = useMemo(() => new THREE.Vector3(100, 50, 100), []);
  
  // Calculate cloud parameters based on density - optimized to reduce WebGL warnings
  const cloudParams = useMemo(() => {
    // No need for seeded randomness in clouds, they're purely visual
    // Limit maximum cloud count based on density to prevent GPU overload
    const cloudCount = Math.min(Math.floor(cloudDensity * 8) + 1, 8); 
    const cloudOpacity = 0.3 + (cloudDensity * 0.7);
    
    const clouds = [];
    for (let i = 0; i < cloudCount; i++) {
      const angle = (i / cloudCount) * Math.PI * 2;
      const distance = 50 + (i * 15) % 50; // More structured placement to reduce randomness
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      
      // REDUCED CLOUD HEIGHT: Lower the y position by 30-40%
      const y = 25 + Math.floor((i % 3) * 10); // Reduced from previous height values of ~50-80
      
      // Reduced cloud width too
      const width = 16 + Math.floor((i % 5) * 3);
      const depth = 16 + Math.floor((i % 5) * 3);
      const height = 4 + Math.floor((i % 3) * 2);
      
      clouds.push({
        position: [x, y, z],
        size: [width, height, depth],
        opacity: cloudOpacity,
      });
    }
    return clouds;
  }, [cloudDensity]);
  
  return (
    <group>
      {/* Sun (directional light) */}
      <directionalLight 
        ref={sunRef}
        intensity={1} 
        position={sunPosition} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* Ambient light */}
      <ambientLight intensity={0.5} />
      
      {/* Hemisphere light for better scene illumination */}
      <hemisphereLight
        intensity={0.3}
        color="#ffffff"
        groundColor="#bbbbbb"
      />
      
      {/* Sky background - changed to gray */}
      <color attach="background" args={['#888888']} />
      
      {/* Performance optimized clouds */}
      {cloudParams.map((cloud, i) => (
        <Cloud 
          key={`cloud-${i}`}
          position={cloud.position}
          args={cloud.size}
          opacity={cloud.opacity}
          speed={0.2} // Reduced cloud animation speed for performance
          segments={6} // Reduced from standard 10+ for better performance
          depth={cloud.size[2] * 0.4} // Reduced internal segments
          fade={100} // Increased fade distance
        />
      ))}
    </group>
  );
}

// Camera setup component
function CameraSetup({ config }) {
  const { camera } = useThree();
  
  // Calculate camera position based on building size
  useEffect(() => {
    try {
      const { width, depth, floors } = config;
      const size = Math.max(width, depth, floors * 3);
      const distance = size * 2;
      
      camera.position.set(distance, distance * 0.7, distance);
      camera.lookAt(0, floors * 1.5, 0);
      camera.updateProjectionMatrix();
    } catch (err) {
      console.error("Camera setup error:", err);
    }
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

// Improved ClassicCars component with better performance and realistic movement
function ClassicCars({ buildingSize }) {
  const ROAD_MARGIN = 15; // Distance from building to place cars
  const NUM_ROADS = 4; // 4 roads around the building
  const MAX_CARS_PER_ROAD = 4; // Maximum cars per road to prevent performance issues

  // Car data with calculated roads
  const carData = useMemo(() => {
    const data = [];
    const buildingRadius = Math.sqrt(Math.pow(buildingSize.width/2, 2) + Math.pow(buildingSize.depth/2, 2));
    const roadRadius = buildingRadius + ROAD_MARGIN;
    
    // Generate cars for each road
    for (let roadIndex = 0; roadIndex < NUM_ROADS; roadIndex++) {
      const numCars = 2 + Math.floor(Math.random() * (MAX_CARS_PER_ROAD - 1));
      const angle = (roadIndex / NUM_ROADS) * Math.PI * 2;
      
      // Road start and end positions
      const roadX = Math.cos(angle) * roadRadius;
      const roadZ = Math.sin(angle) * roadRadius;
      const roadLength = 60; // Fixed road length
      
      // Generate cars on this road
      for (let carIndex = 0; carIndex < numCars; carIndex++) {
        // Distribute cars evenly along the road
        const roadProgress = (carIndex / numCars) * roadLength;
        
        // Calculate initial car positions
        const carX = roadX - roadProgress * Math.cos(angle);
        const carZ = roadZ - roadProgress * Math.sin(angle);
        
        data.push({
          id: `car-${roadIndex}-${carIndex}`,
          position: [carX, 0, carZ],
          rotation: [0, angle, 0],
          carType: Math.floor(Math.random() * 3),
          color: ['#a31621', '#3c91e6', '#342e37', '#fafffd', '#fb8b24'][Math.floor(Math.random() * 5)],
          speed: 0.02 + Math.random() * 0.04,
          roadIndex,
          roadAngle: angle,
          roadLength,
        });
      }
    }
    return data;
  }, [buildingSize]);
  
  // Update car positions in animation frame
  const [cars, setCars] = useState(carData);
  
  useFrame(() => {
    setCars(prevCars => 
      prevCars.map(car => {
        // Move car along its road
        const newPosition = [...car.position];
        const moveX = Math.cos(car.roadAngle) * car.speed;
        const moveZ = Math.sin(car.roadAngle) * car.speed;
        
        newPosition[0] -= moveX;
        newPosition[2] -= moveZ;
        
        // Calculate distance from road center to determine when to reset
        const distanceFromCenter = Math.sqrt(
          Math.pow(newPosition[0] - Math.cos(car.roadAngle) * (buildingSize.width/2 + ROAD_MARGIN), 2) +
          Math.pow(newPosition[2] - Math.sin(car.roadAngle) * (buildingSize.depth/2 + ROAD_MARGIN), 2)
        );
        
        // Reset car position if moved too far
        if (distanceFromCenter > car.roadLength) {
          const roadRadius = Math.sqrt(Math.pow(buildingSize.width/2, 2) + Math.pow(buildingSize.depth/2, 2)) + ROAD_MARGIN;
          const roadX = Math.cos(car.roadAngle) * roadRadius;
          const roadZ = Math.sin(car.roadAngle) * roadRadius;
          
          return {
            ...car,
            position: [roadX, 0, roadZ],
          };
        }
        
        return {
          ...car,
          position: newPosition,
        };
      })
    );
  });
  
  return (
    <group>
      {cars.map(car => (
        <Car
          key={car.id}
          position={car.position}
          rotation={car.rotation}
          carType={car.carType}
          color={car.color}
        />
      ))}
    </group>
  );
}

// Physics-aware Building component
function PhysicsBuilding({ buildingKey, config, position }) {
  return (
    <RigidBody 
      key={`${buildingKey}-physics`} 
      type="fixed" 
      colliders="cuboid"
      position={position}
    >
      <Building config={config} position={[0, 0, 0]} />
      <CuboidCollider 
        args={[config.width / 2, (config.floors * 3) / 2, config.depth / 2]} 
        position={[0, (config.floors * 3) / 2, 0]}
      />
    </RigidBody>
  );
}

// Component to manage procedural city layout with physics
function CityLayout({ config }) {
  const buildingData = useMemo(() => {
    const buildings = [];
    const random = seededRandom(config.seed || 12345);
    const citySize = 150; // Area around the center where buildings can spawn
    const minDistance = Math.max(config.width, config.depth) + 15; // Minimum distance between buildings
    const buildingCount = 5 + Math.floor(random.random() * 5); // Generate 5-9 extra buildings

    // Add the central building first (using main config)
    buildings.push({ 
      key: `building-center-${config.seed}`,
      position: [0, 0, 0],
      config: { ...config } 
    });

    for (let i = 0; i < buildingCount; i++) {
      let positionValid = false;
      let x, z;
      let attempts = 0;
      
      while (!positionValid && attempts < 50) {
        const angle = random.random() * Math.PI * 2;
        const radius = minDistance + random.random() * (citySize - minDistance);
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        positionValid = true;

        // Check distance from other buildings
        for (const existingBuilding of buildings) {
          const dx = existingBuilding.position[0] - x;
          const dz = existingBuilding.position[2] - z;
          const distance = Math.sqrt(dx * dx + dz * dz);
          if (distance < minDistance) {
            positionValid = false;
            break;
          }
        }
        attempts++;
      }

      if (positionValid) {
        // Generate slightly varied config for this building
        const buildingConfig = {
          ...config, // Base config
          floors: 3 + Math.floor(random.random() * (config.floors * 0.8)), // Vary floors
          width: Math.max(5, config.width * (0.7 + random.random() * 0.6)), // Vary width
          depth: Math.max(5, config.depth * (0.7 + random.random() * 0.6)), // Vary depth
          // Keep window density, color etc. same or vary them too
        };
        buildings.push({ 
          key: `building-${i}-${config.seed}`,
          position: [x, 0, z], 
          config: buildingConfig
        });
      }
    }
    return buildings;
  }, [config]); // Re-generate layout if config (especially seed) changes

  return (
    <group>
      {buildingData.map(data => (
        <PhysicsBuilding 
          key={data.key}
          buildingKey={data.key}
          position={data.position}
          config={data.config} 
        />
      ))}
    </group>
  );
}

// Main Scene component with camera switching and physics
function Scene({ config, cameraMode, playerCarRef }) {
  const [isReady, setIsReady] = useState(false);
  
  // Calculate building size for various components
  const buildingSize = useMemo(() => ({
    width: config.width,
    depth: config.depth,
    height: config.floors * 3 // Each floor is 3 units tall
  }), [config.width, config.depth, config.floors]);
  
  // Ensure scene is initialized
  useEffect(() => {
    // Slight delay to ensure physics world is ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <>
      {/* Camera setup based on mode */}
      <CameraSetup config={config} />
      
      {/* Performance optimized lighting */}
      <LightingSetup />
      
      {/* Main building with physics */}
      <PhysicsBuilding 
        buildingKey={`building-${config.seed}`}
        config={config} 
        position={[0, 0, 0]} 
      />
      
      {/* Ground */}
      <ConcreteGround groundPark={config.groundPark} seed={config.seed} />
      
      {/* Procedural sky with clouds */}
      <ProceduralSky cloudDensity={config.cloudDensity} />
      
      {/* Physics-aware player-controlled car */}
      {isReady && <PlayerCar ref={playerCarRef} cameraMode={cameraMode} />}
      
      {/* Decorative cars around the building */}
      <ClassicCars buildingSize={buildingSize} />
      
      {/* Create a full city layout around the main building */}
      <CityLayout config={config} />
    </>
  );
}

// Main component that wraps the Canvas
function BrutalistScene({ config, onCaptureImage, playerCarRef }) {
  const canvasRef = useRef();
  const orbitControlsRef = useRef();
  const [cameraMode, setCameraMode] = useState('orbit');
  const [captureRequested, setCaptureRequested] = useState(false);
  
  // Handle camera toggle
  const toggleCameraMode = () => {
    setCameraMode(prev => prev === 'orbit' ? 'player' : 'orbit');
  };
  
  // Request a screenshot capture
  const requestCapture = () => {
    setCaptureRequested(true);
  };
  
  // Enable/disable orbit controls based on camera mode
  useEffect(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.enabled = (cameraMode === 'orbit');
    }
  }, [cameraMode]);
  
  // Update orbit controls target when building size changes
  useEffect(() => {
    if (orbitControlsRef.current) {
      orbitControlsRef.current.target.set(0, config.floors * 1.5 / 2, 0);
      orbitControlsRef.current.update();
    }
  }, [config.floors]);
  
  // Handle the screenshot capture
  useEffect(() => {
    if (captureRequested && canvasRef.current) {
      try {
        const imageData = captureCanvasImage(canvasRef.current);
        onCaptureImage(imageData);
      } catch (err) {
        console.error("Image capture error:", err);
      }
      setCaptureRequested(false);
    }
  }, [captureRequested, onCaptureImage]);
  
  return (
    <CanvasContainer>
      <Canvas 
        ref={canvasRef}
        shadows 
        dpr={[1, 2]} // Limit max pixel ratio to 2 for performance
        gl={{ 
          antialias: true,
          // Disable depth textures for better performance
          depth: true,
          stencil: false,
          alpha: false,
          powerPreference: "high-performance"
        }}
        camera={{ position: [40, 25, 40], fov: 45 }}
      >
        <KeyboardControls
          map={[
            { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
            { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
            { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
            { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
            { name: 'brake', keys: ['Space'] },
            { name: 'shift', keys: ['ShiftLeft', 'ShiftRight'] }
          ]}
        >
          <Suspense fallback={null}>
            <Physics 
              gravity={[0, -30, 0]} 
              timeStep={1/60}
              interpolation={true}
            >
              <Scene config={config} cameraMode={cameraMode} playerCarRef={playerCarRef} />
            </Physics>
            
            {/* Add orbit controls */}
            {cameraMode === 'orbit' && (
              <OrbitControls 
                ref={orbitControlsRef}
                enablePan={true}
                enableZoom={true}
                enableRotate={true}
                minDistance={5}
                maxDistance={200}
                target={[0, config.floors * 1.5 / 2, 0]}
              />
            )}
          </Suspense>
        </KeyboardControls>
      </Canvas>
      
      <CameraToggleButton onClick={toggleCameraMode}>
        {cameraMode === 'orbit' ? 'DRIVE MODE' : 'ORBIT MODE'}
      </CameraToggleButton>
      
      <ScreenshotButton onClick={requestCapture}>
        CAPTURE
      </ScreenshotButton>
    </CanvasContainer>
  );
}

export default BrutalistScene; 