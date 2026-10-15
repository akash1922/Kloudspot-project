import React from 'react';

export const StatusBadge = ({ status }) => {
  const isActive = status === 'Active';
  return (
    <span className={`badge ${isActive ? 'badge-active' : 'badge-inactive'}`}>
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: isActive ? 'var(--success)' : 'var(--danger)',
        }}
      />
      {status}
    </span>
  );
};

export default StatusBadge;
