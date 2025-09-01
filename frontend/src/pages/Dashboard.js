import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <h1>Welcome, {user?.name}!</h1>
        <p>You're now logged into XBLADE</p>
        
        <div className="user-info">
          <h3>Your Profile Information</h3>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>GamerTag:</strong> {user?.gamerTag}</p>
          <p><strong>Role:</strong> {user?.role}</p>
        </div>
      </div>
    </div>
  );
};



export default Dashboard;