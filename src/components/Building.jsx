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
  
  // Secondary, darker concrete material for accents and structural elements
  const accentConcreteMaterial = useMemo(() => {
    const darkerColor = new THREE.Color(concreteColor).multiplyScalar(0.7).getHex();
    const colorHex = '#' + darkerColor.toString(16).padStart(6, '0');
    return createOptimizedTexture(colorHex, textureRoughness + 0.1);
  }, [concreteColor, textureRoughness]);
  
  // Generate floor geometries optimized for performance, with more brutalist features
  const buildingElements = useMemo(() => {
    const random = seededRandom(seed || 12345);
    const elements = [];
    
    // Main building floors
    for (let i = 0; i < floors; i++) {
      const y = i * floorHeight;
      
      // Determine if this floor should have a smaller footprint (stepped setbacks)
      // More pronounced for brutalist style
      const shouldSetback = i > 0 && i % 2 === 0 && i < floors - 1;
      const floorWidth = shouldSetback ? width * (0.7 + random.random() * 0.15) : width;
      const floorDepth = shouldSetback ? depth * (0.7 + random.random() * 0.15) : depth;
      
      // Add main floor
      elements.push({
        type: 'floor',
        position: [0, y + floorHeight / 2, 0],
        size: [floorWidth, floorHeight, floorDepth]
      });
      
      // Add brutalist features - exposed structural elements, raw concrete protrusions
      if (i % 2 === 0) {
        // Add vertical concrete pillars at corners
        const pillarSize = 0.8;
        const pillarHeight = floorHeight * 1.5;
        const xOffset = floorWidth / 2 - pillarSize / 2;
        const zOffset = floorDepth / 2 - pillarSize / 2;
        
        // Four corner pillars that extend above the floor
        [
          [xOffset, zOffset],
          [-xOffset, zOffset],
          [xOffset, -zOffset],
          [-xOffset, -zOffset]
        ].forEach((pos, idx) => {
          if (random.random() > 0.3) { // Some randomness to pillars
            elements.push({
              type: 'pillar',
              position: [pos[0], y + pillarHeight / 2, pos[1]],
              size: [pillarSize, pillarHeight, pillarSize]
            });
          }
        });
      }
      
      // Add horizontal concrete beams for brutalist aesthetic
      if (i > 0 && i < floors - 1 && random.random() > 0.4) {
        const beamHeight = 0.6;
        const beamWidth = floorWidth * 1.2; // Extending beyond the building
        const beamDepth = 0.8;
        
        // Horizontal beams on facade
        elements.push({
          type: 'beam',
          position: [0, y, floorDepth / 2 + beamDepth / 2],
          size: [beamWidth, beamHeight, beamDepth]
        });
        
        // Horizontal beams on sides
        if (random.random() > 0.5) {
          elements.push({
            type: 'beam',
            position: [floorWidth / 2 + beamDepth / 2, y, 0],
            size: [beamDepth, beamHeight, floorDepth * 1.2]
          });
        }
      }
      
      // Brutalist feature: occasional large protruding concrete balconies/platforms
      if (i > 0 && random.random() > 0.7) {
        const balconyDepth = 2 + random.random() * 3;
        const balconyWidth = 4 + random.random() * (floorWidth * 0.7);
        const balconyHeight = 0.5;
        const balconySide = random.random() > 0.5 ? 1 : -1; // Front or back
        
        elements.push({
          type: 'balcony',
          position: [
            (random.random() - 0.5) * (floorWidth - balconyWidth) * 0.8,
            y, 
            balconySide * (floorDepth / 2 + balconyDepth / 2)
          ],
          size: [balconyWidth, balconyHeight, balconyDepth]
        });
      }
      
      // Brutalist feature: asymmetric geometric shapes - occasional rectangular protrusions
      if (random.random() > 0.8) {
        const protrusion = {
          width: 2 + random.random() * 3,
          height: 1 + random.random() * 2,
          depth: 1 + random.random() * 1.5,
        };
        
        // Position on a random face
        const face = Math.floor(random.random() * 4); // 0=front, 1=right, 2=back, 3=left
        let prPos = [0, y + floorHeight/2, 0];
        
        switch(face) {
          case 0: // front
            prPos = [
              (random.random() - 0.5) * floorWidth * 0.6, 
              y + random.random() * floorHeight, 
              floorDepth/2 + protrusion.depth/2
            ];
            break;
          case 1: // right
            prPos = [
              floorWidth/2 + protrusion.depth/2,
              y + random.random() * floorHeight,
              (random.random() - 0.5) * floorDepth * 0.6
            ];
            break;
          case 2: // back
            prPos = [
              (random.random() - 0.5) * floorWidth * 0.6,
              y + random.random() * floorHeight,
              -floorDepth/2 - protrusion.depth/2
            ];
            break;
          case 3: // left
            prPos = [
              -floorWidth/2 - protrusion.depth/2,
              y + random.random() * floorHeight,
              (random.random() - 0.5) * floorDepth * 0.6
            ];
            break;
        }
        
        // Add the geometric protrusion
        elements.push({
          type: 'protrusion',
          position: prPos,
          size: [
            face % 2 === 0 ? protrusion.width : protrusion.depth,
            protrusion.height,
            face % 2 === 0 ? protrusion.depth : protrusion.width
          ],
          rotation: [0, face * Math.PI/2, 0]
        });
      }
    }
    
    // Roof features - brutalist style often had distinctive rooflines
    const roofY = floors * floorHeight;
    
    // Central roof structure - brutalist mechanical housing or water tower
    const roofStructureWidth = width * 0.3;
    const roofStructureDepth = depth * 0.3;
    const roofStructureHeight = 3 + random.random() * 3;
    
    elements.push({
      type: 'roof_structure',
      position: [0, roofY + roofStructureHeight/2, 0],
      size: [roofStructureWidth, roofStructureHeight, roofStructureDepth]
    });
    
    // Brutalist roofline elements - water tanks or geometric forms
    if (random.random() > 0.4 && !rooftopGarden) {
      const tankRadius = 1 + random.random() * 2;
      const tankHeight = 3 + random.random() * 2;
      
      elements.push({
        type: 'water_tank',
        position: [
          width * 0.3 * (random.random() - 0.5),
          roofY + tankHeight/2,
          depth * 0.3 * (random.random() - 0.5)
        ],
        radius: tankRadius,
        height: tankHeight
      });
    }
    
    return elements;
  }, [floors, width, depth, seed, rooftopGarden]);
  
  // Generate window positions based on config and seed for variation
  // Brutalist style often featured repetitive grid patterns of windows
  const windowPositions = useMemo(() => {
    const positions = [];
    const random = seededRandom(seed || 12345); // Use seeded random
    
    for (let i = 0; i < floors; i++) {
      const y = i * floorHeight + floorHeight / 2;
      const floorWidth = width; // Base width for window placement
      const floorDepth = depth;
      
      // Organize windows in a more grid-like pattern for brutalist style
      // Front/Back faces (more regular grid for brutalist aesthetic) 
      const windowsPerFace = Math.max(3, Math.ceil(floorWidth / 2));
      const spacing = floorWidth / (windowsPerFace + 1);
      
      for (let w = 1; w <= windowsPerFace; w++) {
        const x = -floorWidth/2 + w * spacing;
        
        // Skip some windows based on density but maintain grid
        if (random.random() < windowDensity) {
          positions.push({ pos: [x, y, -floorDepth / 2], rot: [0, 0, 0], face: 'front', size: [1.0, 1.5] });
        }
        
        if (random.random() < windowDensity) {
          positions.push({ pos: [x, y, floorDepth / 2], rot: [0, Math.PI, 0], face: 'back', size: [1.0, 1.5] });
        }
      }
      
      // Left/Right faces 
      const windowsPerSide = Math.max(3, Math.ceil(floorDepth / 2));
      const sideSpacing = floorDepth / (windowsPerSide + 1);
      
      for (let w = 1; w <= windowsPerSide; w++) {
        const z = -floorDepth/2 + w * sideSpacing;
        
        if (random.random() < windowDensity) {
          positions.push({ pos: [-floorWidth / 2, y, z], rot: [0, -Math.PI / 2, 0], face: 'left', size: [1.0, 1.5] });
        }
        
        if (random.random() < windowDensity) {
          positions.push({ pos: [floorWidth / 2, y, z], rot: [0, Math.PI / 2, 0], face: 'right', size: [1.0, 1.5] });
        }
      }
      
      // Occasionally add a strip of smaller clerestory windows at the top of the floor
      // Characteristic of some brutalist designs
      if (random.random() > 0.6) {
        const stripY = y + floorHeight/2 - 0.6;
        const smallWindowSize = [0.8, 0.8];
        const stripFace = Math.floor(random.random() * 4); // 0=front, 1=right, 2=back, 3=left
        const windowCount = 5 + Math.floor(random.random() * 5);
        const stripWidth = stripFace % 2 === 0 ? floorWidth : floorDepth;
        const stripSpacing = stripWidth / (windowCount + 1);
        
        for (let w = 1; w <= windowCount; w++) {
          const offset = -stripWidth/2 + w * stripSpacing;
          
          switch(stripFace) {
            case 0: // front
              positions.push({ pos: [offset, stripY, -floorDepth/2], rot: [0, 0, 0], face: 'front', size: smallWindowSize });
              break;
            case 1: // right
              positions.push({ pos: [floorWidth/2, stripY, offset], rot: [0, Math.PI/2, 0], face: 'right', size: smallWindowSize });
              break;
            case 2: // back
              positions.push({ pos: [offset, stripY, floorDepth/2], rot: [0, Math.PI, 0], face: 'back', size: smallWindowSize });
              break;
            case 3: // left
              positions.push({ pos: [-floorWidth/2, stripY, offset], rot: [0, -Math.PI/2, 0], face: 'left', size: smallWindowSize });
              break;
          }
        }
      }
    }
    return positions;
  }, [floors, width, depth, windowDensity, seed]);
  
  // Generate door positions for the ground floor - make main entrance more prominent
  const doorData = useMemo(() => {
    const doors = [];
    const random = seededRandom(seed || 12345);
    
    // Main entrance - make it larger and more monumental for brutalist style
    doors.push({
      position: [0, floorHeight / 2, -depth / 2],
      rotation: [0, 0, 0],
      size: [3.5, 3.0], // Larger main entrance
      isMain: true
    });
    
    // Side or back entrances
    if (random.random() > 0.6) {
      const sideDoorX = width / 2 * (random.random() > 0.5 ? 1 : -1);
      const sideDoorZ = (random.random() - 0.5) * depth * 0.6;
      const rotation = sideDoorX > 0 ? Math.PI / 2 : -Math.PI / 2;
      
      doors.push({
        position: [sideDoorX, floorHeight / 2, sideDoorZ],
        rotation: [0, rotation, 0],
        size: [2, 2.5],
        isMain: false
      });
    }
    
    // Occasionally add a back entrance
    if (random.random() > 0.7) {
      doors.push({
        position: [random.range(-width * 0.3, width * 0.3), floorHeight / 2, depth / 2],
        rotation: [0, Math.PI, 0],
        size: [2, 2.5],
        isMain: false
      });
    }
    
    return doors;
  }, [width, depth, floorHeight, seed]);
  
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
      {/* Main building structure with brutalist elements */}
      {buildingElements.map((element, index) => {
        // Choose material based on element type
        const material = ['pillar', 'beam', 'roof_structure', 'water_tank'].includes(element.type) 
          ? accentConcreteMaterial 
          : concreteMaterial;
        
        if (element.type === 'water_tank') {
          // Cylindrical water tanks
          return (
            <mesh
              key={`element-${index}-${seed}`}
              position={element.position}
              castShadow
              receiveShadow
            >
              <cylinderGeometry args={[element.radius, element.radius, element.height, 16]} />
              <meshStandardMaterial {...material} />
            </mesh>
          );
        } else {
          // All other box-shaped elements
          return (
            <mesh
              key={`element-${index}-${seed}`}
              position={element.position}
              rotation={element.rotation || [0, 0, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={element.size} />
              <meshStandardMaterial {...material} />
            </mesh>
          );
        }
      })}
      
      {/* Windows with brutalist styling */}
      {windowPositions.map((win, index) => (
        <Window 
          key={`window-${index}-${seed}`}
          position={win.pos}
          rotation={win.rot}
          size={win.size || [1.5, 1.5]}
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