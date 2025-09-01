import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';
import './XBHLViewer.css';

// Main XBHL Viewer Component
const XBHLViewer = () => {
  return (
    <div className="xbhl-viewer">
      <div className="xbhl-content">
        <h1>XBHL - Viewer</h1>
        <p>Explore XBHL</p>
        <PublicLeagueViewer />
      </div>
    </div>
  );
};

// Public League Viewer Component for regular users
const PublicLeagueViewer = () => {
  const [leagues, setLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:8080/api/v1';

  const fetchLeagues = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/public/leagues`);
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

  useEffect(() => {
    fetchLeagues();
  }, [fetchLeagues]);

  const handleLeagueSelect = (league) => {
    setSelectedLeague(league);
  };

  const handleBackToLeagues = () => {
    setSelectedLeague(null);
  };

  return (
    <div className="public-league-viewer">
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      {!selectedLeague ? (
        <div className="leagues-list">
          <h3>Available Leagues</h3>
          {leagues.length === 0 ? (
            <p>No leagues available at the moment.</p>
          ) : (
            <div className="league-cards">
              {leagues.map(league => (
                <div key={league._id} className="league-card" onClick={() => handleLeagueSelect(league)}>
                  <h4>{league.name}</h4>
                  {league.description && <p>{league.description}</p>}
                  <button className="btn-primary btn-small">View League</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <PublicLeagueDetails
          league={selectedLeague}
          onBack={handleBackToLeagues}
        />
      )}
    </div>
  );
};

// Public League Details Component
const PublicLeagueDetails = ({ league, onBack }) => {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:8080/api/v1';

  const fetchSeasons = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/public/leagues/${league._id}/seasons`);
      if (response.ok) {
        const seasonsData = await response.json();
        if (seasonsData.success) setSeasons(seasonsData.data);
      }
    } catch (error) {
      setError('Failed to fetch seasons');
    } finally {
      setLoading(false);
    }
  }, [league._id]);

  useEffect(() => {
    fetchSeasons();
  }, [fetchSeasons]);

  if (selectedSeason) {
    return (
      <PublicSeasonDetails
        season={selectedSeason}
        league={league}
        onBack={() => setSelectedSeason(null)}
        onBackToLeagues={onBack}
      />
    );
  }

  return (
    <div className="public-league-details">
      <div className="league-header">
        <button onClick={onBack} className="btn-secondary">
          ← Back to Leagues
        </button>
        <h3>{league.name}</h3>
        {league.description && <p>{league.description}</p>}
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      <div className="seasons-section">
        <h4>Seasons</h4>
        {seasons.length === 0 ? (
          <p>No seasons available for this league yet.</p>
        ) : (
          <div className="season-cards">
            {seasons.map(season => (
              <div key={season._id} className="season-card" onClick={() => setSelectedSeason(season)}>
                <h5>{season.name}</h5>
                <p>Duration: {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}</p>
                {season.description && <p>{season.description}</p>}
                <button className="btn-primary btn-small">View Season</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Public Season Details Component
const PublicSeasonDetails = ({ season, league, onBack, onBackToLeagues }) => {
  const [clubs, setClubs] = useState([]);
  const [players, setPlayers] = useState([]);
  const [activeTab, setActiveTab] = useState('clubs');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = 'http://localhost:8080/api/v1';
  const { socket } = useSocket();

  const fetchSeasonData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch assigned clubs for this season (same as admin panel)
      const clubsRes = await fetch(`${API_BASE}/admin/season-management/clubs/${season._id}?assigned=true`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (clubsRes.ok) {
        const clubsData = await clubsRes.json();
        if (clubsData.success) setClubs(clubsData.data);
      }

      // Fetch players for this season (same as admin panel)
      const playersRes = await fetch(`${API_BASE}/admin/season-management/players/${season._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (playersRes.ok) {
        const playersData = await playersRes.json();
        if (playersData.success) {
          console.log('XBHL Viewer: Fetched players data:', {
            total: playersData.data.length,
            playersWithClubs: playersData.data.filter(p => p.currentClub).length,
            freeAgents: playersData.data.filter(p => !p.currentClub).length,
            samplePlayer: playersData.data[0] ? {
              name: playersData.data[0].name,
              currentClub: playersData.data[0].currentClub
            } : null
          });
          setPlayers(playersData.data);
        }
      }
    } catch (error) {
      setError('Failed to fetch season data');
    } finally {
      setLoading(false);
    }
  }, [season._id]);

  // Socket subscriptions for real-time updates
  useEffect(() => {
    if (!socket || !season?._id) {
      console.log('XBHL Viewer: No socket or season ID:', { socket: !!socket, seasonId: season?._id });
      return;
    }

    console.log('XBHL Viewer: Joining season room:', season._id);
    socket.emit('season:join', season._id);

    const handlePlayerClubUpdated = ({ seasonId, playerId, currentClub }) => {
      console.log('XBHL Viewer: Player club updated event received:', { seasonId, playerId, currentClub });
      if (seasonId?.toString() === season._id?.toString()) {
        console.log('XBHL Viewer: Refreshing data for current season');
        setTimeout(() => fetchSeasonData(), 100); // Small delay to ensure backend update
      } else {
        console.log('XBHL Viewer: Event for different season, ignoring');
      }
    };

    const handleClubAssigned = ({ seasonId }) => {
      console.log('XBHL Viewer: Club assigned event received:', { seasonId });
      if (seasonId?.toString() === season._id?.toString()) {
        setTimeout(() => fetchSeasonData(), 100);
      }
    };

    const handlePlayerAssigned = ({ seasonId }) => {
      console.log('XBHL Viewer: Player assigned event received:', { seasonId });
      if (seasonId?.toString() === season._id?.toString()) {
        setTimeout(() => fetchSeasonData(), 100);
      }
    };

    socket.on('season:player-club-updated', handlePlayerClubUpdated);
    socket.on('season:club-assigned', handleClubAssigned);
    socket.on('season:player-assigned', handlePlayerAssigned);

    return () => {
      console.log('XBHL Viewer: Leaving season room:', season._id);
      socket.emit('season:leave', season._id);
      socket.off('season:player-club-updated', handlePlayerClubUpdated);
      socket.off('season:club-assigned', handleClubAssigned);
      socket.off('season:player-assigned', handlePlayerAssigned);
    };
  }, [socket, season?._id, fetchSeasonData]);

  useEffect(() => {
    fetchSeasonData();
  }, [fetchSeasonData]);

  return (
    <div className="public-season-details">
      <div className="season-header">
        <div className="breadcrumb">
          <button onClick={onBackToLeagues} className="btn-link">Leagues</button>
          <span> › </span>
          <button onClick={onBack} className="btn-link">{league.name}</button>
          <span> › </span>
          <span>{season.name}</span>
        </div>
        <h3>{season.name}</h3>
        <p>League: {league.name}</p>
        <p>Duration: {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading">Loading...</div>}

      <div className="season-tabs">
        <button 
          className={activeTab === 'clubs' ? 'active' : ''} 
          onClick={() => setActiveTab('clubs')}
        >
          Clubs
        </button>
        <button 
          className={activeTab === 'players' ? 'active' : ''} 
          onClick={() => setActiveTab('players')}
        >
          Players
        </button>
        <button 
          className={activeTab === 'roster' ? 'active' : ''} 
          onClick={() => setActiveTab('roster')}
        >
          Roster
        </button>
      </div>

      <div className="season-tab-content">
        {activeTab === 'clubs' && (
          <div className="clubs-list">
            <h4>Clubs in {season.name}</h4>
            {clubs.length === 0 ? (
              <p>No clubs assigned to this season yet.</p>
            ) : (
              <div className="club-items">
                {clubs.filter(club => club && club.name).map(club => (
                  <div key={club._id} className="club-item">
                    <h5>{club.name}</h5>
                    {club.webUrl && (
                      <p><a href={club.webUrl} target="_blank" rel="noopener noreferrer">View Logo</a></p>
                    )}
                    {club.description && <p>{club.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'players' && (
          <div className="players-list">
            <h4>Players in {season.name}</h4>
            {players.length === 0 ? (
              <p>No players assigned to this season yet.</p>
            ) : (
              <div className="player-items">
                {players.filter(player => player && player.name).map(player => (
                  <div key={player._id} className="player-item">
                    <h5>{player.name}</h5>
                    <p>Position: {player.position}</p>
                    {player.jerseyNumber && <p>Jersey: #{player.jerseyNumber}</p>}
                    <p>Club: {player.currentClub?.name || 'No Club'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'roster' && (
          <div className="roster-view">
            <h4>Team Rosters</h4>
            {clubs.filter(club => club && club.name).map(club => {
              const clubPlayers = players.filter(player => {
                if (!player || !player.currentClub) return false;
                
                // Handle different possible formats of currentClub
                let playerClubId;
                if (typeof player.currentClub === 'string') {
                  playerClubId = player.currentClub;
                } else if (player.currentClub._id) {
                  playerClubId = player.currentClub._id;
                }
                
                return playerClubId && playerClubId.toString() === club._id.toString();
              });
              
              console.log('XBHL Viewer: Club roster:', {
                clubName: club.name,
                clubId: club._id,
                playersCount: clubPlayers.length,
                allPlayers: players.length,
                samplePlayer: players[0] ? {
                  name: players[0].name,
                  currentClub: players[0].currentClub
                } : null
              });
              
              return (
                <div key={club._id} className="club-roster">
                  <h5>{club.name}</h5>
                  {clubPlayers.length > 0 ? (
                    <ul>
                      {clubPlayers.map(player => (
                        <li key={player._id}>
                          {player.name} - {player.position}
                          {player.jerseyNumber && ` (#${player.jerseyNumber})`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No players assigned to this club.</p>
                  )}
                </div>
              );
            })}
            
            {/* Show players with no club */}
            {(() => {
              const playersWithoutClub = players.filter(player => player && player.name && !player.currentClub);
              return playersWithoutClub.length > 0 && (
                <div className="club-roster">
                  <h5>Players without Club</h5>
                  <ul>
                    {playersWithoutClub.map(player => (
                      <li key={player._id}>
                        {player.name} - {player.position}
                        {player.jerseyNumber && ` (#${player.jerseyNumber})`}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default XBHLViewer;