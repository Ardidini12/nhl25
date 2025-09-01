import React, { useState, useEffect, useCallback } from 'react';
import './HockeyAdminPanel.css';
import LeagueManagement from './hockeyAdmin/LeagueManagement';
import LeagueDetails from './hockeyAdmin/LeagueDetails';

const HockeyAdminPanel = () => {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // League-specific data
  const [seasons, setSeasons] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [players, setPlayers] = useState([]);

  const API_BASE = 'http://localhost:8080/api/v1';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  const fetchLeagues = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/admin/leagues`, { 
        headers: getAuthHeaders() 
      });
      
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setError('Session expired. Please log in again.');
        return;
      }

      const result = await response.json();
      if (result.success) {
        setLeagues(result.data);
      } else {
        setError('Failed to load leagues');
      }
    } catch (error) {
      setError('Failed to fetch leagues. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeagueData = useCallback(async (leagueId) => {
    setLoading(true);
    setError('');
    
    try {
      const headers = getAuthHeaders();
      
      // Fetch seasons
      const seasonsRes = await fetch(`${API_BASE}/admin/seasons?leagueId=${leagueId}`, { headers });
      if (seasonsRes.ok) {
        const seasonsData = await seasonsRes.json();
        if (seasonsData.success) setSeasons(seasonsData.data);
      }

      // Fetch clubs
      const clubsRes = await fetch(`${API_BASE}/admin/clubs`, { headers });
      if (clubsRes.ok) {
        const clubsData = await clubsRes.json();
        if (clubsData.success) setClubs(clubsData.data);
      }

      // Fetch players
      const playersRes = await fetch(`${API_BASE}/admin/players`, { headers });
      if (playersRes.ok) {
        const playersData = await playersRes.json();
        if (playersData.success) setPlayers(playersData.data);
      }

    } catch (error) {
      setError('Failed to load league data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  useEffect(() => {
    if (selectedLeague) {
      fetchLeagueData(selectedLeague._id);
    }
  }, [selectedLeague, fetchLeagueData]);

  const handleLeagueSelect = (league) => {
    setSelectedLeague(league);
  };

  const handleBackToLeagues = () => {
    setSelectedLeague(null);
    setSeasons([]);
    setClubs([]);
    setPlayers([]);
  };

  const refreshData = () => {
    fetchLeagues();
    if (selectedLeague) {
      fetchLeagueData(selectedLeague._id);
    }
  };

  return (
    <div className="hockey-admin-panel">
      <h1>XBHL Management</h1>
      
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      {!selectedLeague ? (
        <LeagueManagement 
          leagues={leagues} 
          onRefresh={refreshData}
          onLeagueSelect={handleLeagueSelect}
          loading={loading}
        />
      ) : (
        <LeagueDetails
          league={selectedLeague}
          onBack={handleBackToLeagues}
          seasons={seasons}
          clubs={clubs}
          players={players}
          onRefresh={refreshData}
          loading={loading}
        />
      )}
    </div>
  );
};

export default HockeyAdminPanel;