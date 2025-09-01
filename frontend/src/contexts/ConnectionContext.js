import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiConfig, API_ENDPOINTS } from '../config/api.js';

const ConnectionContext = createContext();

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};

export const ConnectionProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastCheck, setLastCheck] = useState(new Date());

  const checkConnection = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Shorter timeout
      
      const response = await fetch(`${apiConfig.baseURL}${API_ENDPOINTS.HEALTH}`, {
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      setIsConnected(response.ok);
      setLastCheck(new Date());
      
      return response.ok;
    } catch (error) {
      if (error.name !== 'AbortError') {
        setIsConnected(false);
        setLastCheck(new Date());
      }
      return false;
    }
  }, []);

  // Only check connection on mount, no polling!
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  const value = {
    isConnected,
    lastCheck,
    checkConnection
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}; 