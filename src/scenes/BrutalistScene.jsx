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

// Procedural clouds component with optimized cloud rendering
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

// Classic cars component
function ClassicCars({ buildingSize }) {
  const cars = useMemo(() => {
    const carCount = 5;
    const roads = [];
    
    // Create a grid of roads around the building
    const gridSize = Math.max(buildingSize.width, buildingSize.depth) * 3;
    const roadWidth = 6;
    
    // Horizontal roads
    for (let z = -gridSize; z <= gridSize; z += gridSize / 2) {
      roads.push({
        start: [-gridSize, 0, z],
        end: [gridSize, 0, z],
        direction: [1, 0, 0]
      });
    }
    
    // Vertical roads
    for (let x = -gridSize; x <= gridSize; x += gridSize / 2) {
      roads.push({
        start: [x, 0, -gridSize],
        end: [x, 0, gridSize],
        direction: [0, 0, 1]
      });
    }
    
    // Create cars for each road - use regular Math.random since we don't need seeded randomness here
    return Array(carCount).fill().map((_, i) => {
      const roadIndex = i % roads.length;
      const road = roads[roadIndex];
      const direction = road.direction;
      
      // Random position along the road
      const progress = Math.random();
      const position = [
        road.start[0] + (road.end[0] - road.start[0]) * progress,
        0.5, // Slightly above ground
        road.start[2] + (road.end[2] - road.start[2]) * progress
      ];
      
      // Calculate rotation based on direction
      const rotation = [0, direction[0] === 0 ? Math.PI / 2 : 0, 0];
      
      // Randomize car attributes
      const speed = 0.03 + Math.random() * 0.05;
      const carType = Math.floor(Math.random() * 3); // 0, 1, or 2 for different car types
      const color = ['#a31621', '#2e86ab', '#207178', '#60492c', '#4b4237'][Math.floor(Math.random() * 5)];
      
      return {
        roadIndex,
        position,
        rotation,
        speed,
        carType,
        color,
        progress
      };
    });
  }, [buildingSize]);
  
  // Move cars along roads
  useFrame(({ clock }) => {
    const deltaTime = clock.getElapsedTime() * 0.1;
    
    cars.forEach(car => {
      car.progress += car.speed * 0.01;
      
      // Reset position if car reaches the end of the road
      if (car.progress > 1) {
        car.progress = 0;
      }
    });
  });
  
  return (
    <group>
      {cars.map((car, i) => (
        <Car
          key={`car-${i}`}
          position={car.position}
          rotation={car.rotation}
          carType={car.carType}
          color={car.color}
          progress={car.progress}
          roadIndex={car.roadIndex}
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

// Define keyboard controls map
const controlsMap = [
  { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
  { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
  { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
  { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
  { name: 'brake', keys: ['Space'] },
];

// Main Scene component with camera switching and physics
function Scene({ config, cameraMode, playerCarRef }) {
  const { camera } = useThree();
  const [capturedImageUrl, setCapturedImageUrl] = useState(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  
  // Building params used for benches, cars etc. (refers to the central building)
  const centralBuildingParams = useMemo(() => {
    return {
      width: config.width,
      depth: config.depth,
      // other params if needed
    };
  }, [config.width, config.depth]);
  
  // Position benches around the *central* building area (or could be moved to GroundPark)
  const benchPositions = useMemo(() => {
      if (!config.groundPark) return []; // Only show if park is enabled
      const positions = [];
      const { width, depth } = centralBuildingParams; 
      // Adjust placement relative to central park area if needed
      // Example placement (might need adjustment based on park layout):
      positions.push({ position: [-width/4, 0, -depth/2 - 3], rotation: [0, 0, 0] });
      positions.push({ position: [width/4, 0, -depth/2 - 3], rotation: [0, 0, 0] });
      positions.push({ position: [-width/2 - 3, 0, 0], rotation: [0, Math.PI/2, 0] });
      positions.push({ position: [width/2 + 3, 0, 0], rotation: [0, -Math.PI/2, 0] });
      return positions;
  }, [centralBuildingParams, config.groundPark]);

  // Set camera position based on mode
  useEffect(() => {
    if (cameraMode === 'orbit') {
      // Reset orbit controls target and position if switching back
      // (OrbitControls manages its own position based on user input)
    } 
    // In 'player' mode, the PlayerCar component will manage the camera
  }, [cameraMode, camera]); 

  return (
    <Suspense fallback={null}>
      <Physics gravity={[0, -9.81, 0]}>
        <PlayerCar ref={playerCarRef} cameraMode={cameraMode} />
        <CityLayout config={config} />
        
        <ProceduralSky cloudDensity={config.cloudDensity || 0.7} />
        
        <ConcreteGround groundPark={config.groundPark || false} seed={config.seed} />
        
        <ContactShadows
          position={[0, 0, 0]}
          opacity={0.5}
          scale={100}
          blur={1}
          far={10}
          resolution={512}
          color="#000000"
        />
        
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
      </Physics>
      
      {showShareOptions && capturedImageUrl && (
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
      )}
    </Suspense>
  );
}

// Main component that wraps the Canvas
function BrutalistScene({ config, onCaptureImage, onCaptureComplete }) {
  const canvasContainerRef = useRef();
  const controlsRef = useRef();
  const playerCarRef = useRef();
  const [cameraMode, setCameraMode] = useState('orbit');

  const handleScreenshot = useCallback(() => {
    if (!canvasContainerRef.current) return;
    
    const elementToCapture = canvasContainerRef.current;
    
    toPng(elementToCapture, { 
        backgroundColor: '#d0d0d0',
        pixelRatio: window.devicePixelRatio || 1,
    })
      .then(imageUrl => {
        if (onCaptureImage) {
          onCaptureImage(imageUrl);
        }
        if (onCaptureComplete) {
          onCaptureComplete(); 
        }
      })
      .catch(error => {
        console.error('Error capturing image using html-to-image:', error);
        if (onCaptureComplete) {
          onCaptureComplete();
        }
      });
  }, [onCaptureImage, onCaptureComplete]);
  
  const handleZoomIn = useCallback(() => {
    if (controlsRef.current) {
      const currentDistance = controlsRef.current.getDistance();
      controlsRef.current.dollyIn(1.2);
      controlsRef.current.update();
    }
  }, []);
  
  const handleZoomOut = useCallback(() => {
    if (controlsRef.current) {
      const currentDistance = controlsRef.current.getDistance();
      controlsRef.current.dollyOut(1.2);
      controlsRef.current.update();
    }
  }, []);
  
  const toggleCameraMode = useCallback(() => {
    setCameraMode(prevMode => (prevMode === 'orbit' ? 'player' : 'orbit'));
  }, []);

  // Disable OrbitControls when in player mode
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = (cameraMode === 'orbit');
    }
  }, [cameraMode]);

  return (
    <CanvasContainer ref={canvasContainerRef} className="brutalist-canvas-container">
      <ZoomInButton onClick={handleZoomIn}>+</ZoomInButton>
      <ZoomOutButton onClick={handleZoomOut}>-</ZoomOutButton>
      <CameraToggleButton onClick={toggleCameraMode}>
        {cameraMode === 'orbit' ? 'Enter Car' : 'Orbit Cam'}
      </CameraToggleButton>
      <ScreenshotButton onClick={handleScreenshot}>CAPTURE</ScreenshotButton>
      
      <KeyboardControls map={controlsMap}>
        <Canvas shadows dpr={[1, 2]}>
          {cameraMode === 'orbit' && (
            <PerspectiveCamera makeDefault fov={45} near={0.1} far={1000} position={[50, 50, 50]} />
          )}
          
          <color attach="background" args={['#d0d0d0']} />
          <ambientLight intensity={0.7} />
          <directionalLight
            ref={controlsRef}
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
          
          <Scene config={config} cameraMode={cameraMode} playerCarRef={playerCarRef} />
          
          {cameraMode === 'orbit' && (
            <OrbitControls 
              ref={controlsRef}
              enablePan={true}
              enableZoom={true}
              enableRotate={true}
              minDistance={5}
              maxDistance={200}
              target={[0, config.floors * 1.5 / 2, 0]}
            />
          )}
          
          <Environment preset="city" />
        </Canvas>
      </KeyboardControls>
    </CanvasContainer>
  );
}

export default BrutalistScene; 