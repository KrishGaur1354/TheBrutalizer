import React, { useState } from 'react';
import styled from 'styled-components';
import BrutalistScene from './scenes/BrutalistScene';
import ControlPanel from './components/ControlPanel';
import Header from './components/Header';
import Footer from './components/Footer';
import AboutModal from './components/AboutModal';
import ShareModal from './components/ShareModal';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
`;

const ContentContainer = styled.div`
  display: flex;
  flex: 1;
  position: relative;
  
  @media (max-width: 768px) {
    flex-direction: column;
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
    cloudDensity: 0.7,
    rooftopGarden: false,
    groundPark: false,
    seed: Math.random(),
  });
  
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  
  const handleConfigChange = (newConfig) => {
    setBuildingConfig({ 
        ...buildingConfig, 
        ...newConfig, 
        seed: Math.random() 
    });
  };
  
  const handleGenerateNew = () => {
    setBuildingConfig({
      ...buildingConfig,
      seed: Math.random(),
      floors: 1 + Math.floor(Math.random() * 14),
      width: 5 + Math.floor(Math.random() * 15),
      depth: 5 + Math.floor(Math.random() * 15),
    });
  };
  
  const handleCaptureImage = (imageData) => {
    setCapturedImage(imageData);
    setShowShareModal(true);
  };

  const handleCaptureComplete = () => {
    // No longer need to reset captureRequested flag
    // Could potentially be used for other logic after capture if needed
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
          onCaptureComplete={handleCaptureComplete}
        />
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
    </AppContainer>
  );
}

export default App; 