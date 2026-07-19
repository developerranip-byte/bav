import React from 'react';

const Loader = ({ fullScreen = false, overlay = false }) => {
  if (fullScreen) {
    return (
      <div className="loader-overlay full-screen">
        <div className="spinner"></div>
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="loader-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="loader-container">
      <div className="spinner"></div>
    </div>
  );
};

export default Loader;
