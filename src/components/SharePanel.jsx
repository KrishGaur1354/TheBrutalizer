import React from 'react';
import styled from 'styled-components';

const ShareContainer = styled.div`
  background: #dddddd;
  padding: 20px;
  border-radius: 2px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  border: 8px solid #888888;
  position: relative;
  font-family: 'Courier New', monospace;
`;

const ShareTitle = styled.h2`
  text-transform: uppercase;
  font-weight: 900;
  letter-spacing: 3px;
  margin: 0 0 20px 0;
  text-align: center;
  font-size: 1.6rem;
  color: #333333;
  padding: 10px;
  background: #888888;
  font-family: monospace;
`;

const ImagePreview = styled.img`
  max-width: 100%;
  height: auto;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  border: 4px solid #666666;
`;

const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
`;

const ActionButton = styled.button`
  background: #666666;
  color: #ffffff;
  border: none;
  padding: 12px 15px;
  font-weight: bold;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 2px;
  font-size: 0.9rem;
  font-family: monospace;
  flex: 1;
  min-width: 120px;
  box-shadow: 0px 3px 0px #444444;
  transition: all 0.1s ease;
  
  &:hover {
    background: #555555;
  }
  
  &:active {
    transform: translateY(3px);
    box-shadow: 0px 0px 0px #444444;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #444444;
  color: white;
  border: none;
  width: 30px;
  height: 30px;
  font-size: 20px;
  line-height: 30px;
  text-align: center;
  cursor: pointer;
  
  &:hover {
    background: #333333;
  }
`;

const LinkInput = styled.input`
  width: 100%;
  padding: 10px;
  box-sizing: border-box;
  font-family: monospace;
  background: #bbbbbb;
  border: none;
  margin-bottom: 10px;
`;

function SharePanel({ imageUrl, onClose, buildingName }) {
  // Function to download the image
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${buildingName || 'brutalist-building'}.png`;
    link.click();
  };
  
  // Function to copy image to clipboard
  const handleCopyImage = () => {
    // Create a canvas to draw the image
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      try {
        // Try to copy image to clipboard
        canvas.toBlob(async (blob) => {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            alert('Image copied to clipboard!');
          } catch (err) {
            console.error('Failed to copy image: ', err);
            alert('Failed to copy image. Try another method.');
          }
        });
      } catch (err) {
        console.error('Failed to copy image: ', err);
        alert('Your browser doesn\'t support copying images. Try downloading instead.');
      }
    };
    img.src = imageUrl;
  };
  
  // Function to copy image URL to clipboard
  const handleCopyLink = () => {
    navigator.clipboard.writeText(imageUrl)
      .then(() => alert('Image URL copied to clipboard!'))
      .catch(err => {
        console.error('Failed to copy URL: ', err);
        alert('Failed to copy URL. Try selecting and copying manually.');
      });
  };
  
  // Function to share via social media
  const handleShare = (platform) => {
    let shareUrl;
    
    switch(platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=Check out my brutalist building design&url=${encodeURIComponent(window.location.href)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
        break;
      case 'reddit':
        shareUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(window.location.href)}&title=My Brutalist Building Design`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
  };
  
  return (
    <ShareContainer onClick={(e) => e.stopPropagation()}>
      <CloseButton onClick={onClose}>×</CloseButton>
      <ShareTitle>SHARE YOUR DESIGN</ShareTitle>
      
      <ImagePreview src={imageUrl} alt="Brutalist Building" />
      
      <ButtonRow>
        <ActionButton onClick={handleDownload}>
          Download PNG
        </ActionButton>
        <ActionButton onClick={handleCopyImage}>
          Copy Image
        </ActionButton>
      </ButtonRow>
      
      <ButtonRow>
        <ActionButton onClick={() => handleShare('twitter')}>
          Twitter
        </ActionButton>
        <ActionButton onClick={() => handleShare('facebook')}>
          Facebook
        </ActionButton>
        <ActionButton onClick={() => handleShare('reddit')}>
          Reddit
        </ActionButton>
      </ButtonRow>
      
      <div>
        <LinkInput 
          value={imageUrl} 
          readOnly
          onClick={(e) => e.target.select()}
        />
        <ActionButton onClick={handleCopyLink} style={{ width: '100%' }}>
          Copy Link
        </ActionButton>
      </div>
    </ShareContainer>
  );
}

export default SharePanel; 