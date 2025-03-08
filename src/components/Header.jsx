import React, { useState } from 'react';
import styled from 'styled-components';

const HeaderContainer = styled.header`
  background: var(--color-primary);
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 10;
`;

const Logo = styled.div`
  font-size: 2rem;
  font-weight: bold;
  letter-spacing: 2px;
  text-transform: uppercase;
`;

const BuildingNameInput = styled.input`
  background: transparent;
  border: none;
  border-bottom: 2px solid white;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  width: 300px;
  padding: 0.25rem;
  
  &:focus {
    outline: none;
    border-bottom: 2px solid var(--color-accent);
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const AboutButton = styled.button`
  background: transparent;
  border: 2px solid white;
  color: white;
  padding: 0.5rem 1rem;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 1px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

function Header({ onAboutClick, buildingName, onBuildingNameChange }) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(buildingName);
  
  const handleNameClick = () => {
    setIsEditing(true);
    setTempName(buildingName);
  };
  
  const handleNameChange = (e) => {
    setTempName(e.target.value);
  };
  
  const handleNameBlur = () => {
    setIsEditing(false);
    onBuildingNameChange(tempName);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      onBuildingNameChange(tempName);
    }
  };
  
  return (
    <HeaderContainer className="brutalist-header">
      <Logo>BRUTALIZER</Logo>
      
      {isEditing ? (
        <BuildingNameInput
          type="text"
          value={tempName}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          onKeyDown={handleKeyDown}
          autoFocus
          maxLength={30}
        />
      ) : (
        <BuildingNameInput
          as="div"
          onClick={handleNameClick}
          style={{ cursor: 'pointer' }}
        >
          {buildingName}
        </BuildingNameInput>
      )}
      
      <Controls>
        <AboutButton onClick={onAboutClick}>
          ABOUT
        </AboutButton>
      </Controls>
    </HeaderContainer>
  );
}

export default Header; 