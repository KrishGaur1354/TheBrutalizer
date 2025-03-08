import React from 'react';
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

const Section = styled.div`
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

function AboutModal({ onClose }) {
  return (
    <ModalOverlay className="brutalist-modal" onClick={onClose}>
      <ModalContent className="brutalist-modal-content" onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>×</CloseButton>
        
        <Title>ABOUT BRUTALIZER</Title>
        
        <Section>
          <p>
            BRUTALIZER is an interactive tool for generating and customizing brutalist architecture in 3D.
            Inspired by the raw concrete forms and geometric shapes of brutalist buildings from the 1960s to 1980s,
            this tool allows you to create your own brutalist masterpiece.
          </p>
        </Section>
        
        <Section>
          <SectionTitle>HOW IT WORKS</SectionTitle>
          <p>
            The generator uses procedural algorithms to create randomized brutalist structures based on your input parameters.
            The buildings are constructed using geometric primitives arranged in patterns typical of brutalist architecture:
            raw concrete surfaces, repetitive elements, and bold geometric forms.
          </p>
        </Section>
        
        <Section>
          <SectionTitle>CONTROLS</SectionTitle>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Floors:</strong> Adjust the number of floors in your building</li>
            <li><strong>Width/Depth:</strong> Change the building's footprint dimensions</li>
            <li><strong>Window Density:</strong> Control how many windows appear on the facades</li>
            <li><strong>Texture Roughness:</strong> Adjust the roughness of the concrete texture</li>
            <li><strong>Concrete Color:</strong> Change the color of the concrete</li>
            <li><strong>Generate New:</strong> Create a new random building with current parameters</li>
            <li><strong>Capture:</strong> Take a screenshot to share your creation</li>
          </ul>
        </Section>
        
        <Section>
          <SectionTitle>NAVIGATION</SectionTitle>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Rotate:</strong> Click and drag to orbit around the building</li>
            <li><strong>Zoom:</strong> Use the mouse wheel to zoom in and out</li>
            <li><strong>Pan:</strong> Right-click and drag to pan the view</li>
          </ul>
        </Section>
        
        <Section>
          <SectionTitle>ABOUT BRUTALISM</SectionTitle>
          <p>
            Brutalism is an architectural style that emerged in the 1950s and became popular in the 1960s and 1970s.
            It is characterized by minimalist constructions that showcase the raw building materials and structural elements
            over decorative design. The term "brutalism" comes from the French "béton brut" meaning "raw concrete",
            which is the primary material used in brutalist buildings.
          </p>
        </Section>
      </ModalContent>
    </ModalOverlay>
  );
}

export default AboutModal; 