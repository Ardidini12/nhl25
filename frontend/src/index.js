import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Comprehensive ResizeObserver error suppression
const suppressResizeObserverErrors = () => {
  // Suppress console errors
  const originalError = console.error;
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('ResizeObserver loop completed with undelivered notifications')) {
      return;
    }
    originalError.apply(console, args);
  };

  // Handle runtime errors  
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('ResizeObserver loop completed with undelivered notifications')) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });

  // Hide webpack overlay errors
  const hideOverlays = () => {
    const overlayDiv = document.getElementById('webpack-dev-server-client-overlay-div');
    const overlay = document.getElementById('webpack-dev-server-client-overlay');
    
    if (overlay) overlay.style.display = 'none';
    if (overlayDiv) overlayDiv.style.display = 'none';
  };

  // Run immediately and on DOM changes
  hideOverlays();
  const observer = new MutationObserver(hideOverlays);
  observer.observe(document.body, { childList: true, subtree: true });
};

suppressResizeObserverErrors();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
); 