import React from 'react';

function Door({ position, rotation, size = [2, 3], isMain = true }) {
  // Default door properties
  const [width, height] = size;
  
  // Create door materials
  const doorMaterial = {
    frame: {
      color: '#333333',
      metalness: 0.1,
      roughness: 0.8,
    },
    door: {
      color: isMain ? '#555555' : '#444444',
      metalness: 0.3,
      roughness: 0.7,
    },
    handle: {
      color: '#888888',
      metalness: 0.8,
      roughness: 0.2,
    },
  };
  
  return (
    <group position={position} rotation={rotation}>
      {/* Door frame */}
      <mesh position={[0, 0, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[width + 0.3, height + 0.3, 0.2]} />
        <meshStandardMaterial {...doorMaterial.frame} />
      </mesh>
      
      {/* Door */}
      <mesh position={[0, 0, 0.15]} castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.1]} />
        <meshStandardMaterial {...doorMaterial.door} />
      </mesh>
      
      {/* Door handle */}
      <mesh position={[width / 3, 0, 0.25]} castShadow receiveShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.8, 8]} />
        <meshStandardMaterial {...doorMaterial.handle} />
      </mesh>
      
      {/* Main entrance features (if it's a main door) */}
      {isMain && (
        <>
          {/* Steps */}
          <mesh position={[0, -height / 2 - 0.2, -0.5]} receiveShadow>
            <boxGeometry args={[width + 1, 0.2, 1]} />
            <meshStandardMaterial color="#555555" />
          </mesh>
          
          <mesh position={[0, -height / 2 - 0.4, -0.8]} receiveShadow>
            <boxGeometry args={[width + 1.5, 0.2, 1.6]} />
            <meshStandardMaterial color="#555555" />
          </mesh>
          
          {/* Overhead concrete slab */}
          <mesh position={[0, height / 2 + 0.3, -0.5]} castShadow receiveShadow>
            <boxGeometry args={[width + 1, 0.3, 1.5]} />
            <meshStandardMaterial color="#555555" />
          </mesh>
        </>
      )}
    </group>
  );
}

export default Door; 