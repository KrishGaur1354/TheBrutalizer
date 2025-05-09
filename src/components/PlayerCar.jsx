import React, { useRef, useEffect, forwardRef, useImperativeHandle, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RigidBody, useRapier, vec3, quat, CuboidCollider } from '@react-three/rapier';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import Car from './Car'; // Import the visual car model

// Improved player car with better physics and handling
const PlayerCar = forwardRef(({ cameraMode }, ref) => {
  const carRef = useRef();
  const modelRef = useRef();
  const { rapier, world } = useRapier();
  const [subscribeKeys, getKeys] = useKeyboardControls();
  const { camera, scene } = useThree();
  const [initialized, setInitialized] = useState(false);
  
  // Cache vectors for better performance
  const currentPosition = useRef(new THREE.Vector3(0, 0.5, 0));
  const currentRotation = useRef(new THREE.Quaternion());
  const carDirection = useRef(new THREE.Vector3(0, 0, 1));
  const cameraTarget = useRef(new THREE.Vector3());
  const tempVec = useRef(new THREE.Vector3());

  // Expose methods to parent component through ref
  useImperativeHandle(ref, () => ({
    // Return any methods or values we want to expose
    getPosition: () => {
      if (carRef.current) {
        return vec3(carRef.current.translation());
      }
      return currentPosition.current;
    },
    getRotation: () => {
      if (carRef.current) {
        return quat(carRef.current.rotation());
      }
      return currentRotation.current;
    },
    resetPosition: () => {
      if (carRef.current) {
        carRef.current.setTranslation(vec3({ x: 0, y: 0.5, z: 0 }), true);
        carRef.current.setLinvel(vec3({ x: 0, y: 0, z: 0 }), true);
        carRef.current.setAngvel(vec3({ x: 0, y: 0, z: 0 }), true);
        carRef.current.setRotation(quat({ x: 0, y: 0, z: 0, w: 1 }), true);
      }
    }
  }), [carRef.current]);
  
  // Improved physics parameters for better car handling
  const CAR_CONFIG = {
    maxSpeed: 30,               // Maximum speed
    acceleration: 100,          // Force applied when accelerating
    deceleration: 25,           // Natural deceleration when not accelerating
    steering: 1.5,              // Steering force
    maxSteeringAngle: 0.5,      // Maximum steering angle
    grip: 0.7,                  // How much the car grips the ground (0-1)
    weight: 1000,               // Car weight
    driftFactor: 0.95,          // Higher = less drift
    brakingForce: 0.8,          // Force applied when braking (0-1)
    steeringSpeed: 2.5,         // How fast the steering responds
    steeringReturnSpeed: 5.0,   // How fast steering returns to center
    groundCheckHeight: 0.5,     // Height to check for ground below car
  };
  
  // Vehicle physics state
  const carState = useRef({
    steering: 0,                // Current steering angle
    throttle: 0,                // Current throttle (-1 to 1)
    braking: 0,                 // Current braking force
    grounded: true,             // Whether the car is on the ground
    speed: 0,                   // Current speed
    wheelAngle: 0,              // Visual wheel rotation angle
    engineSound: null,          // Engine sound reference
  });
  
  // Handle keyboard input with improved controls
  useEffect(() => {
    const unsubscribe = subscribeKeys(
      (state) => state, // Get the whole state map
      (keys) => {
        const { forward, backward, left, right, brake, shift } = keys;
        
        // Progressive throttle for smoother acceleration
        if (forward) {
          carState.current.throttle = Math.min(carState.current.throttle + 0.05, 1);
        } else if (backward) {
          carState.current.throttle = Math.max(carState.current.throttle - 0.05, -0.5); // Slower reverse
        } else {
          // Gradually return to zero
          if (carState.current.throttle > 0.05) {
            carState.current.throttle -= 0.05;
          } else if (carState.current.throttle < -0.05) {
            carState.current.throttle += 0.05;
          } else {
            carState.current.throttle = 0;
          }
        }
        
        // Progressive steering
        const steeringTarget = left ? CAR_CONFIG.maxSteeringAngle : 
                              right ? -CAR_CONFIG.maxSteeringAngle : 0;
                              
        // Boost mode
        const boostFactor = shift ? 1.5 : 1.0;
        if (forward && shift) {
          carState.current.throttle = Math.min(carState.current.throttle * boostFactor, 1.5);
        }
        
        // Apply steering with damping
        carState.current.steering = THREE.MathUtils.lerp(
          carState.current.steering, 
          steeringTarget, 
          carState.current.throttle === 0 ? 0.02 : 0.1
        );
        
        // Braking
        carState.current.braking = brake ? CAR_CONFIG.brakingForce : 0;
      }
    );
    
    // Initialize the car after a short delay to ensure physics world is ready
    setTimeout(() => {
      setInitialized(true);
    }, 500);
    
    return unsubscribe;
  }, [subscribeKeys, CAR_CONFIG.maxSteeringAngle]);
  
  // Main physics update
  useFrame((state, delta) => {
    if (!carRef.current || !initialized) return;
    
    const carBody = carRef.current;
    
    // Get current velocities and position
    const linvel = carBody.linvel();
    const angvel = carBody.angvel();
    const position = carBody.translation();
    const rotation = carBody.rotation();
    
    // Store current position and rotation
    currentPosition.current.set(position.x, position.y, position.z);
    currentRotation.current.set(rotation.x, rotation.y, rotation.z, rotation.w);
    
    // Calculate car direction vector (forward vector)
    carDirection.current.set(0, 0, 1).applyQuaternion(currentRotation.current);
    
    // Simple ground check - assume grounded if y position is close to 0
    // This is a simplification that avoids using world.castRay
    carState.current.grounded = position.y < 1.0;
    
    // Only apply driving forces if the car is on the ground
    if (carState.current.grounded) {
      // Calculate current speed (magnitude of velocity)
      carState.current.speed = Math.sqrt(linvel.x * linvel.x + linvel.z * linvel.z);
      
      // Prepare force vector
      let forceDirection = new THREE.Vector3(0, 0, carState.current.throttle * CAR_CONFIG.acceleration);
      
      // Apply force in car's forward direction
      forceDirection.applyQuaternion(currentRotation.current);
      
      // Apply driving force
      if (Math.abs(carState.current.throttle) > 0.01) {
        // Scale force by delta time
        const force = vec3({
          x: forceDirection.x * delta,
          y: 0,
          z: forceDirection.z * delta
        });
        carBody.applyImpulse(force, true);
      }
      
      // Apply steering as a torque
      if (Math.abs(carState.current.steering) > 0.01 && Math.abs(carState.current.speed) > 0.5) {
        const steeringForce = carState.current.steering * CAR_CONFIG.steering;
        const steerImpulse = vec3({
          x: 0, 
          y: steeringForce * (carState.current.throttle >= 0 ? 1 : -1) * delta, 
          z: 0
        });
        carBody.applyTorqueImpulse(steerImpulse, true);
      }
      
      // Apply braking - stronger at higher speeds
      if (carState.current.braking > 0) {
        const brakingForce = -carState.current.speed * carState.current.braking;
        // Create braking force in the opposite direction of movement
        const brakingDirection = new THREE.Vector3(linvel.x, 0, linvel.z).normalize().multiplyScalar(brakingForce);
        carBody.applyImpulse(vec3(brakingDirection), true);
      }
      
      // Apply natural deceleration when not accelerating
      if (Math.abs(carState.current.throttle) < 0.1) {
        const decelerationForce = -carState.current.speed * CAR_CONFIG.deceleration * delta;
        // Create deceleration force in the opposite direction of movement
        const decelDirection = new THREE.Vector3(linvel.x, 0, linvel.z).normalize().multiplyScalar(decelerationForce);
        carBody.applyImpulse(vec3(decelDirection), true);
      }
      
      // Apply grip - helps with car stability
      const lateralVelocity = getLateralVelocity(currentRotation.current, linvel);
      const lateralCorrectionImpulse = lateralVelocity.multiplyScalar(-CAR_CONFIG.grip * CAR_CONFIG.weight * delta);
      carBody.applyImpulse(vec3(lateralCorrectionImpulse), true);
      
      // Prevent car from tipping over
      carBody.setAngvel(vec3({ x: 0, y: angvel.y, z: 0 }), true);
      
      // Speed limiter
      if (carState.current.speed > CAR_CONFIG.maxSpeed) {
        const newVel = new THREE.Vector3(linvel.x, linvel.y, linvel.z).normalize().multiplyScalar(CAR_CONFIG.maxSpeed);
        carBody.setLinvel(vec3({ x: newVel.x, y: linvel.y, z: newVel.z }), true);
      }
      
      // Rotate wheels for visual effect - update wheel rotation based on speed
      if (modelRef.current) {
        carState.current.wheelAngle += carState.current.speed * 0.1;
      }
    }
    
    // --- Camera Logic --- 
    if (cameraMode === 'player') {
      // Make this perspective camera the default for this frame
      if (camera instanceof THREE.PerspectiveCamera) {
        if (scene.userData.activeCamera !== camera) {
          scene.userData.activeCamera = camera; // Custom flag to track active camera
          camera.makeDefault(); 
        }
      }
      
      // Choose camera type (third-person view)
      const cameraHeightOffset = 3; // Height above car
      const cameraDistanceOffset = 8; // Distance behind car
      
      // Calculate camera target position (ahead of the car)
      cameraTarget.current.copy(currentPosition.current).add(
        tempVec.current.copy(carDirection.current).multiplyScalar(5)
      );
      cameraTarget.current.y += 0.5; // Look slightly upward
      
      // Calculate desired camera position
      const desiredPosition = new THREE.Vector3();
      desiredPosition.copy(currentPosition.current);
      desiredPosition.y += cameraHeightOffset;
      
      // Position camera behind the car based on car's direction
      desiredPosition.sub(
        tempVec.current.copy(carDirection.current).multiplyScalar(cameraDistanceOffset)
      );
      
      // Smoothly interpolate camera position (faster transitions for more responsive feel)
      camera.position.lerp(desiredPosition, delta * 5);
      
      // Look at target position
      camera.lookAt(cameraTarget.current);
    } else {
      // If switching back to orbit, ensure the main camera is marked inactive if needed
      if (scene.userData.activeCamera === camera) {
        scene.userData.activeCamera = null; 
      }
      // OrbitControls will handle the camera in 'orbit' mode
    }
  });
  
  // Helper function to get lateral velocity (perpendicular to car direction)
  function getLateralVelocity(rotation, linvel) {
    // Get the car's right vector
    const rightVector = new THREE.Vector3(1, 0, 0).applyQuaternion(rotation);
    
    // Project the velocity onto the right vector to get lateral component
    const dot = rightVector.x * linvel.x + rightVector.z * linvel.z;
    return new THREE.Vector3(
      rightVector.x * dot,
      0,
      rightVector.z * dot
    );
  }

  return (
    <RigidBody
      ref={carRef}
      position={[0, 0.5, 0]} // Start slightly above ground to avoid collision issues
      colliders={false} // We'll add our own collider
      linearDamping={0.1} // Lower damping for more responsive movement
      angularDamping={0.8} // Higher for more stability
      canSleep={false} // Keep the car physics active
      type="dynamic"
      mass={CAR_CONFIG.weight} // Use weight from config
      restitution={0.2} // Slight bounce on collision
      friction={1} // Good friction with ground
    >
      {/* Visual Car Model - positioned relative to the RigidBody */}
      <group ref={modelRef}>
        <Car 
          position={[0, 0, 0]} 
          rotation={[0, Math.PI, 0]} // Rotate model to face forward initially
          carType={1} // Use the sports car model
          color="#ff4444" // Make player car red
        />
      </group>
      
      {/* Better-shaped collider that matches the car model */}
      <CuboidCollider 
        args={[1.0, 0.4, 2.0]} // Width, height, depth
        position={[0, 0.4, 0]} // Positioned to match the car model
      />
    </RigidBody>
  );
});

export default PlayerCar;