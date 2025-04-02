import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, useRapier, vec3, quat, CuboidCollider } from '@react-three/rapier';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import Car from './Car'; // Import the visual car model

const PlayerCar = forwardRef(({ cameraMode }, ref) => {
  const carRef = useRef();
  const { rapier, world } = useRapier();
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const { camera, scene } = useThree();

  // Expose methods to parent component through ref
  useImperativeHandle(ref, () => ({
    // Return any methods or values we want to expose
    getPosition: () => {
      if (carRef.current) {
        return vec3(carRef.current.translation());
      }
      return new THREE.Vector3(0, 0, 0);
    },
    getRotation: () => {
      if (carRef.current) {
        return quat(carRef.current.rotation());
      }
      return new THREE.Quaternion();
    },
    // Add any other methods needed to control the car from parent components
  }), [carRef.current]);
  
  const SPEED = 80;
  const ROTATION_SPEED = 0.7;
  const CAMERA_OFFSET_THIRD_PERSON = new THREE.Vector3(0, 5, -12); // Camera behind and above
  const CAMERA_OFFSET_FIRST_PERSON = new THREE.Vector3(0, 1.2, 0.5); // Inside the cabin
  
  // Vehicle physics parameters (simplified)
  const steering = useRef(0);
  const throttle = useRef(0);
  const braking = useRef(0);
  
  // Store current velocity and rotation
  const currentLinvel = useRef(new THREE.Vector3());
  const currentAngvel = useRef(new THREE.Vector3());
  const currentPosition = useRef(new THREE.Vector3(0, 2, 0)); // Initial spawn position
  const currentRotation = useRef(new THREE.Quaternion());

  // Handle keyboard input
  useEffect(() => {
    const unsubscribe = subscribeKeys(
      (state) => state, // Get the whole state map
      (keys) => {
        const { forward, backward, left, right, brake } = keys;
        
        // Throttle
        if (forward) throttle.current = 1;
        else if (backward) throttle.current = -0.5; // Slower reverse
        else throttle.current = 0;
        
        // Steering
        if (left) steering.current = 1;
        else if (right) steering.current = -1;
        else steering.current = 0;
        
        // Braking
        braking.current = brake ? 1 : 0;
      }
    );
    return unsubscribe;
  }, [subscribeKeys]);

  useFrame((state, delta) => {
    if (!carRef.current) return;

    const carBody = carRef.current; // Get the RigidBody API

    // Apply forces based on input (simplified)
    const impulse = new THREE.Vector3(0, 0, throttle.current * SPEED * delta);
    const rotationImpulse = new THREE.Vector3(0, steering.current * ROTATION_SPEED * delta * (throttle.current === 0 ? 0.5 : 1), 0); // Reduce steering if not moving

    // Apply braking (simplified drag)
    if (braking.current > 0) {
        const currentVel = carBody.linvel();
        const brakeForce = new THREE.Vector3(-currentVel.x, 0, -currentVel.z).multiplyScalar(0.3); // Apply damping
        carBody.applyImpulse(vec3(brakeForce), true);
    }

    // Get current rotation and apply impulse in the car's local forward direction
    const currentQuat = quat(carBody.rotation());
    impulse.applyQuaternion(currentQuat);

    carBody.applyImpulse(vec3(impulse), true);
    carBody.applyTorqueImpulse(vec3(rotationImpulse), true);
    
    // Clamp linear and angular velocity to prevent instability
    const linvel = carBody.linvel();
    const angvel = carBody.angvel();
    
    if (Math.abs(linvel.x) > 20) linvel.x = Math.sign(linvel.x) * 20;
    if (Math.abs(linvel.z) > 20) linvel.z = Math.sign(linvel.z) * 20;
    if (Math.abs(angvel.y) > 5) angvel.y = Math.sign(angvel.y) * 5;
    
    carBody.setLinvel(vec3(linvel), true);
    carBody.setAngvel(vec3(angvel), true);

    // Update stored position/rotation for camera follow
    currentPosition.current.copy(vec3(carBody.translation()));
    currentRotation.current.copy(quat(carBody.rotation()));

    // --- Camera Logic --- 
    if (cameraMode === 'player') {
        // Make this perspective camera the default for this frame
        if (camera instanceof THREE.PerspectiveCamera) {
            if (scene.userData.activeCamera !== camera) {
                scene.userData.activeCamera = camera; // Custom flag to track active camera
                camera.makeDefault(); 
            }
        }

        // Choose camera offset (e.g., based on a state or prop for 1st/3rd person)
        const cameraOffset = CAMERA_OFFSET_THIRD_PERSON; // Using third person for now
        
        // Calculate desired camera position: car position + offset rotated by car rotation
        const desiredPosition = currentPosition.current.clone().add(
            cameraOffset.clone().applyQuaternion(currentRotation.current)
        );
        
        // Smoothly interpolate camera position (Lerp)
        camera.position.lerp(desiredPosition, delta * 5); 
        
        // Make camera look at a point slightly in front of the car
        const lookAtTarget = currentPosition.current.clone().add(
            new THREE.Vector3(0, 1, 3).applyQuaternion(currentRotation.current) // Look slightly ahead
        );
        camera.lookAt(lookAtTarget);
        
    } else {
         // If switching back to orbit, ensure the main camera is marked inactive if needed
         if (scene.userData.activeCamera === camera) {
             scene.userData.activeCamera = null; 
         }
         // OrbitControls will handle the camera in 'orbit' mode
    }
  });

  return (
    <RigidBody
      ref={carRef}
      colliders="cuboid" // Auto-generate cuboid collider based on mesh
      position={currentPosition.current.toArray()} // Initial position
      linearDamping={0.5} // Add some damping for stability
      angularDamping={0.5}
      canSleep={false} // Keep the car physics active
      type="dynamic"
    >
      {/* Visual Car Model - positioned relative to the RigidBody */}
      {/* Use a specific car type/color for the player */}
      <Car 
        position={[0, -0.4, 0]} // Adjust vertical offset based on model and collider
        rotation={[0, Math.PI, 0]} // Rotate model to face forward initially
        carType={1} // e.g., use the sports car model
        color="#ff4444" // Make player car red
      />
       {/* Explicit Collider - Adjust size/position to match the Car model better */}
       <CuboidCollider args={[1.0, 0.5, 2.1]} position={[0, 0.1, 0]} />
    </RigidBody>
  );
});

export default PlayerCar;