import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({
  pageNumber,
  pageSize,
  totalElements,
  totalPages,
  first,
  last,
  onPageChange,
  onPageSizeChange,
}) => {
  if (totalElements === 0) return null;

  const startItem = pageNumber * pageSize + 1;
  const endItem = Math.min((pageNumber + 1) * pageSize, totalElements);

  // Generate page numbers array (with truncation if lots of pages)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(0, pageNumber - 2);
    let end = Math.min(totalPages - 1, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(0, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
        padding: 'var(--space-4) var(--space-6)',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: '#fafbfc',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Showing <strong>{startItem}</strong> to <strong>{endItem}</strong> of{' '}
          <strong>{totalElements}</strong> records
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              fontSize: '0.825rem',
              borderRadius: 'var(--radius-xs)',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'white',
              cursor: 'pointer',
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(pageNumber - 1)}
          disabled={first}
          title="Previous Page"
          style={{ opacity: first ? 0.45 : 1 }}
        >
          <ChevronLeft size={16} />
          <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } }}>Prev</span>
        </button>

        {getPageNumbers().map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className="btn btn-sm"
            style={{
              minWidth: '32px',
              padding: '6px 10px',
              backgroundColor: p === pageNumber ? 'var(--primary)' : 'transparent',
              color: p === pageNumber ? 'white' : 'var(--text-main)',
              border: p === pageNumber ? 'none' : '1px solid transparent',
              fontWeight: p === pageNumber ? 700 : 500,
            }}
          >
            {p + 1}
          </button>
        ))}

        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onPageChange(pageNumber + 1)}
          disabled={last}
          title="Next Page"
          style={{ opacity: last ? 0.45 : 1 }}
        >
          <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } }}>Next</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
