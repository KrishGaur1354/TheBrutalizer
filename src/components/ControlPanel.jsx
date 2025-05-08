import React, { useRef, useState } from 'react';
import styled from 'styled-components';

// Main container with improved readability and collapsible functionality
const ControlPanelContainer = styled.div`
  width: ${props => props.collapsed ? '45px' : '320px'};
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
  transition: width 0.3s ease-in-out;
  
  @media (max-width: 768px) {
    width: 100%;
    max-height: ${props => props.collapsed ? '50px' : '200px'};
  }
`;

// Header block with better contrast
const TitleBlock = styled.div`
  background: #888888;
  padding: 12px 10px;
  border-bottom: 4px solid #666666;
  margin-bottom: 0;
  display: flex;
  justify-content: ${props => props.collapsed ? 'center' : 'space-between'};
  align-items: center;
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
  
  @media (max-width: 768px) {
    font-size: ${props => props.collapsed ? '1.2rem' : '1.6rem'};
  }
`;

// Toggle button for collapsing panel
const ToggleButton = styled.button`
  background: #666666;
  color: #ffffff;
  border: none;
  width: 35px;
  height: 35px;
  font-weight: bold;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.1s ease;
  border-radius: 2px;
  box-shadow: 0px 2px 0px #444444;
  
  &:hover {
    background: #555555;
  }
  
  &:active {
    transform: translateY(2px);
    box-shadow: 0px 0px 0px #444444;
  }
`;

// Enhanced scroll container
const ScrollContent = styled.div`
  overflow-y: auto;
  flex: 1;
  padding: 15px;
  display: ${props => props.collapsed ? 'none' : 'block'};
  
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
  const [collapsed, setCollapsed] = useState(false);
  
  // Enhanced slider change handler
  const handleSliderChange = (e) => {
    const { name, value } = e.target;
    onConfigChange({ [name]: parseFloat(value) });
  };
  
  // Handle color changes
  const handleColorChange = (e) => {
    const { name, value } = e.target;
    onConfigChange({ [name]: value });
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    onConfigChange({ [name]: checked });
  };
  
  // Toggle panel collapse state
  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };
  
  return (
    <ControlPanelContainer ref={containerRef} collapsed={collapsed}>
      <TitleBlock collapsed={collapsed}>
        {!collapsed && <Title>CONTROLS</Title>}
        <ToggleButton onClick={toggleCollapse}>
          {collapsed ? '→' : '←'}
        </ToggleButton>
      </TitleBlock>
      
      <ScrollContent collapsed={collapsed}>
        <ControlButton onClick={onGenerateNew}>GENERATE NEW</ControlButton>
        
        {/* Building Controls */}
        <ControlSection>
          <ControlLabel>BUILDING STRUCTURE</ControlLabel>
          
          <SliderContainer>
            <label>FLOORS</label>
            <Slider 
              name="floors" 
              min="1" 
              max="15" 
              value={config.floors} 
              onChange={handleSliderChange} 
            />
            <SliderValue>{config.floors}</SliderValue>
          </SliderContainer>
          
          <SliderContainer>
            <label>WIDTH</label>
            <Slider 
              name="width" 
              min="5" 
              max="20" 
              value={config.width} 
              onChange={handleSliderChange} 
            />
            <SliderValue>{config.width}</SliderValue>
          </SliderContainer>
          
          <SliderContainer>
            <label>DEPTH</label>
            <Slider 
              name="depth" 
              min="5" 
              max="20" 
              value={config.depth} 
              onChange={handleSliderChange} 
            />
            <SliderValue>{config.depth}</SliderValue>
          </SliderContainer>
        </ControlSection>
        
        {/* Texture Controls */}
        <ControlSection>
          <ControlLabel>TEXTURE & APPEARANCE</ControlLabel>
          
          <SliderContainer>
            <label>WINDOW DENSITY</label>
            <Slider 
              name="windowDensity" 
              min="0" 
              max="1" 
              step="0.1" 
              value={config.windowDensity} 
              onChange={handleSliderChange} 
            />
            <SliderValue>{config.windowDensity.toFixed(1)}</SliderValue>
          </SliderContainer>
          
          <SliderContainer>
            <label>TEXTURE ROUGHNESS</label>
            <Slider 
              name="textureRoughness" 
              min="0" 
              max="1" 
              step="0.1" 
              value={config.textureRoughness} 
              onChange={handleSliderChange} 
            />
            <SliderValue>{config.textureRoughness.toFixed(1)}</SliderValue>
          </SliderContainer>
          
          <SliderContainer>
            <label>CLOUD DENSITY</label>
            <Slider 
              name="cloudDensity" 
              min="0" 
              max="1" 
              step="0.1" 
              value={config.cloudDensity} 
              onChange={handleSliderChange} 
            />
            <SliderValue>{config.cloudDensity.toFixed(1)}</SliderValue>
          </SliderContainer>
          
          <ColorPickerContainer>
            <label>CONCRETE COLOR</label>
            <ColorPicker 
              name="concreteColor" 
              value={config.concreteColor} 
              onChange={handleColorChange} 
            />
          </ColorPickerContainer>
        </ControlSection>
        
        {/* Additional Controls */}
        <ControlSection>
          <ControlLabel>ADDITIONAL FEATURES</ControlLabel>
          
          <CheckboxContainer>
            <CheckboxLabel>
              <Checkbox 
                name="rooftopGarden" 
                checked={config.rooftopGarden} 
                onChange={handleCheckboxChange}
              />
              <span>ROOFTOP GARDEN</span>
            </CheckboxLabel>
          </CheckboxContainer>
          
          <CheckboxContainer>
            <CheckboxLabel>
              <Checkbox 
                name="groundPark" 
                checked={config.groundPark} 
                onChange={handleCheckboxChange}
              />
              <span>GROUND PARK</span>
            </CheckboxLabel>
          </CheckboxContainer>
        </ControlSection>
        
        {/* Building Name Input */}
        <ControlSection>
          <ControlLabel>BUILDING NAME</ControlLabel>
          <input 
            type="text" 
            name="buildingName" 
            value={config.buildingName} 
            onChange={(e) => onConfigChange({ buildingName: e.target.value })} 
            style={{ 
              width: '100%', 
              padding: '10px',
              fontSize: '16px',
              fontFamily: 'monospace',
              marginTop: '5px',
              border: 'none',
              background: '#bbbbbb'
            }}
          />
        </ControlSection>
      </ScrollContent>
    </ControlPanelContainer>
  );
}

export default ControlPanel; 