import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusBadge from './StatusBadge';

describe('StatusBadge Component', () => {
  it('renders Active status with badge-active class', () => {
    render(<StatusBadge status="Active" />);
    const badge = screen.getByText('Active');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('.badge')).toHaveClass('badge-active');
  });

  it('renders Inactive status with badge-inactive class', () => {
    render(<StatusBadge status="Inactive" />);
    const badge = screen.getByText('Inactive');
    expect(badge).toBeInTheDocument();
    expect(badge.closest('.badge')).toHaveClass('badge-inactive');
  });

  it('fires onClick callback when clickable is true', () => {
    const handleClick = vi.fn();
    render(<StatusBadge status="Active" clickable={true} onClick={handleClick} />);
    const badge = screen.getByText('Active');
    fireEvent.click(badge);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
