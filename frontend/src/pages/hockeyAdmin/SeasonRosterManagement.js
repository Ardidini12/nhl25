import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import Droppable from './Droppable';
import DraggableClubCard from './DraggableClubCard';
import DraggablePlayerCard from './DraggablePlayerCard';

const SeasonRosterManagement = ({ 
  season, 
  seasonClubs, 
  seasonPlayers, 
  availableClubs, 
  availablePlayers, 
  onAssignClub, 
  onRemoveClub, 
  onAssignPlayer, 
  onRemovePlayer, 
  onPlayerClubAssignment,
  onRefresh, 
  loading,
  setSeasonClubs,
  setAvailableClubs,
  setSeasonPlayers
}) => {
  const [activeItem, setActiveItem] = useState(null);
  const [dragMessage, setDragMessage] = useState('');
  const API_BASE = 'http://localhost:8080/api/v1';

    // Handle club assignment/unassignment  
  const handleClubAssignment = async (clubId, assign = true) => {
    try {
      // Normalise id to string for reliable comparisons
      const cid = String(clubId);
      console.log('Handling club assignment:', { clubId: cid, assign, seasonId: season._id });
      
      if (assign) {
        // Check if club is already assigned to prevent duplicates
        const alreadyAssigned = seasonClubs.find(c => c._id?.toString() === cid);
        if (alreadyAssigned) {
          setDragMessage('Club is already assigned to this season');
          setTimeout(() => setDragMessage(''), 3000);
          return;
        }
        
        // Backend call - try updating first, then create if needed
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
          // Pass normalised id to parent handler to ensure matching types
          await onAssignClub(cid);
        }
      } else {
        // Check if club is actually assigned before unassigning
        const isCurrentlyAssigned = seasonClubs.find(c => c._id?.toString() === cid);
        if (!isCurrentlyAssigned) {
          setDragMessage('Club is not currently assigned to this season');
          setTimeout(() => setDragMessage(''), 3000);
          return;
        }
        
        // Backend call - mark as unassigned instead of removing completely
        const response = await fetch(`${API_BASE}/admin/season-management/clubs/${season._id}/${cid}/assignment`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ isAssigned: false })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      setDragMessage(`Club ${assign ? 'assigned' : 'unassigned'} successfully!`);
      setTimeout(() => setDragMessage(''), 2000);
    } catch (error) {
      console.error('Club assignment failed:', error);
      setDragMessage(`Failed to ${assign ? 'assign' : 'unassign'} club: ${error.message}`);
      setTimeout(() => setDragMessage(''), 5000);
    }
  };

  // Handle player to club assignment
  const handlePlayerToClub = async (playerId, clubId) => {
    // Ensure IDs are strings for consistent comparison
    const pid = String(playerId);
    const cid = clubId ? String(clubId) : null;
    try {
      console.log('Handling player assignment:', { playerId: pid, clubId: cid });

      // Call the backend operation to persist the change
      await onPlayerClubAssignment(pid, cid);

      setDragMessage(`Player ${cid ? 'assigned to club' : 'moved to free agents'} successfully!`);
      setTimeout(() => setDragMessage(''), 2000);
      
      // Force refresh to ensure UI updates
      onRefresh();
    } catch (error) {
      console.error('Failed to assign player to club:', error);
      setDragMessage(`Failed to assign player: ${error.message}`);
      setTimeout(() => setDragMessage(''), 5000);
    }
  };

  // Drag and drop handlers
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduce distance for more responsive drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    // Convert the active identifier to a string so it can be reliably compared
    const activeId = String(active.id);
    
    console.log('Drag start:', { activeId, availableClubs: availableClubs.length, seasonClubs: seasonClubs.length, seasonPlayers: seasonPlayers.length });
    
    // Find the item being dragged (could be club or player)
    // Find the club or player by comparing stringified IDs. Without
    // toString() Mongoose ObjectIds will not strictly equal the string
    const club = [...availableClubs, ...seasonClubs].find(c => c._id?.toString() === activeId);
    const player = seasonPlayers.find(p => p._id?.toString() === activeId);
    
    console.log('Found item:', { club: club?.name, player: player?.name });
    
    setActiveItem(club || player);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveItem(null);

    if (!over) return;
    // In some cases, the overlay droppable will match the player's own id; allow different target parsing below

    // Normalise ids to string values for comparison
    const activeId = active?.id?.toString?.() || String(active.id);
    const overId = over?.id?.toString?.() || String(over.id);

    console.log('Drag end:', { activeId, overId });

    // Check if we're dragging a club or player
    const draggedClub = [...availableClubs, ...seasonClubs].find(c => c._id?.toString() === activeId);
    const draggedPlayer = seasonPlayers.find(p => p._id?.toString() === activeId);

    console.log('Dragged item:', { 
      club: draggedClub?.name, 
      player: draggedPlayer?.name,
      isClub: !!draggedClub,
      isPlayer: !!draggedPlayer
    });

    if (draggedClub) {
      // Handle club assignments
      if (overId === 'assigned-clubs') {
        // Check if club is available (not yet assigned)
        const isAvailable = availableClubs.find(c => c._id?.toString() === activeId);
        console.log('Club to assigned:', { clubName: draggedClub.name, isAvailable });
        if (isAvailable) {
          handleClubAssignment(activeId, true);
        }
      } else if (overId === 'available-clubs') {
        // Check if club is currently assigned
        const isAssigned = seasonClubs.find(c => c._id?.toString() === activeId);
        console.log('Club to unassigned:', { clubName: draggedClub.name, isAssigned });
        if (isAssigned) {
          handleClubAssignment(activeId, false);
        }
      }
    } else if (draggedPlayer) {
      // Handle player assignments
      if (overId === 'free-agents') {
        console.log('Player to free agents:', { playerName: draggedPlayer.name });
        handlePlayerToClub(activeId, null);
      } else if (overId && overId.indexOf('club-') === 0) {
        const clubId = overId.substring('club-'.length);
        console.log('Player to club:', { playerName: draggedPlayer.name, clubId });
        handlePlayerToClub(activeId, clubId);
      }
    }
  };

  // Group players by club - recalculate whenever seasonPlayers changes
  const playersByClub = React.useMemo(() => {
    return seasonPlayers.reduce((acc, player) => {
      const clubId = player.currentClub?._id || 'free-agents';
      if (!acc[clubId]) {
        acc[clubId] = [];
      }
      acc[clubId].push(player);
      return acc;
    }, {});
  }, [seasonPlayers]);

  const freeAgents = playersByClub['free-agents'] || [];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveItem(null)}
    >
      <div className="simple-roster-management">
        <h4>Season Roster - Drag & Drop</h4>
        
        {dragMessage && (
          <div className={`drag-message ${dragMessage.includes('Failed') ? 'error' : 'success'}`}>
            {dragMessage}
          </div>
        )}
        
        <div className="roster-sections">
          {/* Available Clubs (not yet in season) */}
          <div className="roster-section">
            <h5>Available Clubs</h5>
            <Droppable id="available-clubs">
              <div className="club-cards">
                {availableClubs.map(club => (
                  <DraggableClubCard key={club._id} club={club} players={[]} assigned={false} />
                ))}
                {availableClubs.length === 0 && (
                  <p className="empty-message">No clubs available to add</p>
                )}
              </div>
            </Droppable>
          </div>

          {/* Season Clubs (assigned only) */}
          <div className="roster-section">
            <h5>Assigned Clubs</h5>
            <Droppable id="assigned-clubs">
              <div className="club-cards">
                {seasonClubs.map(club => {
                  const clubPlayers = playersByClub[club._id] || [];
                  return (
                    <DraggableClubCard key={club._id} club={club} players={clubPlayers} assigned={true} />
                  );
                })}
                {seasonClubs.length === 0 && (
                  <p className="empty-message">No clubs assigned to this season</p>
                )}
              </div>
            </Droppable>
          </div>

          {/* Free Agents */}
          <div className="roster-section">
            <h5>Free Agents</h5>
            <Droppable id="free-agents">
              <div className="player-cards">
                {freeAgents.map(player => (
                  <DraggablePlayerCard key={player._id} player={player} />
                ))}
                {freeAgents.length === 0 && (
                  <p className="empty-message">No free agents</p>
                )}
              </div>
            </Droppable>
          </div>
        </div>
        
        <DragOverlay 
          dropAnimation={null}
          style={{
            cursor: 'grabbing'
          }}
        >
          {activeItem && (
            activeItem.position ? (
              <div className="player-card" style={{ 
                opacity: 1, 
                cursor: 'grabbing', 
                pointerEvents: 'none',
                boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                border: '2px solid #667eea',
                background: 'white',
                position: 'relative',
                zIndex: 1000
              }}>
                <div className="player-name">{activeItem.name}</div>
                <div className="player-details">
                  <span className="player-position">{activeItem.position}</span>
                  {activeItem.jerseyNumber && <span className="player-jersey">#{activeItem.jerseyNumber}</span>}
                </div>
              </div>
            ) : (
              <div className="club-card compact" style={{ 
                opacity: 1, 
                cursor: 'grabbing', 
                pointerEvents: 'none',
                boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                border: '2px solid #667eea',
                background: 'white',
                position: 'relative',
                zIndex: 1000
              }}>
                <div className="club-header">
                  <div className="club-info">
                    <h6>{activeItem.name}</h6>
                  </div>
                </div>
              </div>
            )
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default SeasonRosterManagement;
