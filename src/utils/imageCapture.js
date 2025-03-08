import { toPng } from 'html-to-image';

/**
 * Captures a screenshot of the canvas element
 * @param {HTMLCanvasElement} canvas - The canvas element to capture
 * @param {string} buildingName - The name of the building to include in the image
 * @returns {Promise<string>} - A promise that resolves to the data URL of the captured image
 */
export const captureCanvasImage = async (canvas, buildingName) => {
  return new Promise((resolve, reject) => {
    try {
      // Create a container for the final image
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.top = '-9999px';
      container.style.left = '-9999px';
      container.style.width = '1200px';
      container.style.height = '800px';
      container.style.backgroundColor = '#f0f0f0';
      container.style.padding = '20px';
      container.style.fontFamily = "'Roboto Condensed', Helvetica, Arial, sans-serif";
      document.body.appendChild(container);
      
      // Create a title for the image
      const title = document.createElement('div');
      title.textContent = buildingName;
      title.style.fontSize = '32px';
      title.style.fontWeight = 'bold';
      title.style.textAlign = 'center';
      title.style.marginBottom = '20px';
      title.style.textTransform = 'uppercase';
      title.style.letterSpacing = '2px';
      container.appendChild(title);
      
      // Create a wrapper for the canvas
      const canvasWrapper = document.createElement('div');
      canvasWrapper.style.width = '100%';
      canvasWrapper.style.height = '700px';
      canvasWrapper.style.display = 'flex';
      canvasWrapper.style.justifyContent = 'center';
      canvasWrapper.style.alignItems = 'center';
      canvasWrapper.style.backgroundColor = '#e0e0e0';
      canvasWrapper.style.border = '4px solid #333';
      container.appendChild(canvasWrapper);
      
      // Clone the canvas and add it to the wrapper
      const canvasClone = document.createElement('img');
      canvasClone.src = canvas.toDataURL('image/png');
      canvasClone.style.maxWidth = '100%';
      canvasClone.style.maxHeight = '100%';
      canvasWrapper.appendChild(canvasClone);
      
      // Add a footer
      const footer = document.createElement('div');
      footer.textContent = 'Created with BRUTALIZER';
      footer.style.fontSize = '14px';
      footer.style.textAlign = 'center';
      footer.style.marginTop = '10px';
      footer.style.textTransform = 'uppercase';
      footer.style.letterSpacing = '1px';
      container.appendChild(footer);
      
      // Wait for the image to load
      canvasClone.onload = () => {
        // Capture the container as an image
        toPng(container)
          .then((dataUrl) => {
            // Clean up
            document.body.removeChild(container);
            resolve(dataUrl);
          })
          .catch((error) => {
            document.body.removeChild(container);
            reject(error);
          });
      };
      
      canvasClone.onerror = (error) => {
        document.body.removeChild(container);
        reject(error);
      };
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Captures a screenshot of the Three.js scene
 * @param {THREE.WebGLRenderer} renderer - The Three.js renderer
 * @param {THREE.Scene} scene - The Three.js scene
 * @param {THREE.Camera} camera - The Three.js camera
 * @param {string} buildingName - The name of the building to include in the image
 * @returns {Promise<string>} - A promise that resolves to the data URL of the captured image
 */
export const captureSceneImage = async (renderer, scene, camera, buildingName) => {
  // Render the scene to the canvas
  renderer.render(scene, camera);
  
  // Get the canvas element
  const canvas = renderer.domElement;
  
  // Capture the canvas as an image
  return captureCanvasImage(canvas, buildingName);
}; 