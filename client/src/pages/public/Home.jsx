import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { servicesApi, techniciansApi, reviewsApi } from '../../services/api';
import TechnicianCard from '../../components/technician/TechnicianCard';
import Button from '../../components/common/Button';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  ChevronDown,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Star,
  Zap,
  Droplets,
  Hammer,
  Snowflake,
  Paintbrush,
  Sparkles,
  Wrench,
  CheckCircle2,
  Clock,
  PhoneCall,
  Bell,
} from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Tiruppur');
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const navigate = useNavigate();

  // Curated category icons & images
  const defaultCategories = [
    { id: 'all', name: 'All', icon: Sparkles },
    { id: 1, name: 'Plumbing', icon: Droplets, slug: 'plumbing' },
    { id: 2, name: 'Electrical', icon: Zap, slug: 'electrical' },
    { id: 3, name: 'Carpentry', icon: Hammer, slug: 'carpentry' },
    { id: 4, name: 'AC Repair', icon: Snowflake, slug: 'ac-repair' },
    { id: 5, name: 'Painting', icon: Paintbrush, slug: 'painting' },
    { id: 6, name: 'Appliance Repair', icon: Wrench, slug: 'appliance-repair' },
    { id: 7, name: 'Emergency', icon: AlertTriangle, slug: 'emergency', isEmergency: true },
  ];

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);

        const [catRes, techRes, revRes] = await Promise.allSettled([
          servicesApi.getAll({ is_active: 1 }),
          techniciansApi.getAll({ limit: 4 }),
          reviewsApi.getFeatured({ limit: 3 }),
        ]);

        if (catRes.status === 'fulfilled') {
          const catList = catRes.value?.data?.categories || catRes.value?.data || [];
          if (Array.isArray(catList) && catList.length > 0) {
            setCategories(catList);
          } else {
            setCategories(defaultCategories);
          }
        }

        if (techRes.status === 'fulfilled') {
          const techList = techRes.value?.data?.technicians || techRes.value?.data || [];
          if (Array.isArray(techList) && techList.length > 0) {
            setTechnicians(techList.slice(0, 4));
          } else {
            // Fallback sample experts matching reference
            setTechnicians([
              {
                id: 101,
                full_name: 'Johan Thomas',
                specialization: 'Plumbing Expert',
                hourly_rate: 499,
                avg_rating: 4.8,
                review_count: 120,
                experience_years: 8,
                is_online: 1,
                is_available: 1,
                verification_status: 'approved',
                avatar_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80',
              },
              {
                id: 102,
                full_name: 'James Anderson',
                specialization: 'Carpenter Expert',
                hourly_rate: 450,
                avg_rating: 4.9,
                review_count: 98,
                experience_years: 7,
                is_online: 1,
                is_available: 1,
                verification_status: 'approved',
                avatar_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=80',
              },
              {
                id: 103,
                full_name: 'David Miller',
                specialization: 'Electrical Specialist',
                hourly_rate: 550,
                avg_rating: 4.85,
                review_count: 145,
                experience_years: 10,
                is_online: 1,
                is_available: 1,
                verification_status: 'approved',
                avatar_url: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80',
              },
            ]);
          }
        }

        if (revRes.status === 'fulfilled') {
          const revList = revRes.value?.data?.reviews || revRes.value?.data || [];
          setReviews(Array.isArray(revList) ? revList.slice(0, 3) : []);
        }
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/services');
    }
  };

  const handleCategoryClick = (catName, catId) => {
    setSelectedCategory(catName);
    if (catName === 'All') {
      navigate('/services');
    } else if (catName === 'Emergency') {
      navigate('/emergency');
    } else {
      navigate(`/services?category=${catId || encodeURIComponent(catName)}`);
    }
  };

  const cities = [
    'Tiruppur, Tamil Nadu',
    'Coimbatore, Tamil Nadu',
    'Chennai, Tamil Nadu',
    'Bengaluru, Karnataka',
    'New Delhi, Delhi',
    'Mumbai, Maharashtra',
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-7">
      {/* 1. TOP APP HEADER (Screen 1 Inspiration) */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-fixblue-500 text-white flex items-center justify-center font-extrabold shadow-sm shadow-blue-500/20">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Current Location
              </span>
            </div>
            {/* Interactive Location Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
                className="flex items-center gap-1 text-sm font-extrabold text-slate-900 hover:text-fixblue-600 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-fixblue-500" />
                <span>{selectedCity}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {cityDropdownOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50">
                  <p className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Select Your City
                  </p>
                  {cities.map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => {
                        setSelectedCity(city);
                        setCityDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-fixblue-50 hover:text-fixblue-600 transition-colors"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Right: Alert Notification Bell */}
        <Link
          to="/customer/notifications"
          className="relative w-10 h-10 rounded-full bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center text-slate-700 hover:text-fixblue-600 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
        </Link>
      </div>

      {/* 2. HERO GREETING & SEARCH (Screen 1 Inspiration) */}
      <div className="space-y-4 pt-2">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#172033] tracking-tight">
            What Service Do You <br className="hidden sm:inline" />
            Need Today?
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Find trusted professionals near you for home repairs & emergencies.
          </p>
        </div>

        {/* Modern Pill Search Bar */}
        <form onSubmit={handleSearch} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for plumber, electrician, AC repair..."
              className="w-full pl-11 pr-4 py-3.5 bg-white text-slate-800 text-xs sm:text-sm font-medium rounded-full border border-slate-200/80 shadow-soft focus:outline-none focus:ring-2 focus:ring-fixblue-400 focus:border-transparent transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Circular Blue Filter Button */}
          <button
            type="submit"
            className="w-12 h-12 rounded-full bg-fixblue-500 hover:bg-fixblue-600 active:scale-95 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30 transition-all"
            title="Filter Services"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* 3. CATEGORIES SECTION (Screen 1 Inspiration) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Categories
          </h2>
          <Link
            to="/services"
            className="text-xs font-bold text-fixblue-500 hover:text-fixblue-600 transition-colors"
          >
            See all
          </Link>
        </div>

        {/* Horizontal Scrollable Category Chips */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar pt-1">
          {defaultCategories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.name;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryClick(cat.name, cat.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 select-none ${
                  isSelected
                    ? 'bg-fixblue-500 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                    : cat.isEmergency
                    ? 'bg-rose-50 text-rose-600 border border-rose-200/80 hover:bg-rose-100'
                    : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : cat.isEmergency ? 'text-rose-500' : 'text-slate-500'}`} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. EMERGENCY BANNER (2-Min Immediate Help) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-fixblue-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-fixblue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-md">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold border border-rose-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              2-Minute Rapid Dispatch
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              Need Immediate Repair Assistance?
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Get connected with available local professionals for urgent repairs. Nearest verified technician dispatched in 120 seconds.
            </p>
          </div>

          <Link
            to="/emergency"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-xs shadow-lg shadow-rose-900/40 active:scale-95 transition-all shrink-0"
          >
            <AlertTriangle className="w-4 h-4 text-amber-200" />
            <span>Book Emergency Service</span>
          </Link>
        </div>
      </div>

      {/* 5. TOP RATED EXPERTS SECTION (Screen 1 Inspiration) */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Top Rated Experts
          </h2>
          <Link
            to="/customer/search"
            className="text-xs font-bold text-fixblue-500 hover:text-fixblue-600 transition-colors"
          >
            See all
          </Link>
        </div>

        {/* Technician Cards in Screen 1 Style */}
        <div className="space-y-3.5">
          {technicians.map((tech) => (
            <TechnicianCard
              key={tech.id}
              technician={tech}
              variant="horizontal"
            />
          ))}
        </div>
      </div>

      {/* 6. WHY CHOOSE FIXAROUND (Trust & Peace of Mind) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="text-center max-w-md mx-auto">
          <span className="text-[11px] font-bold text-fixblue-500 uppercase tracking-wider">
            Trust & Safety
          </span>
          <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
            FixAround Service Guarantee
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-fixblue-100 text-fixblue-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">100% KYC Verified</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Background-checked, government-ID verified specialists.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">30-Day Warranty</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Free re-service warranty on every completed repair job.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-100 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Escrow Payment</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Your payment is released only after you verify the work.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
