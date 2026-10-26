import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { servicesApi } from '../../services/api';
import CategoryGrid from '../../components/service/CategoryGrid';
import SearchBar from '../../components/common/SearchBar';
import { Wrench, ArrowUpDown } from 'lucide-react';

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const res = await servicesApi.getAll({ is_active: 1 });
        const list = res?.data?.categories || res?.data || [];
        setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load services:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSearchChange = (val) => {
    setSearch(val);
    if (val) {
      setSearchParams({ q: val });
    } else {
      setSearchParams({});
    }
  };

  // Filter & Sort
  const filteredCategories = categories.filter((cat) => {
    return (
      cat.name?.toLowerCase().includes(search.toLowerCase()) ||
      cat.description?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (sortBy === 'price-low') {
      return (Number(a.min_price) || 0) - (Number(b.min_price) || 0);
    }
    if (sortBy === 'price-high') {
      return (Number(b.max_price) || 0) - (Number(a.max_price) || 0);
    }
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name);
    }
    return (a.sort_order || 0) - (b.sort_order || 0);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          All Services
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-fixblue-900 mt-1">
          Explore Repair & Maintenance Categories
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl">
          Transparent rates, upfront estimates, and verified technicians across all local repair categories.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Filter services by keyword..."
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fixteal-500 cursor-pointer"
          >
            <option value="popular">Recommended</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <CategoryGrid
        categories={sortedCategories}
        loading={loading}
      />
    </div>
  );
}
