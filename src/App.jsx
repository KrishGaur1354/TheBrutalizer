import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import BrutalistScene from './scenes/BrutalistScene';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import Footer from './components/Footer';
import AboutModal from './components/AboutModal';
import ShareModal from './components/ShareModal';

// Improved app container with better performance handling
const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  background-color: #d8d8d8;
  font-family: 'Courier New', monospace;
  position: relative;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  position: relative;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

// Error message display
const ErrorMessage = styled.div`
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(220, 0, 0, 0.8);
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  z-index: 2000;
  font-weight: bold;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  max-width: 80%;
  text-align: center;
`;

// Performance warning message
const PerformanceWarning = styled.div`
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  z-index: 100;
  opacity: ${props => props.show ? 1 : 0};
  transition: opacity 0.3s ease;
  pointer-events: none;
`;

// Reset car position button
const ResetCarButton = styled.button`
  position: absolute;
  left: 10px;
  bottom: 10px;
  background-color: #333333;
  color: #ffffff;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  z-index: 100;
  font-family: 'Courier New', monospace;
  text-transform: uppercase;
  font-weight: bold;
  box-shadow: 3px 3px 0 rgba(0, 0, 0, 0.2);
  
  &:hover {
    background-color: #555555;
  }
  
  &:active {
    transform: translate(2px, 2px);
    box-shadow: 1px 1px 0 rgba(0, 0, 0, 0.2);
  }
`;

function App() {
  const [buildingConfig, setBuildingConfig] = useState({
    floors: 5,
    width: 10,
    depth: 10,
    windowDensity: 0.5,
    textureRoughness: 0.8,
    concreteColor: '#cccccc',
    buildingName: 'BRUTALIST TOWER',
    cloudDensity: 0.5, 
    rooftopGarden: false,
    groundPark: false,
    seed: Math.random(),
  });
  
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [lowFps, setLowFps] = useState(false);
  const [error, setError] = useState(null);
  
  // Ref for car control
  const playerCarRef = useRef(null);
  
  // Handle config changes with immediate updates for better responsiveness
  const handleConfigChange = (newConfig) => {
    try {
      // Update immediately without loading screen
      setBuildingConfig({ 
        ...buildingConfig, 
        ...newConfig, 
        // Only update the seed if it's explicitly provided or if we're changing major structural elements
        seed: newConfig.seed !== undefined ? newConfig.seed : 
              (newConfig.floors || newConfig.width || newConfig.depth) ? Math.random() : buildingConfig.seed 
      });
    } catch (err) {
      setError(`Configuration error: ${err.message}`);
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const handleGenerateNew = () => {
    try {
      // Generate new building with immediate updates
      setBuildingConfig({
        ...buildingConfig,
        seed: Math.random(),
        floors: 3 + Math.floor(Math.random() * 7), // 3-10 floors
        width: 6 + Math.floor(Math.random() * 10), // 6-15 width
        depth: 6 + Math.floor(Math.random() * 10), // 6-15 depth
      });
    } catch (err) {
      setError(`Generation error: ${err.message}`);
      setTimeout(() => setError(null), 3000);
    }
  };
  
  const handleCaptureImage = (imageData) => {
    setCapturedImage(imageData);
    setShowShareModal(true);
  };
  
  // Handle car reset
  const handleResetCar = () => {
    if (playerCarRef.current && playerCarRef.current.resetPosition) {
      try {
        playerCarRef.current.resetPosition();
      } catch (err) {
        setError(`Car reset error: ${err.message}`);
        setTimeout(() => setError(null), 3000);
      }
    }
  };
  
  return (
    <AppContainer className="brutalist-container">
      <Header 
        onAboutClick={() => setShowAboutModal(true)} 
        buildingName={buildingConfig.buildingName}
        onBuildingNameChange={(name) => handleConfigChange({ buildingName: name })}
      />
      
      <ContentContainer className="brutalist-content">
        <ControlPanel 
          config={buildingConfig}
          onConfigChange={handleConfigChange}
          onGenerateNew={handleGenerateNew}
        />
        
        <BrutalistScene 
          config={buildingConfig}
          onCaptureImage={handleCaptureImage}
          playerCarRef={playerCarRef}
        />
        
        <ResetCarButton onClick={handleResetCar}>
          Reset Car
        </ResetCarButton>
        
        <PerformanceWarning show={lowFps}>
          Performance issues detected. Try reducing building size or cloud density.
        </PerformanceWarning>
      </ContentContainer>
      
      <Footer />
      
      {showAboutModal && (
        <AboutModal onClose={() => setShowAboutModal(false)} />
      )}
      
      {showShareModal && (
        <ShareModal 
          imageData={capturedImage}
          buildingName={buildingConfig.buildingName}
          onClose={() => setShowShareModal(false)}
        />
      )}
      
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </AppContainer>
  );
}

export default App; 