import React from 'react';

export const StatusBadge = ({ status, onClick, clickable = false }) => {
  const isActive = status === 'Active';
  return (
    <span
      className={`badge ${isActive ? 'badge-active' : 'badge-inactive'} ${clickable ? 'badge-interactive' : ''}`}
      onClick={onClick}
      title={clickable ? `Click to toggle status to ${isActive ? 'Inactive' : 'Active'}` : undefined}
      style={{ cursor: clickable ? 'pointer' : 'default' }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: isActive ? 'var(--success)' : 'var(--danger)',
        }}
      />
      <span>{status}</span>
    </span>
  );
};

export default StatusBadge;
