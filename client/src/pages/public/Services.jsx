import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { servicesApi } from '../../services/api';
import CategoryGrid from '../../components/service/CategoryGrid';
import { Search, ArrowUpDown, Sparkles } from 'lucide-react';

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
      {/* Header */}
      <div>
        <span className="text-xs font-bold text-fixblue-500 uppercase tracking-wider">
          Service Catalogue
        </span>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-[#172033] tracking-tight mt-1">
          Explore Repair & Maintenance Categories
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl font-medium">
          Transparent rates, upfront estimates, and verified technicians across all local repair categories.
        </p>
      </div>

      {/* Modern Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-100 shadow-soft">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search service categories..."
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 text-xs sm:text-sm font-medium rounded-full border border-slate-200/80 focus:outline-none focus:ring-2 focus:ring-fixblue-400"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700 py-2.5 px-3.5 rounded-full focus:outline-none focus:ring-2 focus:ring-fixblue-400 cursor-pointer"
          >
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Alphabetical (A-Z)</option>
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
