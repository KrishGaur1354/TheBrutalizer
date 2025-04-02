import React, { useMemo } from 'react';
import * as THREE from 'three';
import Window from './Window';
import Door from './Door';
import Tree from './Tree';
import { createOptimizedTexture } from '../utils/textureLoader';

// Simple seeded random function (same implementation as in BrutalistScene.jsx)
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

function Building({ config, position = [0, 0, 0] }) {
  const { floors, width, depth, textureRoughness, concreteColor, windowDensity, rooftopGarden, seed } = config;
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
  
  // Generate window positions based on config and seed for variation
  const windowPositions = useMemo(() => {
    const positions = [];
    const random = seededRandom(seed || 12345); // Use seeded random
    
    for (let i = 0; i < floors; i++) {
      const y = i * floorHeight + floorHeight / 2;
      const floorWidth = width; // Assuming width/depth don't change per floor for windows
      const floorDepth = depth;
      
      // Front/Back faces
      for (let x = -floorWidth / 2 + 1; x < floorWidth / 2; x += 2.5) {
        if (random.random() < windowDensity) {
          positions.push({ pos: [x, y, -floorDepth / 2], rot: [0, 0, 0], face: 'front' });
        }
        if (random.random() < windowDensity) {
          positions.push({ pos: [x, y, floorDepth / 2], rot: [0, Math.PI, 0], face: 'back' });
        }
      }
      
      // Left/Right faces
      for (let z = -floorDepth / 2 + 1; z < floorDepth / 2; z += 2.5) {
        if (random.random() < windowDensity) {
          positions.push({ pos: [-floorWidth / 2, y, z], rot: [0, -Math.PI / 2, 0], face: 'left' });
        }
        if (random.random() < windowDensity) {
          positions.push({ pos: [floorWidth / 2, y, z], rot: [0, Math.PI / 2, 0], face: 'right' });
        }
      }
    }
    return positions;
  }, [floors, width, depth, windowDensity, seed]);
  
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
  
  // Rooftop garden elements
  const rooftopElements = useMemo(() => {
    if (!rooftopGarden) return [];
    const elements = [];
    const random = seededRandom((seed || 12345) + 1); // Different seed
    const topY = floors * floorHeight;
    
    // Add some trees
    for (let i = 0; i < 5; i++) {
      const x = random.range(-width * 0.4, width * 0.4);
      const z = random.range(-depth * 0.4, depth * 0.4);
      const scale = random.range(0.5, 1.0);
      elements.push(
        <Tree key={`roof-tree-${i}`} position={[x, topY, z]} scale={[scale, scale, scale]} />
      );
    }
    // Add other garden elements like benches if desired
    
    return elements;
  }, [rooftopGarden, floors, floorHeight, width, depth, seed]);

  return (
    <group position={position}>
      {/* Main building structure */}
      {floorGeometries.map((floorGeometry, index) => (
        <mesh 
          key={`floor-${index}-${seed}`}
          position={floorGeometry.position} 
          castShadow 
          receiveShadow
        >
          <boxGeometry args={floorGeometry.size} />
          <meshStandardMaterial {...concreteMaterial} />
        </mesh>
      ))}
      
      {/* Windows */}
      {windowPositions.map((win, index) => (
        <Window 
          key={`window-${index}-${seed}`}
          position={win.pos}
          rotation={win.rot}
          size={[1.5, 1.5]}
          face={win.face}
        />
      ))}
      
      {/* Doors */}
      {doorData.map((doorData, index) => (
        <Door 
          key={`door-${index}-${seed}`}
          position={doorData.position} 
          rotation={doorData.rotation} 
          size={doorData.size} 
          isMain={doorData.isMain} 
        />
      ))}
      
      {/* Rooftop Garden */}
      {rooftopElements}
    </group>
  );
}

export default Building; 