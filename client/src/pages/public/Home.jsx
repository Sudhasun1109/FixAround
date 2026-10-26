import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { servicesApi, reviewsApi } from '../../services/api';
import CategoryGrid from '../../components/service/CategoryGrid';
import ReviewCard from '../../components/review/ReviewCard';
import Button from '../../components/common/Button';
import {
  Search,
  AlertTriangle,
  ShieldCheck,
  Clock,
  CreditCard,
  Wrench,
  CheckCircle2,
  Users,
  MapPin,
  ArrowRight,
  Sparkles,
  PhoneCall,
  ThumbsUp,
} from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('Tiruppur');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingCategories(true);
        const catRes = await servicesApi.getAll({ is_active: 1 });
        const catList = catRes?.data?.categories || catRes?.data || [];
        setCategories(Array.isArray(catList) ? catList.slice(0, 8) : []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoadingCategories(false);
      }

      try {
        const revRes = await reviewsApi.getMyReviews({ limit: 3 });
        const revList = revRes?.data?.reviews || revRes?.data || [];
        if (Array.isArray(revList) && revList.length > 0) {
          setReviews(revList.slice(0, 3));
        } else {
          // Fallback sample testimonials if no DB reviews yet
          setReviews([
            {
              id: 'sample-1',
              customer_name: 'Priya Sharma',
              rating: 5,
              title: 'Saved us during midnight electrical short-circuit!',
              comment: 'The emergency response was shockingly fast. The technician arrived in 25 minutes, identified the faulty MCB breaker, and replaced it cleanly. Outstanding service.',
              created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
            },
            {
              id: 'sample-2',
              customer_name: 'Rahul Verma',
              rating: 5,
              title: 'Transparent upfront estimate, zero surprises',
              comment: 'Plumber Ravi explained all line items before touching our leaking pipe. No hidden charges. The digital invoice was sent directly to my dashboard. Highly recommended!',
              created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
            },
            {
              id: 'sample-3',
              customer_name: 'Anita Desai',
              rating: 4,
              title: 'Great AC servicing with warranty guarantee',
              comment: 'AC cools like brand new now. Having a 15-day platform warranty gave us complete peace of mind. Will definitely book again.',
              created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
            },
          ]);
        }
      } catch {
        // Handled silently
      }
    };

    fetchData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/services?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/services');
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-fixblue-900 via-fixblue-950 to-slate-900 text-white pt-16 pb-20 lg:pt-24 lg:pb-32">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-fixteal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-fixblue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-fixteal-300 text-xs font-semibold backdrop-blur-sm border border-white/10 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fast, Reliable & Verified Doorstep Services</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
            Your Trusted <span className="text-fixteal-400">Local Repair</span> Experts
          </h1>

          <p className="mt-6 text-sm sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Connect with background-checked electricians, plumbers, AC specialists, and emergency technicians in minutes. Transparent pricing with FixAround warranty.
          </p>

          {/* Search Box */}
          <div className="mt-10 max-w-2xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-2 border border-slate-200"
            >
              <div className="flex items-center gap-2 px-3 py-2 text-slate-500 border-b sm:border-b-0 sm:border-r border-slate-200 w-full sm:w-auto shrink-0">
                <MapPin className="w-4 h-4 text-fixteal-600" />
                <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"><option value="Tiruppur">Tiruppur, Tamil Nadu</option><option value="Chennai">Chennai, Tamil Nadu</option><option value="Coimbatore">Coimbatore, Tamil Nadu</option><option value="Bengaluru">Bengaluru, Karnataka</option><option value="New Delhi">New Delhi, Delhi</option><option value="Mumbai">Mumbai, Maharashtra</option></select>
              </div>

              <div className="flex-1 flex items-center px-3 py-2 w-full">
                <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What service do you need? (e.g. AC Repair, Plumber, Switchboard)"
                  className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full sm:w-auto shrink-0 bg-fixblue-900 hover:bg-fixblue-950"
              >
                Find Experts
              </Button>
            </form>
          </div>

          {/* Emergency Callout Button */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/emergency"
              className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 text-white font-extrabold text-sm shadow-xl shadow-rose-950/40 transform hover:-translate-y-0.5 transition-all animate-pulse"
            >
              <AlertTriangle className="w-5 h-5 text-amber-200" />
              <span>Urgent Emergency Repair (30 Mins)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/services"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-sm border border-white/20 transition-all"
            >
              <span>Explore All Services</span>
            </Link>
          </div>

          {/* Quick Metrics */}
          <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center max-w-4xl mx-auto">
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">100%</p>
              <p className="text-xs text-slate-400 mt-1">Verified Technicians</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-fixteal-400">30 Mins</p>
              <p className="text-xs text-slate-400 mt-1">Avg. Emergency Arrival</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white">4.8 / 5</p>
              <p className="text-xs text-slate-400 mt-1">Customer Satisfaction</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-fixteal-400">Up to 30d</p>
              <p className="text-xs text-slate-400 mt-1">Service Warranty</p>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR CATEGORIES SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
              Browse Categories
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-fixblue-900 mt-1">
              Popular Home & Business Services
            </h2>
          </div>

          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-fixblue-800 hover:text-fixteal-600 transition-colors"
          >
            <span>View All Services</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <CategoryGrid
          categories={categories}
          loading={loadingCategories}
        />
      </section>

      {/* HOW IT WORKS (4 Steps) */}
      <section className="bg-slate-100/70 py-16 sm:py-20 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
              Hassle-Free Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-fixblue-900 mt-1">
              How FixAround Works
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              From discovering a problem to repair completion and payment in four seamless steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="w-12 h-12 rounded-xl bg-fixblue-50 text-fixblue-900 flex items-center justify-center font-extrabold text-lg mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Search & Select</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Choose your repair category or describe the issue. Pick normal scheduling or 30-min emergency assistance.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-fixteal-700 flex items-center justify-center font-extrabold text-lg mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Technician Matched</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Our smart dispatcher assigns the nearest background-checked pro who accepts within minutes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-extrabold text-lg mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Approve Estimate</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Technician inspects on-site and submits an itemized quote. You approve via your phone before work begins.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs relative">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-extrabold text-lg mb-4">
                4
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Pay & Protected</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pay digitally after work is done. Receive instant invoice and FixAround warranty coverage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* WHY FIXAROUND (Trust Badges) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Peace of Mind
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-fixblue-900 mt-1">
            Why Thousands Choose FixAround
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-fixteal-400 transition-all">
            <div className="w-12 h-12 rounded-xl bg-teal-50 text-fixteal-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-fixblue-900 mb-2">
              Verified Professionals
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every technician passes government ID verification, criminal background check, and skill evaluation.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-fixteal-400 transition-all">
            <div className="w-12 h-12 rounded-xl bg-fixblue-50 text-fixblue-800 flex items-center justify-center mb-4">
              <CreditCard className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-fixblue-900 mb-2">
              Transparent Pricing
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standard rate cards with zero surge fees. Detailed itemized estimates require customer approval.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-fixteal-400 transition-all">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-fixblue-900 mb-2">
              Emergency Backup
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automated smart dispatcher cascades assignments immediately if a tech doesn't respond in time.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-fixteal-400 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <ThumbsUp className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-fixblue-900 mb-2">
              Warranty Protection
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Every completed repair includes standard warranty protection against recurring failures with free re-service.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURED REVIEWS */}
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
              Customer Testimonials
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-fixblue-900 mt-1">
              Real Experiences From Real Neighbors
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <ReviewCard key={rev.id} review={rev} />
            ))}
          </div>
        </div>
      </section>

      {/* EMERGENCY SERVICES BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-red-600 via-rose-600 to-fixblue-950 p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-xl text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-200" />
                24/7 Breakdown Assistance
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold leading-tight">
                Burst pipe? Electrical outage? Gas leak?
              </h3>
              <p className="text-sm text-rose-100 leading-relaxed">
                Don't panic. Our 30-minute rapid dispatch guarantees an active technician is en route to prevent household property damage.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <Link
                to="/emergency"
                className="px-6 py-3.5 rounded-xl bg-white text-rose-600 hover:bg-rose-50 font-extrabold text-sm text-center shadow-lg transition-transform hover:scale-105"
              >
                Request Emergency Tech Now
              </Link>
              <a
                href="tel:9597993402"
                className="px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm text-center border border-white/30 flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Hotline</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
