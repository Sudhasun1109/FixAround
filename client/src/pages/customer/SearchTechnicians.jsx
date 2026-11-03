import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { servicesApi, techniciansApi } from '../../services/api';
import TechnicianCard from '../../components/technician/TechnicianCard';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Users,
  RefreshCw,
  LayoutGrid,
  List,
  Sparkles,
} from 'lucide-react';

export default function SearchTechnicians() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('categoryId') || '';

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [city, setCity] = useState('Tiruppur');
  const [radiusKm, setRadiusKm] = useState(25);
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('horizontal'); // 'horizontal' | 'grid'

  // Load categories on mount
  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await servicesApi.getAll({ is_active: 1 });
        const list = res?.data?.categories || res?.data || [];
        setCategories(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCats();
  }, []);

  const searchNearby = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        city,
        radius_km: radiusKm,
        is_available: 1,
      };
      if (selectedCategory) params.category_id = selectedCategory;
      if (onlyOnline) params.is_online = 1;

      // Try getNearby or fallback to getAll
      let list = [];
      try {
        const res = await techniciansApi.getNearby(params);
        list = res?.data?.technicians || res?.data || [];
      } catch {
        const resAll = await techniciansApi.getAll(params);
        list = resAll?.data?.technicians || resAll?.data || [];
      }

      setTechnicians(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to search technicians:', err);
      setTechnicians([]);
    } finally {
      setLoading(false);
    }
  }, [city, radiusKm, selectedCategory, onlyOnline]);

  useEffect(() => {
    searchNearby();
  }, [searchNearby]);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixblue-500 uppercase tracking-wider">
            Verified Directory
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight mt-0.5">
            Find & Hire Local Experts
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Browse certified technicians operating near your location with upfront rates.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-full border border-slate-200 shadow-2xs self-start">
          <button
            type="button"
            onClick={() => setViewMode('horizontal')}
            className={`p-2 rounded-full transition-colors ${
              viewMode === 'horizontal'
                ? 'bg-fixblue-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="List View"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-full transition-colors ${
              viewMode === 'grid'
                ? 'bg-fixblue-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Grid View"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modern Filter Card */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-soft space-y-4">
        {/* Horizontal Category Chips */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Filter by Trade
          </label>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedCategory('')}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === ''
                  ? 'bg-fixblue-500 text-white shadow-md shadow-blue-500/25'
                  : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              All Trades
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id === selectedCategory ? '' : c.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                  String(selectedCategory) === String(c.id)
                    ? 'bg-fixblue-500 text-white shadow-md shadow-blue-500/25'
                    : 'bg-slate-50 text-slate-700 border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Location & Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              City / Area
            </label>
            <div className="relative">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City name"
                className="block w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-full border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-fixblue-400"
              />
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Max Distance: {radiusKm} km
              </label>
            </div>
            <input
              type="range"
              min="5"
              max="50"
              step="5"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-fixblue-500 cursor-pointer mt-1"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-4">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700">
              <input
                type="checkbox"
                checked={onlyOnline}
                onChange={(e) => setOnlyOnline(e.target.checked)}
                className="rounded border-slate-300 text-fixblue-500 focus:ring-fixblue-400"
              />
              <span>Online Now</span>
            </label>

            <button
              type="button"
              onClick={searchNearby}
              className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      {loading ? (
        <Spinner size="lg" label="Scanning verified technicians nearby..." className="py-16" />
      ) : technicians.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No technicians found nearby"
          description="Try increasing your search distance or selecting another category."
          actionLabel="Reset to 35 km"
          onAction={() => {
            setRadiusKm(35);
            setSelectedCategory('');
          }}
        />
      ) : (
        <div
          className={
            viewMode === 'horizontal'
              ? 'space-y-4'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
          }
        >
          {technicians.map((tech) => (
            <TechnicianCard
              key={tech.id}
              technician={tech}
              variant={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}
