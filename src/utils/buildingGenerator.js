/**
 * Utility functions for generating brutalist building geometries
 */

// Generate a random number between min and max
export const random = (min, max, seed = Math.random()) => {
  return min + (max - min) * ((Math.sin(seed * 10000) + 1) / 2);
};

// Generate a random integer between min and max (inclusive)
export const randomInt = (min, max, seed = Math.random()) => {
  return Math.floor(random(min, max + 1, seed));
};

// Generate a random boolean with given probability
export const randomBool = (probability = 0.5, seed = Math.random()) => {
  return random(0, 1, seed) < probability;
};

// Generate a random offset for brutalist elements
export const randomOffset = (maxOffset, seed = Math.random()) => {
  return random(-maxOffset, maxOffset, seed);
};

// Generate building parameters based on config
export const generateBuildingParams = (config) => {
  const { floors, width, depth, seed = Math.random() } = config;
  
  // Base building dimensions
  const floorHeight = 3;
  const totalHeight = floors * floorHeight;
  
  // Generate random offsets for brutalist asymmetry
  const hasSetbacks = randomBool(0.7, seed);
  const hasOverhangs = randomBool(0.6, seed + 0.1);
  const hasCoreShaft = randomBool(0.8, seed + 0.2);
  
  // Generate setbacks (where upper floors are smaller than lower floors)
  const setbacks = [];
  if (hasSetbacks) {
    const numSetbacks = randomInt(1, Math.min(3, Math.floor(floors / 2)), seed + 0.3);
    for (let i = 0; i < numSetbacks; i++) {
      const setbackFloor = randomInt(Math.floor(floors * 0.3), Math.floor(floors * 0.8), seed + 0.4 + i * 0.1);
      const setbackAmount = random(1, 3, seed + 0.5 + i * 0.1);
      setbacks.push({ floor: setbackFloor, amount: setbackAmount });
    }
    // Sort setbacks by floor
    setbacks.sort((a, b) => a.floor - b.floor);
  }
  
  // Generate overhangs (where upper floors extend beyond lower floors)
  const overhangs = [];
  if (hasOverhangs) {
    const numOverhangs = randomInt(1, 2, seed + 0.6);
    for (let i = 0; i < numOverhangs; i++) {
      const overhangFloor = randomInt(Math.floor(floors * 0.4), Math.floor(floors * 0.9), seed + 0.7 + i * 0.1);
      const overhangAmount = random(1, 2, seed + 0.8 + i * 0.1);
      const overhangSide = randomInt(0, 3, seed + 0.9 + i * 0.1); // 0: front, 1: right, 2: back, 3: left
      overhangs.push({ floor: overhangFloor, amount: overhangAmount, side: overhangSide });
    }
    // Sort overhangs by floor
    overhangs.sort((a, b) => a.floor - b.floor);
  }
  
  // Generate core shaft (central vertical element)
  const coreShaft = hasCoreShaft ? {
    width: random(width * 0.2, width * 0.4, seed + 1.0),
    depth: random(depth * 0.2, depth * 0.4, seed + 1.1),
    height: random(totalHeight * 1.1, totalHeight * 1.3, seed + 1.2),
    offsetX: random(-width * 0.1, width * 0.1, seed + 1.3),
    offsetZ: random(-depth * 0.1, depth * 0.1, seed + 1.4),
  } : null;
  
  return {
    width,
    depth,
    floors,
    floorHeight,
    totalHeight,
    setbacks,
    overhangs,
    coreShaft,
    seed,
  };
};

// Generate window positions based on config
export const generateWindowPositions = (config, buildingParams) => {
  const { windowDensity, seed = Math.random() } = config;
  const { width, depth, floors, floorHeight } = buildingParams;
  
  const windows = [];
  
  // Calculate number of potential windows per floor
  const frontBackWindowsPerFloor = Math.floor(width / 2);
  const leftRightWindowsPerFloor = Math.floor(depth / 2);
  
  // Generate windows for each floor
  for (let floor = 0; floor < floors; floor++) {
    const floorY = floor * floorHeight;
    
    // Front face windows
    for (let i = 0; i < frontBackWindowsPerFloor; i++) {
      if (randomBool(windowDensity, seed + floor * 0.01 + i * 0.001)) {
        const windowX = -width / 2 + 1 + i * 2;
        windows.push({
          position: [windowX, floorY + floorHeight / 2, depth / 2 + 0.1],
          rotation: [0, 0, 0],
          size: [1.5, 1.5],
          face: 'front',
          floor,
        });
      }
    }
    
    // Back face windows
    for (let i = 0; i < frontBackWindowsPerFloor; i++) {
      if (randomBool(windowDensity, seed + floor * 0.01 + (i + frontBackWindowsPerFloor) * 0.001)) {
        const windowX = -width / 2 + 1 + i * 2;
        windows.push({
          position: [windowX, floorY + floorHeight / 2, -depth / 2 - 0.1],
          rotation: [0, Math.PI, 0],
          size: [1.5, 1.5],
          face: 'back',
          floor,
        });
      }
    }
    
    // Left face windows
    for (let i = 0; i < leftRightWindowsPerFloor; i++) {
      if (randomBool(windowDensity, seed + floor * 0.01 + (i + frontBackWindowsPerFloor * 2) * 0.001)) {
        const windowZ = -depth / 2 + 1 + i * 2;
        windows.push({
          position: [-width / 2 - 0.1, floorY + floorHeight / 2, windowZ],
          rotation: [0, -Math.PI / 2, 0],
          size: [1.5, 1.5],
          face: 'left',
          floor,
        });
      }
    }
    
    // Right face windows
    for (let i = 0; i < leftRightWindowsPerFloor; i++) {
      if (randomBool(windowDensity, seed + floor * 0.01 + (i + frontBackWindowsPerFloor * 2 + leftRightWindowsPerFloor) * 0.001)) {
        const windowZ = -depth / 2 + 1 + i * 2;
        windows.push({
          position: [width / 2 + 0.1, floorY + floorHeight / 2, windowZ],
          rotation: [0, Math.PI / 2, 0],
          size: [1.5, 1.5],
          face: 'right',
          floor,
        });
      }
    }
  }
  
  return windows;
};

// Generate door positions
export const generateDoorPositions = (buildingParams) => {
  const { width, depth, seed = Math.random() } = buildingParams;
  
  const doors = [];
  
  // Add a main entrance door
  const mainDoorSide = randomInt(0, 3, seed);
  
  switch (mainDoorSide) {
    case 0: // Front
      doors.push({
        position: [random(-width / 4, width / 4, seed + 0.1), 0, depth / 2 + 0.1],
        rotation: [0, 0, 0],
        size: [2, 3],
        isMain: true,
      });
      break;
    case 1: // Right
      doors.push({
        position: [width / 2 + 0.1, 0, random(-depth / 4, depth / 4, seed + 0.1)],
        rotation: [0, Math.PI / 2, 0],
        size: [2, 3],
        isMain: true,
      });
      break;
    case 2: // Back
      doors.push({
        position: [random(-width / 4, width / 4, seed + 0.1), 0, -depth / 2 - 0.1],
        rotation: [0, Math.PI, 0],
        size: [2, 3],
        isMain: true,
      });
      break;
    case 3: // Left
      doors.push({
        position: [-width / 2 - 0.1, 0, random(-depth / 4, depth / 4, seed + 0.1)],
        rotation: [0, -Math.PI / 2, 0],
        size: [2, 3],
        isMain: true,
      });
      break;
  }
  
  // Add secondary doors (optional)
  if (randomBool(0.5, seed + 0.2)) {
    const secondaryDoorSide = (mainDoorSide + randomInt(1, 3, seed + 0.3)) % 4;
    
    switch (secondaryDoorSide) {
      case 0: // Front
        doors.push({
          position: [random(-width / 4, width / 4, seed + 0.4), 0, depth / 2 + 0.1],
          rotation: [0, 0, 0],
          size: [1.5, 2.5],
          isMain: false,
        });
        break;
      case 1: // Right
        doors.push({
          position: [width / 2 + 0.1, 0, random(-depth / 4, depth / 4, seed + 0.4)],
          rotation: [0, Math.PI / 2, 0],
          size: [1.5, 2.5],
          isMain: false,
        });
        break;
      case 2: // Back
        doors.push({
          position: [random(-width / 4, width / 4, seed + 0.4), 0, -depth / 2 - 0.1],
          rotation: [0, Math.PI, 0],
          size: [1.5, 2.5],
          isMain: false,
        });
        break;
      case 3: // Left
        doors.push({
          position: [-width / 2 - 0.1, 0, random(-depth / 4, depth / 4, seed + 0.4)],
          rotation: [0, -Math.PI / 2, 0],
          size: [1.5, 2.5],
          isMain: false,
        });
        break;
    }
  }
  
  return doors;
};

// Generate decorative elements
export const generateDecorativeElements = (buildingParams) => {
  const { width, depth, totalHeight, seed = Math.random() } = buildingParams;
  
  const elements = [];
  
  // Add brutalist decorative elements
  const numElements = randomInt(2, 5, seed);
  
  for (let i = 0; i < numElements; i++) {
    const elementType = randomInt(0, 3, seed + i * 0.1);
    
    switch (elementType) {
      case 0: // Horizontal concrete band
        elements.push({
          type: 'band',
          position: [0, random(totalHeight * 0.2, totalHeight * 0.8, seed + i * 0.2), 0],
          width: width + random(1, 3, seed + i * 0.3),
          depth: depth + random(1, 3, seed + i * 0.4),
          height: random(0.5, 1.5, seed + i * 0.5),
        });
        break;
      case 1: // Vertical concrete pillar
        elements.push({
          type: 'pillar',
          position: [
            random(-width / 2, width / 2, seed + i * 0.2),
            totalHeight / 2,
            random(-depth / 2, depth / 2, seed + i * 0.3),
          ],
          width: random(1, 2, seed + i * 0.4),
          depth: random(1, 2, seed + i * 0.5),
          height: random(totalHeight * 0.5, totalHeight * 1.2, seed + i * 0.6),
        });
        break;
      case 2: // Concrete slab
        elements.push({
          type: 'slab',
          position: [
            random(-width / 2, width / 2, seed + i * 0.2),
            random(totalHeight * 0.3, totalHeight * 0.9, seed + i * 0.3),
            random(-depth / 2, depth / 2, seed + i * 0.4),
          ],
          width: random(2, 5, seed + i * 0.5),
          depth: random(2, 5, seed + i * 0.6),
          height: random(0.5, 1, seed + i * 0.7),
          rotation: [0, random(0, Math.PI * 2, seed + i * 0.8), 0],
        });
        break;
      case 3: // Concrete box
        elements.push({
          type: 'box',
          position: [
            random(-width / 2, width / 2, seed + i * 0.2),
            random(1, totalHeight * 0.5, seed + i * 0.3),
            random(-depth / 2, depth / 2, seed + i * 0.4),
          ],
          width: random(2, 4, seed + i * 0.5),
          depth: random(2, 4, seed + i * 0.6),
          height: random(2, 4, seed + i * 0.7),
          rotation: [0, random(0, Math.PI * 2, seed + i * 0.8), 0],
        });
        break;
    }
  }
  
  return elements;
}; 