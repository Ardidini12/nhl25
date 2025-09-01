import React from 'react';
import SeasonPanel from './SeasonPanel';

const LeagueDetails = ({ 
  league, 
  onBack, 
  seasons, 
  clubs, 
  players, 
  onRefresh, 
  loading 
}) => {
  return (
    <div className="league-details">
      <div className="league-header">
        <button onClick={onBack} className="btn-secondary">
          ← Back to Leagues
        </button>
        <h2>Manage Seasons for {league.name}</h2>
        {league.description && <p>{league.description}</p>}
      </div>

      <div className="league-tab-content">
          <SeasonPanel 
            league={league}
            seasons={seasons}
            clubs={clubs}
            players={players}
            onRefresh={onRefresh}
          />
      </div>
    </div>
  );
};

export default LeagueDetails;