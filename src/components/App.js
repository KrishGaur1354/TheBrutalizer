import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ControlPanel from './ControlPanel';
import CaptureButton from './CaptureButton';

function App() {
  const [videoStream, setVideoStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [settings, setSettings] = useState({
    contrast: 100,
    brightness: 100,
    saturation: 100,
    grayscale: 0,
    sepia: 0,
    hueRotate: 0,
    blur: 0
  });
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  useEffect(() => {
    // Get user camera access
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        
        setVideoStream(stream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
      }
    }
    
    setupCamera();
    
    // Cleanup
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Make sure video is actually playing and ready
    if (video.readyState !== 4) {
      console.warn('Video not ready yet, waiting...');
      setTimeout(captureImage, 300); // Retry after 300ms
      return;
    }
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the video frame on the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get the data URL
    try {
      const imageDataURL = canvas.toDataURL('image/png');
      setCapturedImage(imageDataURL);
      console.log('Image captured successfully');
    } catch (err) {
      console.error('Error capturing image:', err);
    }
  };
  
  const filterStyle = {
    filter: `
      contrast(${settings.contrast}%)
      brightness(${settings.brightness}%)
      saturate(${settings.saturation}%)
      grayscale(${settings.grayscale}%)
      sepia(${settings.sepia}%)
      hue-rotate(${settings.hueRotate}deg)
      blur(${settings.blur}px)
    `
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>BRUTALIST CAMERA</h1>
      </header>
      
      <div className="app-content">
        <div className="video-container">
          <video 
            ref={videoRef}
            className="video-preview"
            style={filterStyle}
            autoPlay
            playsInline
            muted
          ></video>
          
          {capturedImage && (
            <div className="captured-image-container">
              <img 
                src={capturedImage} 
                alt="Captured" 
                className="captured-image"
                style={filterStyle}
              />
              <button 
                className="close-button"
                onClick={() => setCapturedImage(null)}
              >
                X
              </button>
            </div>
          )}
          
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        </div>
        
        <div className="controls-container">
          <ControlPanel settings={settings} setSettings={setSettings} />
          <CaptureButton onCapture={captureImage} />
        </div>
      </div>
      
      <footer className="app-footer">
        <p>© 2023 BRUTALIST CAMERA - NO RIGHTS RESERVED</p>
      </footer>
    </div>
  );
}

export default App; 