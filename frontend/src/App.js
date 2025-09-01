import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConnectionProvider } from './contexts/ConnectionContext';
import { SocketProvider } from './contexts/SocketContext';
import Navbar from './components/Navbar';
import ConnectionStatus from './components/ConnectionStatus';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import XBHLViewer from './pages/XBHLViewer';
import AdminPanel from './pages/AdminPanel';
import HockeyAdminPanel from './pages/HockeyAdminPanel';

import './App.css';

// Component to handle route persistence
const RoutePersistence = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Only save routes for authenticated users and avoid saving auth routes
    if (user && !['/login', '/register', '/'].includes(location.pathname)) {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location, user]);

  return children;
};

function App() {
  const PrivateRoute = ({ children }) => {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
  };

  const AdminRoute = ({ children }) => {
    const { user } = useAuth();
    return user && user.role === 'admin' ? children : <Navigate to="/dashboard" />;
  };

  const AppRoutes = () => {
    const { user, loading } = useAuth();
    
    // If still loading, show nothing
    if (loading) {
      return <div className="loading">Loading...</div>;
    }

    // If user is authenticated, check for last route only if they're not already on a valid route
    if (user) {
      const currentPath = window.location.pathname;
      const lastRoute = localStorage.getItem('lastRoute');
      
      // If last route was admin panel and user is no longer admin, redirect to dashboard
      if (lastRoute === '/admin' && user.role !== 'admin') {
        localStorage.removeItem('lastRoute');
        return <Navigate to="/dashboard" />;
      }
      
      // Only redirect to last route if current path is not already a valid authenticated route
      if (lastRoute && 
          lastRoute !== '/' && 
          lastRoute !== '/login' && 
          lastRoute !== '/register' && 
          !['/dashboard', '/xbhl', '/admin'].includes(currentPath)) {
        return <Navigate to={lastRoute} />;
      }
    }

    return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/xbhl" element={
          <PrivateRoute>
            <XBHLViewer />
          </PrivateRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <AdminPanel />
          </AdminRoute>
        } />
        <Route path="/hockey-admin" element={
          <AdminRoute>
            <HockeyAdminPanel />
          </AdminRoute>
        } />
      </Routes>
    );
  };

  return (
    <ConnectionProvider>
      <AuthProvider>
        <SocketProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <div className="App">
              <ConnectionStatus />
              <Navbar />
              <RoutePersistence>
                <AppRoutes />
              </RoutePersistence>
            </div>
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ConnectionProvider>
  );
}

export default App; 