import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiConfig, API_ENDPOINTS } from '../config/api.js';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Initialize user from localStorage immediately to prevent blank page
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const cachedUserData = localStorage.getItem('userData');
    if (token && cachedUserData) {
      try {
        const userData = JSON.parse(cachedUserData);
        console.log('Initialized with cached user data:', userData.name);
        return userData;
      } catch (e) {
        console.warn('Failed to parse cached user data, removing...');
        localStorage.removeItem('userData');
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(() => {
    // If we have cached user data, start with loading false
    const token = localStorage.getItem('token');
    const cachedUserData = localStorage.getItem('userData');
    return !(token && cachedUserData);
  });
  const hasRefreshed = useRef(false);

  const refreshUserData = useCallback(async (showError = false) => {
    console.log('refreshUserData called, showError:', showError);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, setting user to null');
        setUser(null);
        setLoading(false);
        return;
      }

      console.log('Making API call to refresh user data...');
      const response = await fetch(`${apiConfig.baseURL}${API_ENDPOINTS.AUTH.ME}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('User data refreshed successfully:', data.data.name);
        setUser(data.data);
        // Store user data in localStorage for cross-tab sync
        localStorage.setItem('userData', JSON.stringify(data.data));
      } else {
        if (response.status === 401) {
          // Token is invalid or expired
          console.warn('Token expired or invalid, logging out');
          localStorage.removeItem('token');
          localStorage.removeItem('userData');
          setUser(null);
          if (showError) {
            console.warn('Session expired. Please log in again.');
          }
        } else {
          console.warn('Server error response:', response.status);
          // For other errors, keep the cached user
          const cachedUserData = localStorage.getItem('userData');
          if (cachedUserData) {
            try {
              const userData = JSON.parse(cachedUserData);
              console.log('Using cached user data due to server error:', userData.name);
              setUser(userData);
            } catch (e) {
              localStorage.removeItem('userData');
            }
          }
        }
      }
    } catch (error) {
      // Network error - don't clear token immediately in case it's temporary
      console.error('Network error during refresh:', error);
      if (showError) {
        console.error('Network error while refreshing user data:', error);
      }
      // Use cached data if available
      const cachedUserData = localStorage.getItem('userData');
      if (cachedUserData) {
        try {
          const userData = JSON.parse(cachedUserData);
          console.log('Using cached user data due to network error:', userData.name);
          setUser(userData);
        } catch (e) {
          console.warn('Failed to parse cached user data');
          localStorage.removeItem('userData');
        }
      }
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies to prevent loops

  const logout = useCallback(() => {
    console.log('Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setUser(null);
    hasRefreshed.current = false; // Reset for next login
    // Broadcast logout to other tabs
    localStorage.setItem('logout-event', Date.now().toString());
  }, []);

  // Handle cross-tab synchronization
  useEffect(() => {
    const handleStorageChange = (e) => {
      console.log('Storage change detected:', e.key, 'new value exists:', !!e.newValue);
      if (e.key === 'token') {
        if (e.newValue) {
          // Token was set in another tab - refresh user data
          console.log('Token updated in another tab, refreshing user data');
          hasRefreshed.current = false; // Allow refresh again
          refreshUserData();
        } else {
          // Token was removed in another tab - logout
          console.log('Token removed in another tab, logging out');
          setUser(null);
          localStorage.removeItem('userData');
        }
      } else if (e.key === 'logout-event') {
        // Logout was triggered in another tab
        console.log('Logout event detected from another tab');
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshUserData]);

  useEffect(() => {
    // Only refresh user data once on mount
    if (!hasRefreshed.current) {
      hasRefreshed.current = true;
      refreshUserData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run on mount

  const login = useCallback(async (emailOrGamerTag, password) => {
    try {
      console.log('Attempting login for:', emailOrGamerTag);
      const response = await fetch(`${apiConfig.baseURL}${API_ENDPOINTS.AUTH.SIGN_IN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ emailOrGamerTag, password })
      });

      const data = await response.json();

      if (data.success) {
        console.log('Login successful for:', data.data.user.name);
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('userData', JSON.stringify(data.data.user));
        setUser(data.data.user);
        hasRefreshed.current = false; // Allow refresh after login
        return { success: true };
      } else {
        console.warn('Login failed:', data.error);
        return { success: false, error: data.error || 'Login failed' };
      }
    } catch (error) {
      console.error('Login network error:', error);
      return { success: false, error: 'Network error' };
    }
  }, []);

  const register = useCallback(async (name, email, gamerTag, password) => {
    try {
      console.log('Attempting registration for:', email);
      const response = await fetch(`${apiConfig.baseURL}${API_ENDPOINTS.AUTH.SIGN_UP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name, email, gamerTag, password })
      });

      const data = await response.json();

      if (data.success) {
        console.log('Registration successful for:', data.data.user.name);
        // Automatically log the user in after successful registration
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('userData', JSON.stringify(data.data.user));
        setUser(data.data.user);
        hasRefreshed.current = false; // Allow refresh after registration
        return { success: true };
      } else {
        console.warn('Registration failed:', data.error);
        return { success: false, error: data.error || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration network error:', error);
      return { success: false, error: 'Network error' };
    }
  }, []);

  // Helper function to handle API requests with automatic token refresh
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token');
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 401) {
      // Try to refresh user data
      await refreshUserData(false);
      // If user is still null after refresh, token is truly invalid
      if (!localStorage.getItem('token')) {
        throw new Error('Authentication expired');
      }
    }

    return response;
  }, [refreshUserData]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      refreshUserData, 
      authenticatedFetch 
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 