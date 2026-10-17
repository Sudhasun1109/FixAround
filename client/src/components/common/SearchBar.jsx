import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBar({
  value: initialValue = '',
  onChange,
  onSearch,
  placeholder = 'Search services, bookings, or technicians...',
  debounceMs = 300,
  className = '',
}) {
  const [searchTerm, setSearchTerm] = useState(initialValue);

  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onChange) onChange(searchTerm);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [searchTerm, debounceMs, onChange]);

  const handleClear = () => {
    setSearchTerm('');
    if (onChange) onChange('');
    if (onSearch) onSearch('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchTerm);
    }
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="block w-full pl-10 pr-9 py-2 text-sm text-slate-800 placeholder:text-slate-400 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-fixteal-500 focus:border-fixteal-500 shadow-2xs transition-colors"
      />

      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
        >
          <X className="w-4 h-4" />
          <span className="sr-only">Clear search</span>
        </button>
      )}
    </div>
  );
}
