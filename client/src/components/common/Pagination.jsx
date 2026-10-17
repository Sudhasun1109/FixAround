import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalItems,
  pageSize = 10,
  onPageChange,
  className = '',
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      } else if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) pages.push('ellipsis-1');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('ellipsis-2');

      pages.push(totalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems || currentPage * pageSize);

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 ${className}`}
    >
      {totalItems !== undefined && (
        <p className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{startItem}</span> to{' '}
          <span className="font-semibold text-slate-700">{endItem}</span> of{' '}
          <span className="font-semibold text-slate-700">{totalItems}</span> results
        </p>
      )}

      <div className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-xs">
        {/* Previous */}
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page numbers */}
        {pages.map((p, idx) => {
          if (typeof p === 'string') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-xs text-slate-400 select-none"
              >
                ...
              </span>
            );
          }
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`min-w-[32px] h-8 px-2 text-xs font-semibold rounded-md transition-colors ${
                isActive
                  ? 'bg-fixblue-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          );
        })}

        {/* Next */}
        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
