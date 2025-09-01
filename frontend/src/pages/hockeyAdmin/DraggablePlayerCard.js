import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const DraggablePlayerCard = ({ player, inClub = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useDraggable({
    id: player._id,
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
      className={`player-card ${inClub ? 'in-club' : 'free-agent'} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="player-name">{player.name}</div>
      <div className="player-details">
        <span className="player-position">{player.position}</span>
        {player.jerseyNumber && <span className="player-jersey">#{player.jerseyNumber}</span>}
      </div>
    </div>
  );
};

export default DraggablePlayerCard;