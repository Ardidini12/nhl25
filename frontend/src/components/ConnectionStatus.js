import React, { useState, useEffect } from 'react';
import { useConnection } from '../contexts/ConnectionContext';
import './ConnectionStatus.css';

const ConnectionStatus = () => {
  const { isConnected, checkConnection } = useConnection();
  const [showStatus, setShowStatus] = useState(false);

  // Only show status when there's a problem or when explicitly checking
  useEffect(() => {
    if (!isConnected) {
      setShowStatus(true);
      // Hide after 5 seconds if connection is restored
      const timer = setTimeout(() => {
        if (isConnected) {
          setShowStatus(false);
        }
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      // If connected, hide the status after a short delay
      const timer = setTimeout(() => setShowStatus(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  // Check connection when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkConnection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [checkConnection]);

  // Only render when there's something important to show
  if (!showStatus && isConnected) return null;

  return (
    <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
      <div className="status-indicator">
        <div className="status-dot"></div>
        <span className="status-text">
          {isConnected ? 'Connected' : 'No Backend Connection'}
        </span>
      </div>
    </div>
  );
};

export default ConnectionStatus; 