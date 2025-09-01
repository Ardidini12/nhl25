import React, { useState } from 'react';
import SeasonDetails from './SeasonDetails';

const SeasonPanel = ({ league, seasons, clubs, players, onRefresh }) => {
  const [seasonForm, setSeasonForm] = useState({
    name: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [editingSeason, setEditingSeason] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:8080/api/v1';

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!seasonForm.name.trim() || !seasonForm.startDate || !seasonForm.endDate) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/seasons`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...seasonForm,
          league: league._id
        })
      });

      const result = await response.json();
      if (result.success) {
        setSeasonForm({
          name: '',
          startDate: '',
          endDate: '',
          description: ''
        });
        onRefresh();
      } else {
        setError(result.error || 'Failed to create season');
      }
    } catch (error) {
      setError('Failed to create season');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (season) => {
    setEditingSeason({
      ...season,
      startDate: new Date(season.startDate).toISOString().split('T')[0],
      endDate: new Date(season.endDate).toISOString().split('T')[0]
    });
  };

  const handleCancelEdit = () => {
    setEditingSeason(null);
  };

  const handleUpdateSeason = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/seasons/${editingSeason._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingSeason.name,
          startDate: editingSeason.startDate,
          endDate: editingSeason.endDate,
          description: editingSeason.description,
          isActive: editingSeason.isActive
        })
      });

      const result = await response.json();
      if (result.success) {
        setEditingSeason(null);
        onRefresh();
      } else {
        setError(result.error || 'Failed to update season');
      }
    } catch (error) {
      setError('Failed to update season');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (seasonId) => {
    if (!window.confirm('Are you sure you want to delete this season? This will also delete all club and player assignments.')) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/seasons/${seasonId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        }
      });

      const result = await response.json();
      if (result.success) {
        onRefresh();
      } else {
        setError(result.error || 'Failed to delete season');
      }
    } catch (error) {
      setError('Failed to delete season');
    } finally {
      setLoading(false);
    }
  };

  const handleEnterSeason = (season) => {
    setSelectedSeason(season);
  };

  const handleBackToSeasons = () => {
    setSelectedSeason(null);
  };

  if (selectedSeason) {
    return (
      <SeasonDetails
        season={selectedSeason}
        league={league}
        clubs={clubs}
        players={players}
        onBack={handleBackToSeasons}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <div className="tab-content">
      <h2>Season Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {/* Create New Season */}
      <form onSubmit={handleSubmit} className="form">
        <h3>Create New Season</h3>
        <div className="form-row">
        <div className="form-group">
            <label>Season Name:</label>
          <input
            type="text"
            value={seasonForm.name}
            onChange={(e) => setSeasonForm({...seasonForm, name: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
            <label>Start Date:</label>
          <input
            type="date"
            value={seasonForm.startDate}
            onChange={(e) => setSeasonForm({...seasonForm, startDate: e.target.value})}
            required
          />
        </div>
        <div className="form-group">
            <label>End Date:</label>
          <input
            type="date"
            value={seasonForm.endDate}
            onChange={(e) => setSeasonForm({...seasonForm, endDate: e.target.value})}
            required
          />
          </div>
        </div>
        <div className="form-group">
          <label>Description (optional):</label>
          <textarea
            value={seasonForm.description}
            onChange={(e) => setSeasonForm({...seasonForm, description: e.target.value})}
            rows="2"
          />
        </div>
          <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Season'}
          </button>
      </form>

      {/* Update Existing Season */}
      {editingSeason && (
        <form onSubmit={handleUpdateSeason} className="form">
          <h3>Update Season</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Season Name:</label>
              <input
                type="text"
                value={editingSeason.name}
                onChange={(e) => setEditingSeason({...editingSeason, name: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Start Date:</label>
              <input
                type="date"
                value={editingSeason.startDate}
                onChange={(e) => setEditingSeason({...editingSeason, startDate: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date:</label>
              <input
                type="date"
                value={editingSeason.endDate}
                onChange={(e) => setEditingSeason({...editingSeason, endDate: e.target.value})}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description:</label>
            <textarea
              value={editingSeason.description || ''}
              onChange={(e) => setEditingSeason({...editingSeason, description: e.target.value})}
              rows="2"
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={editingSeason.isActive}
                onChange={(e) => setEditingSeason({...editingSeason, isActive: e.target.checked})}
              />
              Active
            </label>
          </div>
          <div className="form-buttons">
            <button type="button" onClick={handleCancelEdit} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Season'}
            </button>
          </div>
        </form>
      )}

      {/* List Existing Seasons */}
      <div className="data-table">
        <h3>Existing Seasons</h3>
        {seasons.length === 0 ? (
          <p>No seasons created yet.</p>
        ) : (
          seasons.map(season => (
            <div key={season._id} className="data-item">
              <div>
                <strong>{season.name}</strong>
                <span className={`status-badge ${season.isActive ? 'active' : 'inactive'}`}>
                  {season.isActive ? 'Active' : 'Inactive'}
                </span>
                <p>Duration: {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}</p>
                {season.description && <p>{season.description}</p>}
              </div>
              <div className="item-actions">
                <button onClick={() => handleEnterSeason(season)} className="btn-primary btn-small">
                  Manage Season
                </button>
                <button onClick={() => handleEdit(season)} className="btn-secondary btn-small">
                  Edit
                </button>
                <button onClick={() => handleDelete(season._id)} className="btn-danger btn-small">
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

export default SeasonPanel;