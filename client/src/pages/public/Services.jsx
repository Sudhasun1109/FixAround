import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { servicesApi } from '../../services/api';
import CategoryGrid from '../../components/service/CategoryGrid';
import SearchBar from '../../components/common/SearchBar';
import { Wrench, Filter, ArrowUpDown } from 'lucide-react';

export default function Services() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialQuery);
  const [sortBy, setSortBy] = useState('popular');
  const [filterWarranty, setFilterWarranty] = useState(false);

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
    const matchesSearch =
      cat.name?.toLowerCase().includes(search.toLowerCase()) ||
      cat.description?.toLowerCase().includes(search.toLowerCase());
    const matchesWarranty = filterWarranty ? (cat.warranty_period_days || 0) > 0 : true;
    return matchesSearch && matchesWarranty;
  });

  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (sortBy === 'price-low') {
      return (Number(a.min_price) || 0) - (Number(b.min_price) || 0);
    }
    if (sortBy === 'price-high') {
      return (Number(b.max_price) || 0) - (Number(a.max_price) || 0);
    }
    if (sortBy === 'warranty') {
      return (b.warranty_period_days || 0) - (a.warranty_period_days || 0);
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
          Transparent rates, upfront estimates, and verified technicians across 12+ categories.
        </p>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex-1 max-w-md">
          <SearchBar
            value={search}
            onChange={handleSearchChange}
            placeholder="Filter services by keyword..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={filterWarranty}
                onChange={(e) => setFilterWarranty(e.target.checked)}
                className="rounded border-slate-300 text-fixteal-600 focus:ring-fixteal-500"
              />
              <span>Warranty Included Only</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg px-2.5 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-fixteal-500"
            >
              <option value="popular">Recommended</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="warranty">Longest Warranty</option>
            </select>
          </div>
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
