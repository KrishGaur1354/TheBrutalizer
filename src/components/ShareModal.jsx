import React, { useState } from 'react';
import styled from 'styled-components';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background: var(--color-background);
  padding: 2rem;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
  border: 4px solid var(--color-primary);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  font-weight: bold;
`;

const Title = styled.h2`
  font-size: 2rem;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 2px;
  border-bottom: 4px solid var(--color-primary);
  padding-bottom: 0.5rem;
`;

const ImageContainer = styled.div`
  margin-bottom: 1.5rem;
  text-align: center;
`;

const BuildingImage = styled.img`
  max-width: 100%;
  max-height: 300px;
  border: 2px solid var(--color-primary);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const Button = styled.button`
  flex: 1;
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 0.75rem 1rem;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &:hover {
    background: #444;
  }
`;

const Message = styled.div`
  margin-top: 1rem;
  padding: 0.5rem;
  text-align: center;
  font-weight: bold;
`;

function ShareModal({ imageData, buildingName, onClose }) {
  const [message, setMessage] = useState('');
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `${buildingName.replace(/\s+/g, '_').toLowerCase()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setMessage('Image downloaded successfully!');
    setTimeout(() => setMessage(''), 3000);
  };
  
  const handleCopyToClipboard = async () => {
    try {
      // Convert base64 to blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      // Create clipboard item
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      
      setMessage('Image copied to clipboard!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Failed to copy image: ', error);
      setMessage('Failed to copy image. Try downloading instead.');
      setTimeout(() => setMessage(''), 3000);
    }
  };
  
  return (
    <ModalOverlay className="brutalist-modal" onClick={onClose}>
      <ModalContent className="brutalist-modal-content" onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <Title>SHARE YOUR CREATION</Title>
        
        <ImageContainer>
          <BuildingImage src={imageData} alt={buildingName} />
          <h3 style={{ marginTop: '1rem', textTransform: 'uppercase' }}>{buildingName}</h3>
        </ImageContainer>
        
        <ButtonGroup>
          <Button onClick={handleDownload}>
            Download
          </Button>
          <Button onClick={handleCopyToClipboard}>
            Copy to Clipboard
          </Button>
        </ButtonGroup>
        
        {message && (
          <Message>{message}</Message>
        )}
      </ModalContent>
    </ModalOverlay>
  );
}

export default ShareModal; 