import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { servicesApi, techniciansApi } from '../../services/api';
import TechnicianCard from '../../components/technician/TechnicianCard';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { Search, MapPin, SlidersHorizontal, Users, RefreshCw } from 'lucide-react';

export default function SearchTechnicians() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('categoryId') || '';

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [city, setCity] = useState('New Delhi');
  const [radiusKm, setRadiusKm] = useState(15);
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-8">
      {/* Title */}
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          Nearby Professionals
        </span>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
          Find & Select Local Technicians
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Search background-checked specialists operating within your exact radius.
        </p>
      </div>

      {/* Filter Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Service Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 text-xs font-semibold py-2.5 px-3 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-fixteal-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              City / Location
            </label>
            <div className="relative">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="City name"
                className="block w-full pl-8 pr-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-fixteal-500"
              />
              <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Radius: {radiusKm} km
              </label>
            </div>
            <input
              type="range"
              min="2"
              max="50"
              step="1"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="w-full accent-fixteal-600 cursor-pointer mt-2"
            />
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-700 py-2">
              <input
                type="checkbox"
                checked={onlyOnline}
                onChange={(e) => setOnlyOnline(e.target.checked)}
                className="rounded border-slate-300 text-fixteal-600 focus:ring-fixteal-500"
              />
              <span>Online Now Only</span>
            </label>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Found {technicians.length} qualified specialists
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={searchNearby}
          >
            Refresh List
          </Button>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <Spinner size="lg" label="Scanning nearby technicians..." className="py-16" />
      ) : technicians.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No technicians found matching criteria"
          description="Try broadening your search radius or selecting a different service category."
          actionLabel="Reset Radius to 25 km"
          onAction={() => {
            setRadiusKm(25);
            setSelectedCategory('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technicians.map((tech) => (
            <TechnicianCard key={tech.id} technician={tech} />
          ))}
        </div>
      )}
    </div>
  );
}
