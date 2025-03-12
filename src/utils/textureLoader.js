import * as THREE from 'three';

// Optimized texture loading to avoid WebGL warnings
export const createOptimizedTexture = (color, roughness = 0.8, metalness = 0.2) => {
  // Create a small canvas to generate the texture programmatically
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  
  // Fill with base color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add some noise/variation to simulate concrete texture
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = Math.random() * 2 + 0.5;
    
    // Slightly vary the color for a more realistic look
    const colorVariation = Math.random() * 20 - 10;
    const r = parseInt(color.slice(1, 3), 16) + colorVariation;
    const g = parseInt(color.slice(3, 5), 16) + colorVariation;
    const b = parseInt(color.slice(5, 7), 16) + colorVariation;
    
    ctx.fillStyle = `rgb(${Math.min(255, Math.max(0, r))}, ${Math.min(255, Math.max(0, g))}, ${Math.min(255, Math.max(0, b))})`;
    ctx.fillRect(x, y, size, size);
  }
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  // Configure texture to minimize warnings
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  
  return {
    map: texture,
    roughness,
    metalness,
    roughnessMap: texture,
  };
}; 