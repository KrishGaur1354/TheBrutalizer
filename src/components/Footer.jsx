import React from 'react';
import styled from 'styled-components';

const FooterContainer = styled.footer`
  background: var(--color-primary);
  color: white;
  padding: 0.5rem 1rem;
  text-align: center;
  font-size: 0.8rem;
  z-index: 10;
`;

function Footer() {
  return (
    <FooterContainer className="brutalist-footer">
      BRUTALIZER &copy; {new Date().getFullYear()} | GENERATE YOUR OWN BRUTALIST ARCHITECTURE
    </FooterContainer>
  );
}

export default Footer; 