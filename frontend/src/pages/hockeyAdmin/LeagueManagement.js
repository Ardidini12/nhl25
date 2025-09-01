import React, { useState } from 'react';

const LeagueManagement = ({ leagues, onRefresh, onLeagueSelect, loading }) => {
  const [leagueForm, setLeagueForm] = useState({ name: '', description: '' });
  const [editingLeague, setEditingLeague] = useState(null);
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:8080/api/v1';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!leagueForm.name.trim()) return;

    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/leagues`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(leagueForm)
      });

      const result = await response.json();
      if (result.success) {
        setLeagueForm({ name: '', description: '' });
        onRefresh();
      } else {
        setError(result.error || 'Failed to create league');
      }
    } catch (error) {
      setError('Failed to create league');
    }
  };

  const handleEdit = (league) => {
    setEditingLeague({ ...league });
  };

  const handleCancelEdit = () => {
    setEditingLeague(null);
  };

  const handleUpdateLeague = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/leagues/${editingLeague._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingLeague.name,
          description: editingLeague.description,
          isActive: editingLeague.isActive
        })
      });

      const result = await response.json();
      if (result.success) {
        setEditingLeague(null);
        onRefresh();
      } else {
        setError(result.error || 'Failed to update league');
      }
    } catch (error) {
      setError('Failed to update league');
    }
  };

  const handleDelete = async (leagueId) => {
    if (!window.confirm('Are you sure you want to delete this league? This will also delete all its seasons and associations.')) return;

    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/leagues/${leagueId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });

      const result = await response.json();
      if (result.success) {
        onRefresh();
      } else {
        setError(result.error || 'Failed to delete league');
      }
    } catch (error) {
      setError('Failed to delete league');
    }
  };

  return (
    <div className="league-management">
      <h2>League Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="form">
        <h3>Create New League</h3>
        <div className="form-group">
          <label>League Name:</label>
          <input
            type="text"
            value={leagueForm.name}
            onChange={(e) => setLeagueForm({...leagueForm, name: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
          <label>Description (optional):</label>
          <textarea
            value={leagueForm.description}
            onChange={(e) => setLeagueForm({...leagueForm, description: e.target.value})}
            rows="3"
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create League'}
          </button>
      </form>

      {/* Update Existing League */}
      {editingLeague && (
        <form onSubmit={handleUpdateLeague} className="form">
          <h3>Update League</h3>
          <div className="form-group">
            <label>League Name:</label>
            <input
              type="text"
              value={editingLeague.name}
              onChange={(e) => setEditingLeague({...editingLeague, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={editingLeague.description || ''}
              onChange={(e) => setEditingLeague({...editingLeague, description: e.target.value})}
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={editingLeague.isActive}
                onChange={(e) => setEditingLeague({...editingLeague, isActive: e.target.checked})}
              />
              Active
            </label>
          </div>
          <div className="form-buttons">
            <button type="button" onClick={handleCancelEdit} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update League'}
            </button>
          </div>
        </form>
      )}

      <div className="data-table">
        <h3>Existing Leagues</h3>
        {leagues.length === 0 ? (
          <p>No leagues created yet.</p>
        ) : (
          leagues.map(league => (
            <div key={league._id} className="data-item">
              <div>
                <strong>{league.name}</strong>
                {league.description && <p>{league.description}</p>}
                <p>Created: {new Date(league.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="item-actions">
                <button onClick={() => onLeagueSelect(league)} className="btn-primary btn-small">
                  Enter League
                </button>
                <button onClick={() => handleEdit(league)} className="btn-secondary btn-small">
                  Edit
                </button>
                <button onClick={() => handleDelete(league._id)} className="btn-danger btn-small">
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LeagueManagement;