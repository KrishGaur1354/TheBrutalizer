import React, { useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import Window from './Window';
import Door from './Door';
import { 
  generateBuildingParams, 
  generateWindowPositions, 
  generateDoorPositions,
  generateDecorativeElements
} from '../utils/buildingGenerator';

function Building({ config }) {
  // Generate building parameters based on config
  const buildingParams = useMemo(() => {
    return generateBuildingParams(config);
  }, [config.floors, config.width, config.depth, config.seed]);
  
  // Generate window positions
  const windows = useMemo(() => {
    return generateWindowPositions(config, buildingParams);
  }, [config.windowDensity, buildingParams, config.seed]);
  
  // Generate door positions
  const doors = useMemo(() => {
    return generateDoorPositions(buildingParams);
  }, [buildingParams]);
  
  // Generate decorative elements
  const decorativeElements = useMemo(() => {
    return generateDecorativeElements(buildingParams);
  }, [buildingParams]);
  
  // Create concrete material with adjustable roughness
  const concreteMaterial = useMemo(() => {
    // Create a procedural concrete texture
    const textureSize = 1024;
    const canvas = document.createElement('canvas');
    canvas.width = textureSize;
    canvas.height = textureSize;
    const ctx = canvas.getContext('2d');
    
    // Fill with base color
    ctx.fillStyle = config.concreteColor;
    ctx.fillRect(0, 0, textureSize, textureSize);
    
    // Add noise for concrete texture
    const roughness = config.textureRoughness;
    const noiseIntensity = roughness * 30;
    
    for (let x = 0; x < textureSize; x += 4) {
      for (let y = 0; y < textureSize; y += 4) {
        const noise = (Math.random() - 0.5) * noiseIntensity;
        const color = parseInt(config.concreteColor.slice(1), 16);
        
        const r = ((color >> 16) & 255) + noise;
        const g = ((color >> 8) & 255) + noise;
        const b = (color & 255) + noise;
        
        ctx.fillStyle = `rgb(${Math.max(0, Math.min(255, r))}, ${Math.max(0, Math.min(255, g))}, ${Math.max(0, Math.min(255, b))})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    
    // Create normal map from canvas
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = textureSize;
    normalCanvas.height = textureSize;
    const normalCtx = normalCanvas.getContext('2d');
    
    // Create normal map
    const imageData = ctx.getImageData(0, 0, textureSize, textureSize);
    const normalData = normalCtx.createImageData(textureSize, textureSize);
    
    for (let x = 1; x < textureSize - 1; x++) {
      for (let y = 1; y < textureSize - 1; y++) {
        const idx = (y * textureSize + x) * 4;
        const leftIdx = (y * textureSize + (x - 1)) * 4;
        const rightIdx = (y * textureSize + (x + 1)) * 4;
        const upIdx = ((y - 1) * textureSize + x) * 4;
        const downIdx = ((y + 1) * textureSize + x) * 4;
        
        // Calculate normal based on surrounding pixels
        const left = imageData.data[leftIdx];
        const right = imageData.data[rightIdx];
        const up = imageData.data[upIdx];
        const down = imageData.data[downIdx];
        
        // Simple normal calculation
        normalData.data[idx] = 128 + (right - left) * roughness * 2;
        normalData.data[idx + 1] = 128 + (down - up) * roughness * 2;
        normalData.data[idx + 2] = 255;
        normalData.data[idx + 3] = 255;
      }
    }
    
    normalCtx.putImageData(normalData, 0, 0);
    const normalTexture = new THREE.CanvasTexture(normalCanvas);
    normalTexture.wrapS = THREE.RepeatWrapping;
    normalTexture.wrapT = THREE.RepeatWrapping;
    normalTexture.repeat.set(4, 4);
    
    return {
      map: texture,
      normalMap: normalTexture,
      roughness: 0.7 + roughness * 0.3,
      metalness: 0.1,
      bumpScale: roughness * 0.05,
    };
  }, [config.concreteColor, config.textureRoughness]);
  
  // Extract building dimensions
  const { width, depth, floors, floorHeight, totalHeight, setbacks, overhangs, coreShaft } = buildingParams;
  
  // Create floor geometries based on setbacks and overhangs
  const floorGeometries = useMemo(() => {
    const geometries = [];
    
    // Calculate dimensions for each floor
    for (let floor = 0; floor < floors; floor++) {
      let floorWidth = width;
      let floorDepth = depth;
      let offsetX = 0;
      let offsetZ = 0;
      
      // Apply setbacks
      for (const setback of setbacks) {
        if (floor >= setback.floor) {
          floorWidth -= setback.amount;
          floorDepth -= setback.amount;
        }
      }
      
      // Apply overhangs
      for (const overhang of overhangs) {
        if (floor >= overhang.floor) {
          switch (overhang.side) {
            case 0: // Front
              floorDepth += overhang.amount;
              offsetZ += overhang.amount / 2;
              break;
            case 1: // Right
              floorWidth += overhang.amount;
              offsetX += overhang.amount / 2;
              break;
            case 2: // Back
              floorDepth += overhang.amount;
              offsetZ -= overhang.amount / 2;
              break;
            case 3: // Left
              floorWidth += overhang.amount;
              offsetX -= overhang.amount / 2;
              break;
          }
        }
      }
      
      geometries.push({
        floor,
        width: floorWidth,
        depth: floorDepth,
        height: floorHeight,
        position: [offsetX, floor * floorHeight + floorHeight / 2, offsetZ],
      });
    }
    
    return geometries;
  }, [width, depth, floors, floorHeight, setbacks, overhangs]);
  
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
          <boxGeometry 
            args={[floorGeometry.width, floorGeometry.height, floorGeometry.depth]} 
          />
          <meshStandardMaterial {...concreteMaterial} />
        </mesh>
      ))}
      
      {/* Core shaft (if present) */}
      {coreShaft && (
        <mesh 
          position={[coreShaft.offsetX, coreShaft.height / 2, coreShaft.offsetZ]} 
          castShadow 
          receiveShadow
        >
          <boxGeometry 
            args={[coreShaft.width, coreShaft.height, coreShaft.depth]} 
          />
          <meshStandardMaterial {...concreteMaterial} />
        </mesh>
      )}
      
      {/* Windows */}
      {windows.map((windowData, index) => (
        <Window 
          key={`window-${index}`} 
          position={windowData.position} 
          rotation={windowData.rotation} 
          size={windowData.size} 
        />
      ))}
      
      {/* Doors */}
      {doors.map((doorData, index) => (
        <Door 
          key={`door-${index}`} 
          position={doorData.position} 
          rotation={doorData.rotation} 
          size={doorData.size} 
          isMain={doorData.isMain} 
        />
      ))}
      
      {/* Decorative elements */}
      {decorativeElements.map((element, index) => {
        switch (element.type) {
          case 'band':
            return (
              <mesh 
                key={`element-${index}`} 
                position={element.position} 
                castShadow 
                receiveShadow
              >
                <boxGeometry 
                  args={[element.width, element.height, element.depth]} 
                />
                <meshStandardMaterial {...concreteMaterial} />
              </mesh>
            );
          case 'pillar':
            return (
              <mesh 
                key={`element-${index}`} 
                position={element.position} 
                castShadow 
                receiveShadow
              >
                <boxGeometry 
                  args={[element.width, element.height, element.depth]} 
                />
                <meshStandardMaterial {...concreteMaterial} />
              </mesh>
            );
          case 'slab':
            return (
              <mesh 
                key={`element-${index}`} 
                position={element.position} 
                rotation={element.rotation} 
                castShadow 
                receiveShadow
              >
                <boxGeometry 
                  args={[element.width, element.height, element.depth]} 
                />
                <meshStandardMaterial {...concreteMaterial} />
              </mesh>
            );
          case 'box':
            return (
              <mesh 
                key={`element-${index}`} 
                position={element.position} 
                rotation={element.rotation} 
                castShadow 
                receiveShadow
              >
                <boxGeometry 
                  args={[element.width, element.height, element.depth]} 
                />
                <meshStandardMaterial {...concreteMaterial} />
              </mesh>
            );
          default:
            return null;
        }
      })}
      
      {/* Ground plane */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, 0]} 
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#555555" />
      </mesh>
    </group>
  );
}

export default Building; 