import React from 'react';
import * as THREE from 'three';

function Bench({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  const concreteColor = '#888888';
  
  return (
    <group position={position} rotation={rotation}>
      {/* Concrete base */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.3, 1]} />
        <meshStandardMaterial color={concreteColor} roughness={0.9} />
      </mesh>
      
      {/* Concrete supports */}
      <mesh position={[-1, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.3, 1]} />
        <meshStandardMaterial color={concreteColor} roughness={0.9} />
      </mesh>
      
      <mesh position={[1, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.3, 1]} />
        <meshStandardMaterial color={concreteColor} roughness={0.9} />
      </mesh>
      
      {/* Optional: Add a subtle concrete texture effect */}
      <mesh position={[0, 0.47, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.1, 0.04, 1.1]} />
        <meshStandardMaterial color="#777777" roughness={1} />
      </mesh>
    </group>
  );
}

export default Bench; 