import React, { useRef } from 'react';
import styled from 'styled-components';

// Main container with improved readability
const ControlPanelContainer = styled.div`
  width: 320px;
  background: #dddddd;
  color: #222222;
  padding: 0;
  z-index: 5;
  font-family: 'Courier New', monospace;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
  box-sizing: border-box;
  height: 100%;
  position: relative;
  border-right: 8px solid #888888;
  overflow: hidden;
  box-shadow: inset -5px 0 15px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 768px) {
    width: 100%;
    max-height: 200px;
  }
`;

// Header block with better contrast
const TitleBlock = styled.div`
  background: #888888;
  padding: 12px 10px;
  border-bottom: 4px solid #666666;
  margin-bottom: 0;
`;

// More legible title
const Title = styled.h2`
  text-transform: uppercase;
  font-weight: 900;
  letter-spacing: 3px;
  margin: 0;
  text-align: center;
  font-size: 1.6rem;
  color: #ffffff;
  padding: 8px;
  font-family: monospace;
`;

// Enhanced scroll container
const ScrollContent = styled.div`
  overflow-y: auto;
  flex: 1;
  padding: 15px;
  
  /* Improved scrollbar */
  &::-webkit-scrollbar {
    width: 10px;
    background: #cccccc;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #666666;
    border: none;
  }
  
  /* Add some spacing at the bottom of scrollable content */
  &::after {
    content: "";
    display: block;
    height: 20px;
  }
`;

// Improved control button styling
const ControlButton = styled.button`
  background: #666666;
  color: #ffffff;
  border: none;
  width: 100%;
  padding: 15px 10px;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 1.2rem;
  position: relative;
  font-family: monospace;
  text-align: center;
  margin-bottom: 25px;
  box-shadow: 0px 4px 0px #444444;
  transition: all 0.1s ease;
  
  &:hover {
    background: #555555;
  }
  
  &:active {
    transform: translateY(4px);
    box-shadow: 0px 0px 0px #444444;
  }
`;

// More readable control section
const ControlSection = styled.div`
  margin-bottom: 20px;
  background: #cccccc;
  border-radius: 2px;
  padding: 12px;
  box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.1);
`;

// Enhanced control label
const ControlLabel = styled.div`
  text-transform: uppercase;
  background: #666666;
  color: white;
  font-weight: bold;
  padding: 6px 10px;
  margin-bottom: 10px;
  font-size: 0.9rem;
  letter-spacing: 1px;
  display: inline-block;
  width: 100%;
  box-sizing: border-box;
`;

// More intuitive slider container
const SliderContainer = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  background: #bbbbbb;
  padding: 10px;
  border-radius: 2px;
`;

// Enhanced slider
const Slider = styled.input.attrs({ type: 'range' })`
  flex: 1;
  height: 20px;
  -webkit-appearance: none;
  background: #999999;
  outline: none;
  margin-right: 15px;
  border-radius: 2px;
  
  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 30px;
    background: #444444;
    cursor: pointer;
    border: none;
    border-radius: 2px;
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 30px;
    background: #444444;
    cursor: pointer;
    border: none;
    border-radius: 2px;
  }
`;

// Improved value display
const SliderValue = styled.div`
  background: #666666;
  color: white;
  font-weight: bold;
  padding: 6px 10px;
  min-width: 30px;
  text-align: center;
  font-family: monospace;
  font-size: 1.1rem;
  border-radius: 2px;
`;

// Color picker container
const ColorPickerContainer = styled.div`
  background: #bbbbbb;
  padding: 10px;
  border-radius: 2px;
`;

// Improved color picker
const ColorPicker = styled.input.attrs({ type: 'color' })`
  width: 100%;
  height: 40px;
  padding: 0;
  border: none;
  cursor: pointer;
  background: #999999;
  border-radius: 2px;
`;

// Section divider
const Divider = styled.div`
  height: 2px;
  background: #888888;
  margin: 20px 0;
`;

// Export button
const ExportButton = styled(ControlButton)`
  background: #333333;
  margin-top: 10px;
  
  &:hover {
    background: #222222;
  }
`;

// Add new styled components for checkbox
const CheckboxContainer = styled.div`
  background: #bbbbbb;
  padding: 10px;
  border-radius: 2px;
  margin-bottom: 10px;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: bold;
  
  span {
    margin-left: 10px;
  }
`;

const Checkbox = styled.input.attrs({ type: 'checkbox' })`
  width: 20px;
  height: 20px;
  cursor: pointer;
`;

function ControlPanel({ config, onConfigChange, onGenerateNew }) {
  const containerRef = useRef(null);
  
  // Enhanced slider change handler
  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    onConfigChange({ [name]: parseFloat(value) });
  };
  
  // Handle color changes
  const handleColorChange = (e) => {
    onConfigChange({ concreteColor: e.target.value });
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    onConfigChange({ [name]: checked });
  };
  
  return (
    <ControlPanelContainer ref={containerRef}>
      <TitleBlock>
        <Title>CONTROLS</Title>
      </TitleBlock>
      
      <ScrollContent>
        <ControlButton onClick={onGenerateNew}>
          GENERATE NEW
        </ControlButton>
        
        <ControlSection>
          <ControlLabel>BUILDING SIZE</ControlLabel>
          
          <SliderContainer>
            <Slider
              name="floors"
              min="1"
              max="15"
              step="1"
              value={config.floors}
              onChange={handleSliderChange}
            />
            <SliderValue>{config.floors} FL</SliderValue>
          </SliderContainer>
          
          <SliderContainer>
            <Slider
              name="width"
              min="5"
              max="20"
              step="1"
              value={config.width}
              onChange={handleSliderChange}
            />
            <SliderValue>W: {config.width}</SliderValue>
          </SliderContainer>
          
          <SliderContainer>
            <Slider
              name="depth"
              min="5"
              max="20"
              step="1"
              value={config.depth}
              onChange={handleSliderChange}
            />
            <SliderValue>D: {config.depth}</SliderValue>
          </SliderContainer>
        </ControlSection>
        
        <ControlSection>
          <ControlLabel>WINDOWS</ControlLabel>
          <SliderContainer>
            <Slider
              name="windowDensity"
              min="0"
              max="1"
              step="0.05"
              value={config.windowDensity}
              onChange={handleSliderChange}
            />
            <SliderValue>{(config.windowDensity * 100).toFixed(0)}%</SliderValue>
          </SliderContainer>
        </ControlSection>
        
        <ControlSection>
          <ControlLabel>CONCRETE</ControlLabel>
          <SliderContainer>
            <Slider
              name="textureRoughness"
              min="0"
              max="1"
              step="0.05"
              value={config.textureRoughness}
              onChange={handleSliderChange}
            />
            <SliderValue>{(config.textureRoughness * 100).toFixed(0)}%</SliderValue>
          </SliderContainer>
          
          <ColorPickerContainer>
            <ColorPicker
              value={config.concreteColor}
              onChange={handleColorChange}
            />
          </ColorPickerContainer>
        </ControlSection>
        
        <ControlSection>
          <ControlLabel>ENVIRONMENT</ControlLabel>
          
          <CheckboxContainer>
            <CheckboxLabel>
              <Checkbox
                name="rooftopGarden"
                checked={config.rooftopGarden || false}
                onChange={handleCheckboxChange}
              />
              <span>Rooftop Garden</span>
            </CheckboxLabel>
          </CheckboxContainer>
          
          <CheckboxContainer>
            <CheckboxLabel>
              <Checkbox
                name="groundPark"
                checked={config.groundPark || false}
                onChange={handleCheckboxChange}
              />
              <span>Ground Park</span>
            </CheckboxLabel>
          </CheckboxContainer>
          
          <SliderContainer>
            <Slider
              name="cloudDensity"
              min="0"
              max="1"
              step="0.05"
              value={config.cloudDensity || 0.7}
              onChange={handleSliderChange}
            />
            <SliderValue>{((config.cloudDensity || 0.7) * 100).toFixed(0)}%</SliderValue>
          </SliderContainer>
        </ControlSection>
        
        {/* Export button removed as requested */}
      </ScrollContent>
    </ControlPanelContainer>
  );
}

export default ControlPanel; 