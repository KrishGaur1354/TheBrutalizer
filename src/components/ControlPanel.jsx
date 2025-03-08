import React from 'react';
import styled from 'styled-components';

const ControlPanelContainer = styled.div`
  width: 300px;
  background: var(--color-secondary);
  color: white;
  padding: 1rem;
  overflow-y: auto;
  z-index: 5;
  
  @media (max-width: 768px) {
    width: 100%;
    max-height: 200px;
  }
`;

const ControlGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const ControlLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

const Slider = styled.input`
  width: 100%;
  margin-top: 0.5rem;
`;

const SliderValue = styled.span`
  float: right;
  font-weight: bold;
`;

const ColorPicker = styled.input`
  width: 100%;
  height: 40px;
  padding: 0;
  border: none;
  cursor: pointer;
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

function ControlPanel({ config, onConfigChange, onGenerateNew, onCaptureImage }) {
  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    onConfigChange({ [name]: parseFloat(value) });
  };
  
  const handleColorChange = (e) => {
    onConfigChange({ concreteColor: e.target.value });
  };
  
  return (
    <ControlPanelContainer className="brutalist-sidebar">
      <h2 style={{ marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
        Building Controls
      </h2>
      
      <ControlGroup className="brutalist-control-group">
        <ControlLabel className="brutalist-control-label">
          Floors <SliderValue>{config.floors}</SliderValue>
        </ControlLabel>
        <Slider
          type="range"
          name="floors"
          min="1"
          max="15"
          step="1"
          value={config.floors}
          onChange={handleSliderChange}
          className="brutalist-slider"
        />
      </ControlGroup>
      
      <ControlGroup className="brutalist-control-group">
        <ControlLabel className="brutalist-control-label">
          Width <SliderValue>{config.width}</SliderValue>
        </ControlLabel>
        <Slider
          type="range"
          name="width"
          min="5"
          max="20"
          step="1"
          value={config.width}
          onChange={handleSliderChange}
          className="brutalist-slider"
        />
      </ControlGroup>
      
      <ControlGroup className="brutalist-control-group">
        <ControlLabel className="brutalist-control-label">
          Depth <SliderValue>{config.depth}</SliderValue>
        </ControlLabel>
        <Slider
          type="range"
          name="depth"
          min="5"
          max="20"
          step="1"
          value={config.depth}
          onChange={handleSliderChange}
          className="brutalist-slider"
        />
      </ControlGroup>
      
      <ControlGroup className="brutalist-control-group">
        <ControlLabel className="brutalist-control-label">
          Window Density <SliderValue>{(config.windowDensity * 100).toFixed(0)}%</SliderValue>
        </ControlLabel>
        <Slider
          type="range"
          name="windowDensity"
          min="0"
          max="1"
          step="0.05"
          value={config.windowDensity}
          onChange={handleSliderChange}
          className="brutalist-slider"
        />
      </ControlGroup>
      
      <ControlGroup className="brutalist-control-group">
        <ControlLabel className="brutalist-control-label">
          Texture Roughness <SliderValue>{(config.textureRoughness * 100).toFixed(0)}%</SliderValue>
        </ControlLabel>
        <Slider
          type="range"
          name="textureRoughness"
          min="0"
          max="1"
          step="0.05"
          value={config.textureRoughness}
          onChange={handleSliderChange}
          className="brutalist-slider"
        />
      </ControlGroup>
      
      <ControlGroup className="brutalist-control-group">
        <ControlLabel className="brutalist-control-label">
          Concrete Color
        </ControlLabel>
        <ColorPicker
          type="color"
          value={config.concreteColor}
          onChange={handleColorChange}
        />
      </ControlGroup>
      
      <ButtonGroup className="brutalist-button-group">
        <Button onClick={onGenerateNew}>
          Generate New
        </Button>
        <Button onClick={onCaptureImage}>
          Capture
        </Button>
      </ButtonGroup>
    </ControlPanelContainer>
  );
}

export default ControlPanel; 