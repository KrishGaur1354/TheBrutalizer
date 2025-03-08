import React from 'react';
import { useTexture } from '@react-three/drei';

function Window({ position, rotation, size = [1.5, 1.5] }) {
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
  
  return (
    <group position={position} rotation={rotation}>
      {/* Window frame */}
      <mesh position={[0, 0, 0.05]} receiveShadow>
        <boxGeometry args={[width, height, 0.1]} />
        <meshStandardMaterial {...windowMaterial.frame} />
      </mesh>
      
      {/* Window glass */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[width - 0.2, height - 0.2, 0.05]} />
        <meshStandardMaterial {...windowMaterial.glass} />
      </mesh>
      
      {/* Window dividers (horizontal) */}
      <mesh position={[0, 0, 0.06]} receiveShadow>
        <boxGeometry args={[width - 0.1, 0.1, 0.12]} />
        <meshStandardMaterial {...windowMaterial.frame} />
      </mesh>
      
      {/* Window dividers (vertical) */}
      <mesh position={[0, 0, 0.06]} receiveShadow>
        <boxGeometry args={[0.1, height - 0.1, 0.12]} />
        <meshStandardMaterial {...windowMaterial.frame} />
      </mesh>
    </group>
  );
}

export default Window; 