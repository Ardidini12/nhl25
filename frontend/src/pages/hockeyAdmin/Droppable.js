import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const Droppable = ({ id, children, className = '', style }) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`droppable-area ${isOver ? 'drop-target' : ''} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
};

export default Droppable;