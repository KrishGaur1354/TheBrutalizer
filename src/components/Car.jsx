import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Classic car component with three different vintage car models
function Car({ position = [0, 0, 0], rotation = [0, 0, 0], color = '#a31621', carType = 0, progress, roadIndex }) {
  const meshRef = useRef();
  
  // Create car geometry based on car type
  const carGeometry = useMemo(() => {
    switch(carType) {
      case 0: // Classic sedan
        return {
          body: { width: 2.2, height: 0.7, depth: 4.5 },
          roof: { width: 1.6, height: 0.6, depth: 2.2 },
          wheels: { radius: 0.4, width: 0.3 }
        };
      case 1: // Vintage sports car
        return {
          body: { width: 2.0, height: 0.5, depth: 4.2 },
          roof: { width: 1.2, height: 0.4, depth: 1.6 },
          wheels: { radius: 0.42, width: 0.3 }
        };
      case 2: // Classic truck
        return {
          body: { width: 2.3, height: 0.9, depth: 4.8 },
          roof: { width: 1.8, height: 0.5, depth: 1.4 },
          wheels: { radius: 0.45, width: 0.38 }
        };
      default:
        return {
          body: { width: 2.2, height: 0.7, depth: 4.5 },
          roof: { width: 1.6, height: 0.6, depth: 2.2 },
          wheels: { radius: 0.4, width: 0.3 }
        };
    }
  }, [carType]);
  
  // Calculate wheel positions
  const wheelPositions = useMemo(() => {
    const { body, wheels } = carGeometry;
    const wheelPositionY = wheels.radius * 0.2; // Slightly embedded in the ground
    const frontOffset = body.depth * 0.35;
    const backOffset = body.depth * 0.35;
    
    return [
      // Front left
      [-body.width/2 - wheels.width/2, wheelPositionY, frontOffset],
      // Front right
      [body.width/2 + wheels.width/2, wheelPositionY, frontOffset],
      // Back left
      [-body.width/2 - wheels.width/2, wheelPositionY, -backOffset],
      // Back right
      [body.width/2 + wheels.width/2, wheelPositionY, -backOffset]
    ];
  }, [carGeometry]);
  
  // Update car position based on progress and roadIndex
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    
    // Use the progress value for animation
    // This will be managed by the parent component (ClassicCars)
  });
  
  // Calculate materials
  const materials = useMemo(() => {
    // Car body color (main color parameter)
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.3,
      metalness: 0.4
    });
    
    // Car details (darker shade of main color)
    const detailsMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color).multiplyScalar(0.7).getHex(),
      roughness: 0.4,
      metalness: 0.3
    });
    
    // Windows
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: '#1a1a1a',
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.8
    });
    
    // Wheels
    const wheelMaterial = new THREE.MeshStandardMaterial({
      color: '#111111',
      roughness: 0.9,
      metalness: 0.1
    });
    
    // Chrome/metal parts
    const chromeMaterial = new THREE.MeshStandardMaterial({
      color: '#cccccc',
      roughness: 0.1,
      metalness: 0.9
    });
    
    return { bodyMaterial, detailsMaterial, windowMaterial, wheelMaterial, chromeMaterial };
  }, [color]);
  
  return (
    <group 
      ref={meshRef}
      position={position} 
      rotation={rotation}
    >
      {/* Car body */}
      <mesh castShadow receiveShadow position={[0, carGeometry.body.height/2 + 0.1, 0]}>
        <boxGeometry args={[carGeometry.body.width, carGeometry.body.height, carGeometry.body.depth]} />
        <primitive object={materials.bodyMaterial} />
      </mesh>
      
      {/* Car roof */}
      <mesh castShadow receiveShadow position={[0, carGeometry.body.height + carGeometry.roof.height/2 + 0.1, carType === 2 ? -0.8 : 0]}>
        <boxGeometry args={[carGeometry.roof.width, carGeometry.roof.height, carGeometry.roof.depth]} />
        <primitive object={materials.bodyMaterial} />
      </mesh>
      
      {/* Windows */}
      <mesh castShadow position={[0, carGeometry.body.height + carGeometry.roof.height/2 + 0.1, carType === 2 ? -0.7 : 0.1]}>
        <boxGeometry args={[carGeometry.roof.width + 0.05, carGeometry.roof.height - 0.2, carGeometry.roof.depth + 0.05]} />
        <primitive object={materials.windowMaterial} />
      </mesh>
      
      {/* Wheels */}
      {wheelPositions.map((pos, index) => (
        <group key={index} position={pos}>
          <mesh castShadow receiveShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[carGeometry.wheels.radius, carGeometry.wheels.radius, carGeometry.wheels.width, 16]} />
            <primitive object={materials.wheelMaterial} />
          </mesh>
          
          {/* Wheel hub cap */}
          <mesh castShadow position={[carGeometry.wheels.width/2 * (index % 2 === 0 ? -1 : 1), 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[carGeometry.wheels.radius * 0.4, carGeometry.wheels.radius * 0.4, 0.1, 8]} />
            <primitive object={materials.chromeMaterial} />
          </mesh>
        </group>
      ))}
      
      {/* Headlights */}
      <mesh castShadow position={[carGeometry.body.width * 0.35, carGeometry.body.height * 0.5 + 0.1, carGeometry.body.depth/2]}>
        <sphereGeometry args={[0.2, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={materials.chromeMaterial} />
      </mesh>
      
      <mesh castShadow position={[-carGeometry.body.width * 0.35, carGeometry.body.height * 0.5 + 0.1, carGeometry.body.depth/2]}>
        <sphereGeometry args={[0.2, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <primitive object={materials.chromeMaterial} />
      </mesh>
      
      {/* Grille (front) */}
      <mesh castShadow position={[0, carGeometry.body.height * 0.3 + 0.1, carGeometry.body.depth/2 - 0.05]}>
        <boxGeometry args={[carGeometry.body.width * 0.6, carGeometry.body.height * 0.3, 0.1]} />
        <primitive object={materials.detailsMaterial} />
      </mesh>
      
      {/* Some additional details based on car type */}
      {carType === 0 && (
        <>
          {/* Sedan rear spoiler */}
          <mesh castShadow position={[0, carGeometry.body.height + 0.1, -carGeometry.body.depth/2 + 0.2]}>
            <boxGeometry args={[carGeometry.body.width * 0.6, 0.1, 0.3]} />
            <primitive object={materials.detailsMaterial} />
          </mesh>
        </>
      )}
      
      {carType === 1 && (
        <>
          {/* Sports car spoiler */}
          <mesh castShadow position={[0, carGeometry.body.height + 0.3, -carGeometry.body.depth/2 + 0.2]}>
            <boxGeometry args={[carGeometry.body.width * 0.7, 0.1, 0.4]} />
            <primitive object={materials.detailsMaterial} />
          </mesh>
        </>
      )}
      
      {carType === 2 && (
        <>
          {/* Truck bed */}
          <mesh castShadow position={[0, carGeometry.body.height * 0.5 + 0.1, -carGeometry.body.depth/2 + 1]}>
            <boxGeometry args={[carGeometry.body.width, carGeometry.body.height, 2]} />
            <primitive object={materials.detailsMaterial} />
          </mesh>
        </>
      )}
    </group>
  );
}

export default Car; 