import React from 'react';
import * as THREE from 'three';
import { useTexture } from '@react-three/drei';

function Tree({ position = [0, 0, 0], scale = [1, 1, 1] }) {
  // Simple brutalist tree
  return (
    <group position={position} scale={scale}>
      {/* Tree trunk */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <meshStandardMaterial color="#5d4037" roughness={0.9} />
      </mesh>
      
      {/* Tree foliage - geometric shapes for brutalist style */}
      <mesh position={[0, 2.5, 0]} castShadow receiveShadow>
        <coneGeometry args={[1.5, 3, 6]} />
        <meshStandardMaterial color="#2e7d32" roughness={0.8} />
      </mesh>
      
      <mesh position={[0, 4, 0]} castShadow receiveShadow>
        <coneGeometry args={[1, 2, 6]} />
        <meshStandardMaterial color="#388e3c" roughness={0.8} />
      </mesh>
    </group>
  );
}

export default Tree; 