import React, { useState } from 'react';
import html2canvas from 'html2canvas';
import './CaptureButton.css';

const CaptureButton = ({ onCapture }) => {
  const [capturedImage, setCapturedImage] = useState(null);
  const handleCapture = async () => {
    const captureTarget = document.getElementById('capture-area');
    if (!captureTarget) {
      alert('Capture area not found.');
      return;
    }
    const canvas = await html2canvas(captureTarget);
    const dataUrl = canvas.toDataURL();
    if (dataUrl === 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAA1JREFUCB1j+P///P8ACfsD/4312h4AAAAASUVORK5CYII=') {
      alert('Captured image is blank, please try again.');
    } else {
      setCapturedImage(dataUrl);
      if (typeof onCapture === 'function') onCapture(dataUrl);
    }
  };

  return (
    <div>
      <button className="capture-button" onClick={handleCapture}>
        <span className="capture-icon" style={{ display: "flex", justifyContent: "center", alignItems: "center", marginRight: "8px" }}>☠</span>
        <span className="capture-text">CAPTURE</span>
      </button>
      {capturedImage && (
        <div className="captured-image-container">
          <img src={capturedImage} alt="Captured" style={{ maxWidth: "100%" }} />
        </div>
      )}
    </div>
  );
};

export default CaptureButton; 