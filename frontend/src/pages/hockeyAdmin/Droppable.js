import React from 'react';
import { useDroppable } from '@dnd-kit/core';

const Droppable = ({ id, children }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div ref={setNodeRef} className={`droppable-area ${isOver ? 'drop-target' : ''}`}>
      {children}
    </div>
  );
};

export default Droppable;