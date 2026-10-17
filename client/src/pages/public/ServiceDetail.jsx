import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { servicesApi, techniciansApi } from '../../services/api';
import PriceRange from '../../components/service/PriceRange';
import TechnicianCard from '../../components/technician/TechnicianCard';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import { ShieldCheck, Calendar, AlertTriangle, ArrowLeft, Wrench, CheckCircle } from 'lucide-react';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [category, setCategory] = useState(null);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch category by ID or slug
        let catData = null;
        try {
          const res = await servicesApi.getById(id);
          catData = res?.data || res;
        } catch {
          const resSlug = await servicesApi.getBySlug(id);
          catData = resSlug?.data || resSlug;
        }

        setCategory(catData);

        // Fetch technicians with this category
        if (catData?.id) {
          try {
            const techRes = await techniciansApi.getAll({
              category_id: catData.id,
              is_available: 1,
            });
            const techList = techRes?.data?.technicians || techRes?.data || [];
            setTechnicians(Array.isArray(techList) ? techList : []);
          } catch (err) {
            console.warn('Could not load technicians for category:', err);
          }
        }
      } catch (err) {
        setError(err.message || 'Service category not found');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (loading) {
    return <Spinner fullScreen label="Loading service details..." />;
  }

  if (error || !category) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Service Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'Could not locate this service category.'}</p>
        <Link to="/services">
          <Button variant="outline" icon={ArrowLeft}>
            Back to All Services
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back button */}
      <div>
        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-fixblue-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Categories</span>
        </Link>
      </div>

      {/* Main Detail Header Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-fixblue-50 text-fixblue-900 flex items-center justify-center">
              <Wrench className="w-7 h-7 text-fixteal-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-fixblue-900">
                {category.name}
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Verified doorstep repair & maintenance
              </p>
            </div>
          </div>

          <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed space-y-4">
            <p>{category.description}</p>
            <p>
              All service requests for {category.name} include a rigorous multi-point inspection, clear pricing approval before commencement, genuine parts sourcing, and post-service warranty.
            </p>
          </div>

          {/* Features Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
              <CheckCircle className="w-4 h-4 text-fixteal-600 shrink-0" />
              <span>Background checked technicians</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
              <CheckCircle className="w-4 h-4 text-fixteal-600 shrink-0" />
              <span>Upfront itemized estimate approval</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
              <CheckCircle className="w-4 h-4 text-fixteal-600 shrink-0" />
              <span>Digital invoicing & escrow payments</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
              <CheckCircle className="w-4 h-4 text-fixteal-600 shrink-0" />
              <span>{category.warranty_period_days || 7}-Day FixAround Warranty</span>
            </div>
          </div>
        </div>

        {/* Pricing Card & Booking Actions */}
        <div className="space-y-4">
          <PriceRange
            minPrice={category.min_price}
            maxPrice={category.max_price}
            inspectionCharge={category.inspection_charge}
          />

          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              icon={Calendar}
              onClick={() => navigate(`/customer/book?categoryId=${category.id}`)}
            >
              Book Standard Service
            </Button>

            <Button
              variant="emergency"
              size="md"
              fullWidth
              icon={AlertTriangle}
              onClick={() => navigate(`/customer/emergency?categoryId=${category.id}`)}
            >
              Request 30-Min Emergency
            </Button>
          </div>
        </div>
      </div>

      {/* Available Specialists in this Category */}
      <div className="pt-8 border-t border-slate-200">
        <div className="mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-fixblue-900">
            Available Specialists for {category.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Top-rated verified professionals in your local area ready for dispatch.
          </p>
        </div>

        {technicians.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technicians.map((tech) => (
              <TechnicianCard key={tech.id} technician={tech} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-dashed border-slate-200 text-center">
            <p className="text-xs text-slate-500 mb-4">
              Technicians are dispatched automatically based on your address when you create a booking.
            </p>
            <Button
              variant="secondary"
              size="md"
              onClick={() => navigate(`/customer/book?categoryId=${category.id}`)}
            >
              Book Service Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
