import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './Pagination';

describe('Pagination Component', () => {
  it('renders nothing when totalElements is 0', () => {
    const { container } = render(
      <Pagination
        currentPage={0}
        pageSize={10}
        totalElements={0}
        totalPages={0}
        onPageChange={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders range information correctly for page 1', () => {
    render(
      <Pagination
        currentPage={0}
        pageSize={10}
        totalElements={25}
        totalPages={3}
        onPageChange={() => {}}
      />
    );
    expect(screen.getByText(/records/i)).toBeInTheDocument();
    expect(screen.getAllByText('25').length).toBeGreaterThanOrEqual(1);
  });

  it('triggers onPageChange when clicking page 2 button', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        currentPage={0}
        pageSize={10}
        totalElements={25}
        totalPages={3}
        onPageChange={handlePageChange}
      />
    );
    const page2Button = screen.getByRole('button', { name: '2' });
    fireEvent.click(page2Button);
    expect(handlePageChange).toHaveBeenCalledWith(1);
  });
});
