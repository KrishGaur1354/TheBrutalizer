import React, { useMemo } from 'react';
import * as THREE from 'three';
import Window from './Window';
import Door from './Door';
import Tree from './Tree';
import { createOptimizedTexture } from '../utils/textureLoader';

function Building({ config }) {
  const { floors, width, depth, textureRoughness, concreteColor } = config;
  const floorHeight = 3;
  
  // Generate concrete material with optimized textures
  const concreteMaterial = useMemo(() => {
    return createOptimizedTexture(concreteColor, textureRoughness);
  }, [concreteColor, textureRoughness]);
  
  // Generate floor geometries optimized for performance
  const floorGeometries = useMemo(() => {
    const geometries = [];
    
    // Main building floors
    for (let i = 0; i < floors; i++) {
      const y = i * floorHeight;
      
      // Determine if this floor should have a smaller footprint (random setbacks)
      const shouldSetback = i > 0 && i % 3 === 0 && i < floors - 1;
      const floorWidth = shouldSetback ? width * 0.8 : width;
      const floorDepth = shouldSetback ? depth * 0.8 : depth;
      
      geometries.push({
        position: [0, y + floorHeight / 2, 0],
        size: [floorWidth, floorHeight, floorDepth]
      });
      
      // Add random architectural details
      if (i > 0 && Math.random() > 0.7) {
        // Side extension
        const extensionWidth = 2 + Math.random() * 3;
        const extensionDepth = 1 + Math.random() * 2;
        const xPos = (width / 2) - (extensionWidth / 2);
        
        geometries.push({
          position: [xPos, y + floorHeight / 2, 0],
          size: [extensionWidth, floorHeight, floorDepth + extensionDepth]
        });
      }
    }
    
    return geometries;
  }, [floors, width, depth]);
  
  // Generate window positions based on config
  const { windowPositions } = useMemo(() => {
    // Calculate window spacing
    const frontBackWindowsPerFloor = Math.floor(width / 2);
    const leftRightWindowsPerFloor = Math.floor(depth / 2);
    const windows = [];
    
    // Helper function to determine if a window should be placed
    const randomBool = (probability, uniqueSeed) => {
      const seed = Math.sin(uniqueSeed) * 43758.5453;
      return (seed - Math.floor(seed)) < probability;
    };
    
    for (let floor = 0; floor < floors; floor++) {
      const floorY = floor * floorHeight;
      
      // Get floor dimensions (may vary if there are setbacks)
      const floorGeo = floorGeometries.find(
        geo => Math.abs(geo.position[1] - (floorY + floorHeight/2)) < 0.1
      );
      
      const floorWidth = floorGeo ? floorGeo.size[0] : width;
      const floorDepth = floorGeo ? floorGeo.size[2] : depth;
      
      // Front face windows
      for (let i = 0; i < frontBackWindowsPerFloor; i++) {
        if (randomBool(config.windowDensity, floor * 0.01 + i * 0.001)) {
          const windowX = (-floorWidth / 2) + 1 + i * 2;
          windows.push({
            position: [windowX, floorY + floorHeight / 2, -floorDepth / 2],
            rotation: [0, 0, 0],
            size: [1.5, 1.5],
            face: 'front',
            floor
          });
        }
      }
      
      // Back face windows
      for (let i = 0; i < frontBackWindowsPerFloor; i++) {
        if (randomBool(config.windowDensity, floor * 0.01 + (i + frontBackWindowsPerFloor) * 0.001)) {
          const windowX = (-floorWidth / 2) + 1 + i * 2;
          windows.push({
            position: [windowX, floorY + floorHeight / 2, floorDepth / 2],
            rotation: [0, Math.PI, 0],
            size: [1.5, 1.5],
            face: 'back',
            floor
          });
        }
      }
      
      // Left face windows
      for (let i = 0; i < leftRightWindowsPerFloor; i++) {
        if (randomBool(config.windowDensity, floor * 0.01 + (i + frontBackWindowsPerFloor * 2) * 0.001)) {
          const windowZ = (-floorDepth / 2) + 1 + i * 2;
          windows.push({
            position: [-floorWidth / 2, floorY + floorHeight / 2, windowZ],
            rotation: [0, -Math.PI / 2, 0],
            size: [1.5, 1.5],
            face: 'left',
            floor
          });
        }
      }
      
      // Right face windows
      for (let i = 0; i < leftRightWindowsPerFloor; i++) {
        if (randomBool(config.windowDensity, floor * 0.01 + (i + frontBackWindowsPerFloor * 2 + leftRightWindowsPerFloor) * 0.001)) {
          const windowZ = (-floorDepth / 2) + 1 + i * 2;
          windows.push({
            position: [floorWidth / 2, floorY + floorHeight / 2, windowZ],
            rotation: [0, Math.PI / 2, 0],
            size: [1.5, 1.5],
            face: 'right',
            floor
          });
        }
      }
    }
    
    return { windowPositions: windows };
  }, [floors, width, depth, config.windowDensity, floorGeometries]);
  
  // Generate door positions for the ground floor
  const doorData = useMemo(() => {
    const doors = [];
    const frontPos = [0, floorHeight / 2, -depth / 2];
    
    // Main entrance
    doors.push({
      position: frontPos,
      rotation: [0, 0, 0],
      size: [2.5, 2.5],
      isMain: true
    });
    
    // Side doors (random)
    if (Math.random() > 0.5) {
      doors.push({
        position: [width / 2, floorHeight / 2, 0],
        rotation: [0, Math.PI / 2, 0],
        size: [2, 2.5],
        isMain: false
      });
    }
    
    if (Math.random() > 0.5) {
      doors.push({
        position: [-width / 2, floorHeight / 2, 0],
        rotation: [0, -Math.PI / 2, 0],
        size: [2, 2.5],
        isMain: false
      });
    }
    
    return doors;
  }, [width, depth, floorHeight]);
  
  // Create rooftop garden if enabled
  const rooftopGarden = useMemo(() => {
    if (!config.rooftopGarden) return null;
    
    const trees = [];
    const flowerBeds = [];
    const paths = [];
    
    const floorY = config.floors * floorHeight;
    const gardenHeight = 0.2; // Height of the garden soil layer
    
    // Create garden base (soil layer)
    const gardenBase = {
      position: [0, floorY + gardenHeight/2, 0],
      size: [width, gardenHeight, depth]
    };
    
    // Add some trees to the rooftop
    const treeCount = Math.min(Math.max(3, Math.floor((width * depth) / 30)), 12);
    for (let i = 0; i < treeCount; i++) {
      const x = (Math.random() * width) - (width / 2) + 1;
      const z = (Math.random() * depth) - (depth / 2) + 1;
      
      // Make sure trees aren't too close to the edge
      if (
        Math.abs(x) < width/2 - 1.5 && 
        Math.abs(z) < depth/2 - 1.5
      ) {
        trees.push({
          position: [x, floorY + gardenHeight, z],
          scale: 0.7 + Math.random() * 0.4
        });
      }
    }
    
    // Add some flower beds
    const flowerBedCount = Math.min(Math.floor((width * depth) / 40), 5);
    for (let i = 0; i < flowerBedCount; i++) {
      const size = 1 + Math.random() * 2;
      const x = (Math.random() * (width - size*2)) - (width/2 - size);
      const z = (Math.random() * (depth - size*2)) - (depth/2 - size);
      
      flowerBeds.push({
        position: [x, floorY + gardenHeight/2 + 0.05, z],
        size: [size, 0.1, size]
      });
    }
    
    // Add central path
    paths.push({
      position: [0, floorY + gardenHeight/2 + 0.02, 0],
      size: [width * 0.6, 0.05, 1.5]
    });
    
    paths.push({
      position: [0, floorY + gardenHeight/2 + 0.02, 0],
      size: [1.5, 0.05, depth * 0.6]
    });
    
    return { gardenBase, trees, flowerBeds, paths };
  }, [config.rooftopGarden, config.floors, width, depth, floorHeight]);

  return (
    <group>
      {/* Main building structure */}
      {floorGeometries.map((floorGeometry, index) => (
        <mesh 
          key={`floor-${index}`} 
          position={floorGeometry.position} 
          castShadow 
          receiveShadow
        >
          <boxGeometry args={floorGeometry.size} />
          <meshStandardMaterial {...concreteMaterial} />
        </mesh>
      ))}
      
      {/* Windows */}
      {windowPositions.map((windowData, index) => (
        <Window 
          key={`window-${index}`} 
          position={windowData.position} 
          rotation={windowData.rotation} 
          size={windowData.size}
          face={windowData.face}
        />
      ))}
      
      {/* Doors */}
      {doorData.map((doorData, index) => (
        <Door 
          key={`door-${index}`} 
          position={doorData.position} 
          rotation={doorData.rotation} 
          size={doorData.size} 
          isMain={doorData.isMain} 
        />
      ))}
      
      {/* Rooftop Garden (if enabled) */}
      {rooftopGarden && (
        <group>
          {/* Garden soil base */}
          <mesh
            position={rooftopGarden.gardenBase.position}
            receiveShadow
          >
            <boxGeometry args={rooftopGarden.gardenBase.size} />
            <meshStandardMaterial color="#3a2a1a" roughness={1} />
          </mesh>
          
          {/* Garden grass */}
          <mesh
            position={[
              rooftopGarden.gardenBase.position[0], 
              rooftopGarden.gardenBase.position[1] + 0.05, 
              rooftopGarden.gardenBase.position[2]
            ]}
            receiveShadow
          >
            <boxGeometry args={[
              rooftopGarden.gardenBase.size[0] - 0.5,
              0.05,
              rooftopGarden.gardenBase.size[2] - 0.5
            ]} />
            <meshStandardMaterial color="#4a7c59" roughness={0.9} />
          </mesh>
          
          {/* Trees */}
          {rooftopGarden.trees.map((tree, index) => (
            <Tree
              key={`roof-tree-${index}`}
              position={tree.position}
              scale={[tree.scale, tree.scale, tree.scale]}
            />
          ))}
          
          {/* Flower beds */}
          {rooftopGarden.flowerBeds.map((bed, index) => (
            <mesh
              key={`flower-bed-${index}`}
              position={bed.position}
              receiveShadow
            >
              <boxGeometry args={bed.size} />
              <meshStandardMaterial color="#a03c78" roughness={0.8} />
            </mesh>
          ))}
          
          {/* Paths */}
          {rooftopGarden.paths.map((path, index) => (
            <mesh
              key={`path-${index}`}
              position={path.position}
              receiveShadow
            >
              <boxGeometry args={path.size} />
              <meshStandardMaterial color="#b5a57e" roughness={1} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

export default Building; 