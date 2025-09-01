import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import SeasonRosterManagement from './SeasonRosterManagement';

const SeasonDetails = ({ season, league, clubs, players, onBack, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seasonClubs, setSeasonClubs] = useState([]);
  const [seasonPlayers, setSeasonPlayers] = useState([]);
  const [availableClubs, setAvailableClubs] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('clubs');
  const [newClub, setNewClub] = useState({ name: '', webUrl: '', description: '' });
  const [newPlayer, setNewPlayer] = useState({ name: '', position: '', jerseyNumber: '' });
  const [editingClub, setEditingClub] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);

  const API_BASE = 'http://localhost:8080/api/v1';
  const { socket } = useSocket();

  const fetchSeasonData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      };

      // Variables to store fetched data
      let assignedClubs = [];
      let unassignedClubs = [];

      // Fetch ALL clubs in this season (both assigned and unassigned)
      const allClubsRes = await fetch(`${API_BASE}/admin/season-management/clubs/${season._id}`, { headers });
      if (allClubsRes.ok) {
        const allClubsData = await allClubsRes.json();
        if (allClubsData.success) {
          // Separate assigned and unassigned clubs
          assignedClubs = allClubsData.data.filter(club => club.isAssigned !== false);
          unassignedClubs = allClubsData.data.filter(club => club.isAssigned === false);
          
          console.log('Season clubs data:', {
            total: allClubsData.data.length,
            assigned: assignedClubs.length,
            unassigned: unassignedClubs.length,
            allClubs: allClubsData.data.map(c => ({ name: c.name, isAssigned: c.isAssigned }))
          });
          
          setSeasonClubs(assignedClubs);
        }
      }

      // Fetch players assigned to this season
      const playersRes = await fetch(`${API_BASE}/admin/season-management/players/${season._id}`, { headers });
      if (playersRes.ok) {
        const playersData = await playersRes.json();
        if (playersData.success) {
          console.log('Fetched season players:', {
            total: playersData.data.length,
            playersWithClubs: playersData.data.filter(p => p.currentClub).length,
            freeAgents: playersData.data.filter(p => !p.currentClub).length,
            samplePlayer: playersData.data[0] ? {
              name: playersData.data[0].name,
              currentClub: playersData.data[0].currentClub
            } : null
          });
          setSeasonPlayers(playersData.data);
        }
      }

      // Fetch truly available clubs for this season (those not in the season at all)
      const availClubsRes = await fetch(`${API_BASE}/admin/season-management/clubs/available/${season._id}`, { headers });
      if (availClubsRes.ok) {
        const availClubsData = await availClubsRes.json();
        if (availClubsData.success) {
          // Combine unassigned clubs from season with truly available clubs
          const allAvailableClubs = [...unassignedClubs, ...availClubsData.data];
          
          // Deduplicate by _id to prevent duplicate clubs
          const uniqueAvailableClubs = allAvailableClubs.filter((club, index, self) => 
            index === self.findIndex(c => c._id === club._id)
          );
          
          console.log('Available clubs:', {
            unassignedFromSeason: unassignedClubs.length,
            trulyAvailable: availClubsData.data.length,
            combined: uniqueAvailableClubs.length
          });
          
          setAvailableClubs(uniqueAvailableClubs);
        }
      } else {
        console.warn('Failed to fetch truly available clubs, using unassigned from season only');
        // If we can't fetch truly available clubs, just use unassigned from season
        setAvailableClubs(unassignedClubs);
      }

      // Fetch available players for this season (only those not already assigned)
      const availPlayersRes = await fetch(`${API_BASE}/admin/season-management/players/available/${season._id}`, { headers });
      if (availPlayersRes.ok) {
        const availPlayersData = await availPlayersRes.json();
        if (availPlayersData.success) {
          setAvailablePlayers(availPlayersData.data);
        }
      }

    } catch (error) {
      console.error('Error fetching season data:', error);
      setError('Failed to fetch season data');
    } finally {
      setLoading(false);
    }
  }, [season._id, API_BASE]);

  // Fetch season data on component mount
  useEffect(() => {
    fetchSeasonData();
  }, [fetchSeasonData]);

  // Socket subscriptions for real-time updates
  useEffect(() => {
    if (!socket || !season?._id) return;

    console.log('Joining season room:', season._id);
    socket.emit('season:join', season._id);

    const handleClubAssigned = ({ seasonId }) => {
      console.log('Socket: Club assigned', { seasonId });
      if (seasonId?.toString() === season._id?.toString()) fetchSeasonData();
    };
    const handleClubRemoved = ({ seasonId }) => {
      console.log('Socket: Club removed', { seasonId });
      if (seasonId?.toString() === season._id?.toString()) fetchSeasonData();
    };
    const handlePlayerAssigned = ({ seasonId }) => {
      console.log('Socket: Player assigned', { seasonId });
      if (seasonId?.toString() === season._id?.toString()) fetchSeasonData();
    };
    const handlePlayerRemoved = ({ seasonId }) => {
      console.log('Socket: Player removed', { seasonId });
      if (seasonId?.toString() === season._id?.toString()) fetchSeasonData();
    };
    const handlePlayerClubUpdated = ({ seasonId, playerId, currentClub }) => {
      console.log('Socket: Player club updated', { seasonId, playerId, currentClub });
      if (seasonId?.toString() !== season._id?.toString()) return;
      
      // Force refresh to get updated data from backend
      setTimeout(() => {
        console.log('Refreshing season data after player club update');
        fetchSeasonData();
        // Also refresh parent data to ensure XBHL viewer updates
        onRefresh();
      }, 100);
    };

    socket.on('season:club-assigned', handleClubAssigned);
    socket.on('season:club-removed', handleClubRemoved);
    socket.on('season:player-assigned', handlePlayerAssigned);
    socket.on('season:player-removed', handlePlayerRemoved);
    socket.on('season:player-club-updated', handlePlayerClubUpdated);

    return () => {
      console.log('Leaving season room:', season._id);
      socket.emit('season:leave', season._id);
      socket.off('season:club-assigned', handleClubAssigned);
      socket.off('season:club-removed', handleClubRemoved);
      socket.off('season:player-assigned', handlePlayerAssigned);
      socket.off('season:player-removed', handlePlayerRemoved);
      socket.off('season:player-club-updated', handlePlayerClubUpdated);
    };
  }, [socket, season?._id, fetchSeasonData, onRefresh]);

  const handleAssignClub = async (clubId) => {
    try {
      console.log('Assigning club:', { clubId, seasonId: season._id });
      
      // Check if club is already assigned to prevent duplicates
      const cid = clubId?.toString();
      const alreadyAssigned = seasonClubs.find(c => c._id?.toString() === cid);
      if (alreadyAssigned) {
        setError('Club is already assigned to this season');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      // Optimistic update - update UI immediately
      const clubToAssign = availableClubs.find(c => c._id?.toString() === cid);
      if (clubToAssign) {
        setAvailableClubs(prev => prev.filter(c => c._id?.toString() !== cid));
        setSeasonClubs(prev => [...prev, { ...clubToAssign, isAssigned: true }]);
      }

      // First try to update assignment status if club already exists in season as unassigned
      let assignmentSuccessful = false;
      try {
        const updateResponse = await fetch(`${API_BASE}/admin/season-management/clubs/${season._id}/${cid}/assignment`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isAssigned: true })
        });

        if (updateResponse.ok) {
          const updateResult = await updateResponse.json();
          if (updateResult.success) {
            assignmentSuccessful = true;
          }
        }
      } catch (updateError) {
        console.log('Update assignment failed, trying to create new assignment:', updateError.message);
      }

      // If updating assignment failed, try to create new assignment
      if (!assignmentSuccessful) {
        const response = await fetch(`${API_BASE}/admin/season-management/clubs`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            seasonId: season._id,
            clubId: cid
          })
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || 'Failed to assign club');
        }
      }
    } catch (error) {
      console.error('Error assigning club:', error);
      setError(`Failed to assign club: ${error.message}`);
      // Revert optimistic update on error
      fetchSeasonData();
      throw error;
    }
  };

  const handleRemoveClub = async (clubId) => {
    try {
      // Check if club is actually assigned before removing
      const cid = clubId?.toString();
      const isCurrentlyAssigned = seasonClubs.find(c => c._id?.toString() === cid);
      if (!isCurrentlyAssigned) {
        setError('Club is not currently assigned to this season');
        setTimeout(() => setError(''), 3000);
        return;
      }
      
      // Optimistic update - move club from assigned to available immediately
      const clubToRemove = seasonClubs.find(c => c._id?.toString() === cid);
      if (clubToRemove) {
        setSeasonClubs(prev => prev.filter(c => c._id?.toString() !== cid));
        // Check if club is already in available clubs to prevent duplicates
        setAvailableClubs(prev => {
          const alreadyInAvailable = prev.find(c => c._id?.toString() === cid);
          if (alreadyInAvailable) {
            return prev;
          }
          return [...prev, { ...clubToRemove, isAssigned: false }];
        });
      }

      // Mark as unassigned instead of deleting completely
      const response = await fetch(`${API_BASE}/admin/season-management/clubs/${season._id}/${cid}/assignment`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isAssigned: false })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to unassign club');
      }

      // Refresh parent data to ensure XBHL viewer updates
      onRefresh();
    } catch (error) {
      console.error('Error unassigning club:', error);
      setError(`Failed to unassign club: ${error.message}`);
      // Revert optimistic update on error
      fetchSeasonData();
      throw error;
    }
  };

  const handleAssignPlayer = async (playerId) => {
    try {
      // Optimistic update - update UI immediately
      // Find the player by comparing string values to account for ObjectId instances
      const playerToAssign = availablePlayers.find(p => p._id?.toString() === playerId?.toString());
      if (playerToAssign) {
        // Remove from available players and add to season players using string comparison
        setAvailablePlayers(prev => prev.filter(p => p._id?.toString() !== playerId?.toString()));
        setSeasonPlayers(prev => [...prev, { ...playerToAssign, isAssigned: true }]);
      }

      const pid = playerId?.toString();
      const response = await fetch(`${API_BASE}/admin/season-management/players`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          seasonId: season._id,
          playerId: pid
        })
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to assign player');
      }
    } catch (error) {
      console.error('Error assigning player:', error);
      setError(`Failed to assign player: ${error.message}`);
      // Revert optimistic update on error
      fetchSeasonData();
      throw error;
    }
  };

  const handleRemovePlayer = async (playerId) => {
    try {
      // Optimistic update - move player from assigned to available immediately
      const playerToRemove = seasonPlayers.find(p => p._id?.toString() === playerId?.toString());
      if (playerToRemove) {
        // Move back to available players using string comparison for ids
        setSeasonPlayers(prev => prev.filter(p => p._id?.toString() !== playerId?.toString()));
        setAvailablePlayers(prev => [...prev, { ...playerToRemove, isAssigned: false }]);
      }

      const pid = playerId?.toString();
      const response = await fetch(`${API_BASE}/admin/season-management/players/${season._id}/${pid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Failed to remove player');
      }
    } catch (error) {
      console.error('Error removing player:', error);
      setError(`Failed to remove player: ${error.message}`);
      // Revert optimistic update on error
      fetchSeasonData();
      throw error;
    }
  };

  // Handle player club assignment (roster management)
  const handlePlayerClubAssignment = async (playerId, clubId) => {
    try {
      console.log('Assigning player to club:', { playerId, clubId });

      const pid = playerId?.toString();
      const cid = clubId && clubId !== 'free-agents' ? clubId?.toString() : null;
      
      console.log('Making API call with:', { pid, cid });
      
      const response = await fetch(`${API_BASE}/admin/season-management/roster/players/${pid}/club`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentClub: cid
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign player to club');
      }

      const result = await response.json();
      console.log('Backend assignment result:', result);

      // Refresh data after successful backend update
      console.log('Refreshing data after player club assignment...');
      await fetchSeasonData();
      onRefresh();
    } catch (error) {
      console.error('Error updating player club assignment:', error);
      setError(`Failed to assign player to club: ${error.message}`);
      throw error;
    }
  };

  const handleCreateClub = async (e) => {
    e.preventDefault();
    if (!newClub.name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/season-management/clubs/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newClub,
          seasonId: season._id
        })
      });

      const result = await response.json();
      if (result.success) {
        setNewClub({ name: '', webUrl: '', description: '' });
        // Clear any existing error messages
        setError('');
        // Refresh season data to get updated club lists
        fetchSeasonData();
        onRefresh();
      } else {
        setError(result.error || 'Failed to create club');
      }
    } catch (error) {
      setError('Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayer = async (e) => {
    e.preventDefault();
    if (!newPlayer.name.trim() || !newPlayer.position.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/season-management/players/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newPlayer,
          seasonId: season._id
        })
      });

      const result = await response.json();
      if (result.success) {
        setNewPlayer({ name: '', position: '', jerseyNumber: '' });
        fetchSeasonData();
        onRefresh();
      } else {
        setError(result.error || 'Failed to create player');
      }
    } catch (error) {
      setError('Failed to create player');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClub = (club) => {
    setEditingClub({ ...club });
  };

  const handleUpdateClub = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/clubs/${editingClub._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingClub.name,
          webUrl: editingClub.webUrl,
          description: editingClub.description
        })
      });

      const result = await response.json();
      if (result.success) {
        setEditingClub(null);
        fetchSeasonData();
        onRefresh();
      } else {
        setError(result.error || 'Failed to update club');
      }
    } catch (error) {
      setError('Failed to update club');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClub = async (clubId) => {
    if (!window.confirm('Are you sure you want to delete this club?')) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/clubs/${clubId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        fetchSeasonData();
        onRefresh();
      } else {
        setError(result.error || 'Failed to delete club');
      }
    } catch (error) {
      setError('Failed to delete club');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlayer = (player) => {
    setEditingPlayer({ ...player });
  };

  const handleUpdatePlayer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/players/${editingPlayer._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingPlayer.name,
          position: editingPlayer.position,
          jerseyNumber: editingPlayer.jerseyNumber
        })
      });

      const result = await response.json();
      if (result.success) {
        setEditingPlayer(null);
        fetchSeasonData();
        onRefresh();
      } else {
        setError(result.error || 'Failed to update player');
      }
    } catch (error) {
      setError('Failed to update player');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlayer = async (playerId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/admin/players/${playerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        fetchSeasonData();
        onRefresh();
      } else {
        setError(result.error || 'Failed to delete player');
      }
    } catch (error) {
      setError('Failed to delete player');
    } finally {
      setLoading(false);
    }
  };

  // Available clubs and players are now fetched from API and stored in state

  return (
    <div className="season-details">
      <div className="season-header">
        <button onClick={onBack} className="btn-secondary">
          ← Back to Seasons
        </button>
        <h3>{season.name} - Club & Player Management</h3>
        <p>League: {league.name}</p>
        <p>Duration: {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      <div className="league-tabs">
        <button 
          className={activeTab === 'clubs' ? 'active' : ''} 
          onClick={() => setActiveTab('clubs')}
        >
          Club Management
        </button>
        <button 
          className={activeTab === 'players' ? 'active' : ''} 
          onClick={() => setActiveTab('players')}
        >
          Player Management
        </button>
        <button 
          className={activeTab === 'roster' ? 'active' : ''} 
          onClick={() => setActiveTab('roster')}
        >
          Roster View
        </button>
      </div>

      <div className="league-tab-content">
        {activeTab === 'clubs' && (
          <div className="season-management">
            {/* Club Creation Form */}
            <form onSubmit={(e) => handleCreateClub(e)} className="form">
              <h3>Create New Club</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    value={newClub.name} 
                    onChange={(e) => setNewClub({ ...newClub, name: e.target.value })} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Website URL</label>
                  <input 
                    type="text" 
                    value={newClub.webUrl} 
                    onChange={(e) => setNewClub({ ...newClub, webUrl: e.target.value })} 
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    value={newClub.description} 
                    onChange={(e) => setNewClub({ ...newClub, description: e.target.value })} 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="btn"
                disabled={loading}
              >
                Create
              </button>
            </form>

            {/* Edit Club Modal */}
            {editingClub && (
              <div className="modal-overlay">
                <div className="modal">
                  <form onSubmit={handleUpdateClub}>
                    <h3>Edit Club</h3>
                    <div className="form-group">
                      <label>Name</label>
                      <input 
                        type="text" 
                        value={editingClub.name} 
                        onChange={(e) => setEditingClub({ ...editingClub, name: e.target.value })} 
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Website URL</label>
                      <input 
                        type="text" 
                        value={editingClub.webUrl || ''} 
                        onChange={(e) => setEditingClub({ ...editingClub, webUrl: e.target.value })} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea 
                        value={editingClub.description || ''} 
                        onChange={(e) => setEditingClub({ ...editingClub, description: e.target.value })} 
                      />
                    </div>
                    <div className="modal-actions">
                      <button type="button" onClick={() => setEditingClub(null)} className="btn btn-secondary">
                        Cancel
                      </button>
                      <button type="submit" className="btn" disabled={loading}>
                        Update
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Club List */}
            <div className="club-list">
              <h3>Season Clubs</h3>
              {seasonClubs.length === 0 ? (
                <p>No clubs assigned to this season yet.</p>
              ) : (
                seasonClubs.map((club) => (
                  <div className="item-card" key={club._id}>
                    <div className="item-info">
                      <h5>{club.name}</h5>
                      {club.webUrl && <p>{club.webUrl}</p>}
                      {club.description && <p>{club.description}</p>}
                    </div>
                    <div className="item-actions">
                      <button 
                        className="btn btn-small btn-secondary"
                        onClick={() => handleEditClub(club)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-small btn-danger"
                        onClick={() => handleRemoveClub(club._id)}
                        disabled={loading}
                      >
                        Unassign
                      </button>
                      <button 
                        className="btn btn-small btn-danger"
                        onClick={() => handleDeleteClub(club._id)}
                        disabled={loading}
                        style={{ marginLeft: '5px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Available Clubs */}
            <div className="available-list">
              <h3>Available Clubs</h3>
              {availableClubs.length === 0 ? (
                <p>No clubs available to add.</p>
              ) : (
                availableClubs.map((club) => (
                  <div className="item-card" key={club._id}>
                    <div className="item-info">
                      <h5>{club.name}</h5>
                      {club.webUrl && <p>{club.webUrl}</p>}
                      {club.description && <p>{club.description}</p>}
                    </div>
                    <div className="item-actions">
                      <button 
                        className="btn btn-small btn-primary"
                        onClick={() => handleAssignClub(club._id)}
                        disabled={loading}
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'players' && (
          <div className="season-management">
            {/* Player Creation Form */}
            <form onSubmit={(e) => handleCreatePlayer(e)} className="form">
              <h3>Create New Player</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Name</label>
                  <input 
                    type="text" 
                    value={newPlayer.name} 
                    onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Position</label>
                  <input 
                    type="text" 
                    value={newPlayer.position} 
                    onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Jersey Number</label>
                  <input 
                    type="number" 
                    value={newPlayer.jerseyNumber} 
                    onChange={(e) => setNewPlayer({ ...newPlayer, jerseyNumber: e.target.value })}
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="btn"
                disabled={loading}
              >
                Create
              </button>
            </form>

            {/* Edit Player Modal */}
            {editingPlayer && (
              <div className="modal-overlay">
                <div className="modal">
                  <form onSubmit={handleUpdatePlayer}>
                    <h3>Edit Player</h3>
                    <div className="form-group">
                      <label>Name</label>
                      <input 
                        type="text" 
                        value={editingPlayer.name} 
                        onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })} 
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Position</label>
                      <input 
                        type="text" 
                        value={editingPlayer.position} 
                        onChange={(e) => setEditingPlayer({ ...editingPlayer, position: e.target.value })} 
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Jersey Number</label>
                      <input 
                        type="number" 
                        value={editingPlayer.jerseyNumber || ''} 
                        onChange={(e) => setEditingPlayer({ ...editingPlayer, jerseyNumber: e.target.value })} 
                      />
                    </div>
                    <div className="modal-actions">
                      <button type="button" onClick={() => setEditingPlayer(null)} className="btn btn-secondary">
                        Cancel
                      </button>
                      <button type="submit" className="btn" disabled={loading}>
                        Update
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Player List */}
            <div className="player-list">
              <h3>Season Players</h3>
              {seasonPlayers.length === 0 ? (
                <p>No players assigned to this season yet.</p>
              ) : (
                seasonPlayers.map((player) => (
                  <div className="item-card" key={player._id}>
                    <div className="item-info">
                      <h5>{player.name}</h5>
                      <p>Position: {player.position}</p>
                      {player.jerseyNumber && <p>Jersey #: {player.jerseyNumber}</p>}
                    </div>
                    <div className="item-actions">
                      <button 
                        className="btn btn-small btn-secondary"
                        onClick={() => handleEditPlayer(player)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn btn-small btn-danger"
                        onClick={() => handleRemovePlayer(player._id)}
                        disabled={loading}
                      >
                        Remove
                      </button>
                      <button 
                        className="btn btn-small btn-danger"
                        onClick={() => handleDeletePlayer(player._id)}
                        disabled={loading}
                        style={{ marginLeft: '5px' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Available Players */}
            <div className="available-list">
              <h3>Available Players</h3>
              {availablePlayers.length === 0 ? (
                <p>No players available to add.</p>
              ) : (
                availablePlayers.map((player) => (
                  <div className="item-card" key={player._id}>
                    <div className="item-info">
                      <h5>{player.name}</h5>
                      <p>Position: {player.position}</p>
                      {player.jerseyNumber && <p>Jersey #: {player.jerseyNumber}</p>}
                    </div>
                    <div className="item-actions">
                      <button 
                        className="btn btn-small btn-primary"
                        onClick={() => handleAssignPlayer(player._id)}
                        disabled={loading}
                      >
                        Assign
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'roster' && (
          <SeasonRosterManagement
            season={season}
            seasonClubs={seasonClubs}
            seasonPlayers={seasonPlayers}
            availableClubs={availableClubs}
            availablePlayers={availablePlayers}
            onAssignClub={handleAssignClub}
            onRemoveClub={handleRemoveClub}
            onAssignPlayer={handleAssignPlayer}
            onRemovePlayer={handleRemovePlayer}
            onPlayerClubAssignment={handlePlayerClubAssignment}
            onRefresh={fetchSeasonData}
            loading={loading}
            setSeasonClubs={setSeasonClubs}
            setAvailableClubs={setAvailableClubs}
            setSeasonPlayers={setSeasonPlayers}
          />
        )}
      </div>
    </div>
  );
};

export default SeasonDetails;
