import React from 'react';
import { useTexture } from '@react-three/drei';

function Window({ position, rotation, size = [1.5, 1.5], face }) {
  // Default window properties
  const [width, height] = size;
  
  // Create a simple window material
  const windowMaterial = {
    glass: {
      color: '#1a1a1a',
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.5,
    },
    frame: {
      color: '#333333',
      metalness: 0.1,
      roughness: 0.8,
    },
  };
  
  // Determine correct window offset based on face
  // This ensures windows are properly embedded in the walls regardless of floor size
  let zOffset = 0;
  
  // Set appropriate Z-offset based on which face the window is on
  switch (face) {
    case 'front':
      zOffset = -0.001; // Very small offset to avoid z-fighting
      break;
    case 'back':
      zOffset = 0.001;
      break;
    case 'left':
      zOffset = -0.001;
      break;
    case 'right':
      zOffset = 0.001;
      break;
    default:
      zOffset = 0;
  }
  
  return (
    <group position={position} rotation={rotation}>
      {/* Window inset - embedded into the wall */}
      <mesh position={[0, 0, zOffset]} receiveShadow castShadow>
        <boxGeometry args={[width + 0.05, height + 0.05, 0.02]} />
        <meshStandardMaterial color="#222222" />
      </mesh>
      
      {/* Window frame */}
      <mesh position={[0, 0, zOffset * 2]} receiveShadow castShadow>
        <boxGeometry args={[width, height, 0.03]} />
        <meshStandardMaterial {...windowMaterial.frame} />
      </mesh>
      
      {/* Window glass */}
      <mesh position={[0, 0, zOffset * 3]} receiveShadow>
        <boxGeometry args={[width - 0.2, height - 0.2, 0.01]} />
        <meshStandardMaterial {...windowMaterial.glass} />
      </mesh>
      
      {/* Window dividers (horizontal) */}
      <mesh position={[0, 0, zOffset * 4]} receiveShadow castShadow>
        <boxGeometry args={[width - 0.1, 0.1, 0.04]} />
        <meshStandardMaterial {...windowMaterial.frame} />
      </mesh>
      
      {/* Window dividers (vertical) */}
      <mesh position={[0, 0, zOffset * 4]} receiveShadow castShadow>
        <boxGeometry args={[0.1, height - 0.1, 0.04]} />
        <meshStandardMaterial {...windowMaterial.frame} />
      </mesh>
    </group>
  );
}

export default Window; 