import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Droppable from './Droppable';
import DraggablePlayerCard from './DraggablePlayerCard';

const DraggableClubCard = ({ club, players = [], assigned = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useDraggable({
    id: club._id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`club-card compact ${isDragging ? 'dragging' : ''} ${isExpanded ? 'expanded' : ''}`}
    >
      <div className="club-header" onClick={(e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
      }}>
        <div className="club-info">
          <h6>{club.name}</h6>
          {isExpanded && club.webUrl && <span className="club-url">{club.webUrl}</span>}
          {isExpanded && club.description && <p className="club-description">{club.description}</p>}
        </div>
        <div className="club-controls">
          <span className="players-count">{players.length} players</span>
          <button className="expand-btn" type="button">
            {isExpanded ? '▼' : '▶'}
          </button>
        </div>
      </div>
      
      {/* Drop zone for clubs - only show when expanded and club is assigned */}
      {assigned && isExpanded && (
        <Droppable id={`club-${club._id}`}>
          <div className="club-players">
            <div className="player-list-in-club">
              {players.map(player => (
                <DraggablePlayerCard key={player._id} player={player} inClub={true} />
              ))}
              {players.length === 0 && (
                <div className="empty-club">Drop players here</div>
              )}
            </div>
          </div>
        </Droppable>
      )}
      
      {/* Hidden drop zone for collapsed clubs - use display: none to completely remove from layout */}
      {assigned && !isExpanded && (
        <Droppable id={`club-${club._id}`}>
          <div style={{ display: 'none' }}></div>
        </Droppable>
      )}
    </div>
  );
};

export default DraggableClubCard;