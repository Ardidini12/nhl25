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
    // Always use a string ID for DnD so comparisons work reliably
    id: club._id?.toString(),
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
      style={{ ...style, position: 'relative' }}
      {...attributes}
      {...listeners}
      className={`club-card compact ${isDragging ? 'dragging' : ''} ${isExpanded ? 'expanded' : ''}`}
    >
      {/* Invisible, full-card droppable overlay so collapsed clubs accept drops */}
      {assigned && (
        <Droppable
          id={`club-${club._id}`}
          className="club-drop-overlay"
          style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'auto' }}
        >
          <div style={{ position: 'absolute', inset: 0, opacity: 0 }} />
        </Droppable>
      )}
      <div className="club-header" onClick={(e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
      }} style={{ position: 'relative', zIndex: 2 }}>
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
      
      {/* Visible content */}
      {assigned && isExpanded && (
        <div className="club-players" style={{ position: 'relative', zIndex: 1 }}>
          <div className="player-list-in-club">
            {players.map(player => (
              <DraggablePlayerCard key={player._id} player={player} inClub={true} />
            ))}
            {players.length === 0 && (
              <div className="empty-club">Drop players here</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DraggableClubCard;
