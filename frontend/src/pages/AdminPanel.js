import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './AdminPanel.css';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [updating, setUpdating] = useState(false);
  
  const { user: currentUser, refreshUserData } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  // Check if current user is still admin on every render
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  // Redirect if not admin
  if (!currentUser || currentUser.role !== 'admin') {
    return null; // This will trigger the redirect in the useEffect
  }

  const fetchUsers = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8080/api/v1/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        setError('Session expired. Please log in again.');
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setLoading(false);
        return;
      }

      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        setError(`Failed to fetch users: ${errorData.error || errorData.message || 'Unknown error'}`);
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.data);
      } else {
        setError('Failed to load users data');
      }
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setError('Cannot connect to server. Please check if the backend is running.');
      } else {
        setError(`Network error: ${error.message}`);
      }
      console.error('Fetch users error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user._id);
    setEditFormData({
      name: user.name,
      email: user.email,
      gamerTag: user.gamerTag,
      role: user.role
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({});
    setError('');
  };

  const handleInputChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateUser = async (userId) => {
    try {
      setUpdating(true);
      setError('');
      
      // Warn user if they're changing their own role to user
      if (userId === currentUser._id && editFormData.role === 'user' && currentUser.role === 'admin') {
        if (!window.confirm('Warning: You are about to remove your own admin privileges. This will redirect you to the dashboard and you will no longer have access to the admin panel. Are you sure?')) {
          setUpdating(false);
          return;
        }
      }
      
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(`Failed to update user: ${errorData.error || errorData.message || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      
      // Update the local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { ...user, ...editFormData }
            : user
        )
      );
      
      // Check if this was a role change for the current user
      if (data.roleChanged && userId === currentUser._id) {
        // Refresh current user data
        await refreshUserData();
        
        // If role changed to user, redirect to dashboard
        if (editFormData.role === 'user') {
          navigate('/dashboard');
          return;
        }
      }
      
      setEditingUser(null);
      setEditFormData({});
    } catch (error) {
      setError(`Failed to update user: ${error.message}`);
      console.error('Update user error:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setError('');
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8080/api/v1/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(`Failed to delete user: ${errorData.error || errorData.message || 'Unknown error'}`);
          return;
        }

        fetchUsers();
      } catch (error) {
        setError(`Failed to delete user: ${error.message}`);
        console.error('Delete user error:', error);
      }
    }
  };

  if (loading) return <div className="admin-panel">Loading...</div>;

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      {error && <div className="error-message">{error}</div>}
      
      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>GamerTag</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td>
                  {editingUser === user._id ? (
                    <input
                      type="text"
                      value={editFormData.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={updating}
                    />
                  ) : (
                    user.name
                  )}
                </td>
                <td>
                  {editingUser === user._id ? (
                    <input
                      type="email"
                      value={editFormData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={updating}
                    />
                  ) : (
                    user.email
                  )}
                </td>
                <td>
                  {editingUser === user._id ? (
                    <input
                      type="text"
                      value={editFormData.gamerTag || ''}
                      onChange={(e) => handleInputChange('gamerTag', e.target.value)}
                      disabled={updating}
                    />
                  ) : (
                    user.gamerTag
                  )}
                </td>
                <td>
                  {editingUser === user._id ? (
                    <div>
                      <select
                        value={editFormData.role || 'user'}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                        disabled={updating}
                        className={user._id === currentUser._id ? 'current-user-role' : ''}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                      {user._id === currentUser._id && (
                        <small style={{ color: '#ff6b6b', display: 'block', marginTop: '4px' }}>
                          This is your role
                        </small>
                      )}
                    </div>
                  ) : (
                    user.role
                  )}
                </td>
                <td>
                  {editingUser === user._id ? (
                    <>
                      <button
                        onClick={() => handleUpdateUser(user._id)}
                        className="btn btn-small btn-success"
                        disabled={updating}
                      >
                        {updating ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="btn btn-small btn-secondary"
                        disabled={updating}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleEditClick(user)}
                      className="btn btn-small"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteUser(user._id)}
                    className="btn btn-small btn-danger"
                    disabled={editingUser === user._id}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPanel; 