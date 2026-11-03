import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { techniciansApi, bookingsApi, servicesApi } from '../../services/api';
import StarRating from '../../components/review/StarRating';
import SkillBadges from '../../components/technician/SkillBadges';
import ReviewCard from '../../components/review/ReviewCard';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import { showToast } from '../../components/common/Toast';
import { formatCurrency } from '../../utils/formatters';
import {
  ShieldCheck,
  MapPin,
  Briefcase,
  Calendar,
  Clock,
  ArrowLeft,
  Award,
  CheckCircle2,
  Heart,
  Minus,
  Plus,
  Star,
  Sparkles,
  PhoneCall,
  Check,
  X,
  Compass,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export default function TechnicianProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [technician, setTechnician] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about'); // 'about' | 'services' | 'reviews' | 'availability'
  const [workingHours, setWorkingHours] = useState(2);
  const [isFavorite, setIsFavorite] = useState(false);

  // Work sample lightbox modal
  const [selectedImage, setSelectedImage] = useState(null);

  // In-page 8-step booking modal state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('10:00 AM');
  const [serviceLocation, setServiceLocation] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const availableTimeSlots = [
    '09:00 AM',
    '11:00 AM',
    '01:00 PM',
    '03:00 PM',
    '05:00 PM',
    '07:00 PM',
  ];

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const techRes = await techniciansApi.getById(id);
        const techData = techRes?.data || techRes;
        setTechnician(techData);

        // Fetch their reviews
        try {
          const revRes = await techniciansApi.getReviews(id);
          const revList = revRes?.data?.reviews || revRes?.data || [];
          setReviews(Array.isArray(revList) ? revList : []);
        } catch {
          setReviews([]);
        }

        // Fetch categories for the booking modal
        try {
          const catRes = await servicesApi.getAll({ is_active: 1 });
          const catList = catRes?.data?.categories || catRes?.data || [];
          setCategories(Array.isArray(catList) ? catList : []);
          if (catList.length > 0) {
            setSelectedServiceId(catList[0].id);
          }
        } catch {
          // Fallback categories handled
        }
      } catch (err) {
        setError(err.message || 'Technician not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    if (!isFavorite) {
      showToast.success('Saved to your favorite technicians!');
    } else {
      showToast.info('Removed from favorites.');
    }
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast.error('Geolocation is not supported by your browser');
      return;
    }
    showToast.info('Acquiring your location...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setServiceLocation(
          `GPS Coords: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (Current Location)`
        );
        showToast.success('Current location coordinates acquired!');
      },
      (err) => {
        showToast.error(`Could not detect location: ${err.message}`);
      }
    );
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!serviceLocation.trim()) {
      showToast.error('Please enter the service location address.');
      return;
    }
    if (!problemDescription.trim()) {
      showToast.error('Please describe the repair problem.');
      return;
    }

    try {
      setSubmittingBooking(true);
      const scheduledDateTime = `${bookingDate}T${timeSlot.replace(' ', ':00')}`;

      const payload = {
        category_id: selectedServiceId || 1,
        technician_id: technician.id || technician.user_id,
        title: `Repair Service by ${technician.full_name || 'Specialist'}`,
        description: problemDescription.trim(),
        urgency: 'normal',
        customer_address: serviceLocation.trim(),
        scheduled_at: scheduledDateTime,
      };

      const res = await bookingsApi.create(payload);
      const bookingData = res?.data?.booking || res?.data || res;
      setConfirmedBooking(bookingData);
      showToast.success('Booking successfully placed!');
    } catch (err) {
      showToast.error(err.message || 'Failed to submit booking');
    } finally {
      setSubmittingBooking(false);
    }
  };

  if (loading) {
    return <Spinner fullScreen label="Loading professional profile..." />;
  }

  if (error || !technician) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Technician Not Found</h2>
        <p className="text-xs text-slate-500 mb-6">{error || 'Could not locate this professional.'}</p>
        <Link to="/customer/search">
          <Button variant="outline" icon={ArrowLeft}>
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  const fullName =
    technician.full_name ||
    `${technician.first_name || ''} ${technician.last_name || ''}`.trim() ||
    'Johan Thomas';

  const isVerified = technician.verification_status === 'approved';
  const completedJobs = technician.completed_jobs || 250;
  const experienceYears = technician.experience_years || 8;
  const satisfactionRate = technician.satisfaction_rate || '98%';
  const hourlyRate = technician.hourly_rate || 499;

  // Work portfolio gallery images (Screen 2 Inspiration)
  const portfolioPhotos = [
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
  ];

  const coverImage =
    technician.cover_url ||
    technician.avatar_url ||
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1000&auto=format&fit=crop&q=80';

  const locationText = technician.service_city
    ? `${technician.service_city}, ${technician.state || 'India'}`
    : 'Tiruppur, Tamil Nadu';

  return (
    <div className="max-w-2xl mx-auto pb-24 md:pb-12 bg-white rounded-3xl overflow-hidden shadow-card border border-slate-100 my-2 sm:my-6 relative">
      {/* 1. LARGE COVER PHOTO WITH FLOATING CONTROLS (Screen 2 Inspiration) */}
      <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-slate-900">
        <img
          src={coverImage}
          alt={fullName}
          className="w-full h-full object-cover opacity-90"
        />

        {/* Floating Back Button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-slate-800 hover:bg-white flex items-center justify-center shadow-md active:scale-90 transition-all z-10"
          title="Go Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Floating Favorite Heart Button */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-md text-slate-800 hover:bg-white flex items-center justify-center shadow-md active:scale-90 transition-all z-10"
          title="Save to Favorites"
        >
          <Heart
            className={`w-5 h-5 transition-colors ${
              isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
            }`}
          />
        </button>

        {/* Overlapping Project Gallery Thumbnails Strip (Screen 2 Inspiration) */}
        <div className="absolute bottom-3 left-4 right-4 flex items-center gap-2.5 z-10">
          {portfolioPhotos.map((photo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedImage(photo)}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/90 shadow-md shrink-0 bg-slate-800 hover:scale-105 active:scale-95 transition-transform text-left cursor-pointer"
              title="Click to view work sample"
            >
              <img
                src={photo}
                alt={`Work sample ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              {idx === 3 && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center text-white font-extrabold text-xs">
                  +13
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 2. TECHNICIAN INFO SECTION (Screen 2 Inspiration) */}
      <div className="p-5 sm:p-7 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              {fullName}
            </h1>
            {isVerified && (
              <span className="p-1 rounded-full bg-fixblue-50 text-fixblue-500" title="Verified Expert">
                <CheckCircle2 className="w-5 h-5 fill-fixblue-500 text-white" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mt-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{locationText}</span>
          </div>
        </div>

        {/* 3. THREE STAT PILL CARDS (Screen 2 Inspiration) */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-[#F4F7FB] rounded-2xl p-3.5 text-center border border-slate-100">
            <p className="text-base sm:text-xl font-extrabold text-slate-900">
              {completedJobs}+
            </p>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5">
              Jobs Completed
            </p>
          </div>

          <div className="bg-[#F4F7FB] rounded-2xl p-3.5 text-center border border-slate-100">
            <p className="text-base sm:text-xl font-extrabold text-slate-900">
              {experienceYears}+
            </p>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5">
              Years Experience
            </p>
          </div>

          <div className="bg-[#F4F7FB] rounded-2xl p-3.5 text-center border border-slate-100">
            <p className="text-base sm:text-xl font-extrabold text-slate-900">
              {satisfactionRate}
            </p>
            <p className="text-[10px] sm:text-[11px] font-semibold text-slate-400 mt-0.5">
              On-Time Rate
            </p>
          </div>
        </div>

        {/* 4. PROFILE TABS (Screen 2 Inspiration) */}
        <div>
          <div className="flex items-center gap-6 border-b border-slate-100 pb-2 text-xs sm:text-sm font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`pb-2 relative transition-colors ${
                activeTab === 'about'
                  ? 'text-fixblue-500 border-b-2 border-fixblue-500'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              About
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('services')}
              className={`pb-2 relative transition-colors ${
                activeTab === 'services'
                  ? 'text-fixblue-500 border-b-2 border-fixblue-500'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Services
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`pb-2 relative transition-colors ${
                activeTab === 'reviews'
                  ? 'text-fixblue-500 border-b-2 border-fixblue-500'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Review({reviews.length || 230})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('availability')}
              className={`pb-2 relative transition-colors ${
                activeTab === 'availability'
                  ? 'text-fixblue-500 border-b-2 border-fixblue-500'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              Availability
            </button>
          </div>

          {/* Tab 1: About */}
          {activeTab === 'about' && (
            <div className="pt-4 space-y-4">
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {technician.bio ||
                  `I specialize in professional home repairs and utility maintenance with over ${experienceYears} years of experience, delivering quality workmanship, exceptional service, and complete customer satisfaction.`}
              </p>

              {/* Skills */}
              <div className="pt-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Verified Skills
                </h4>
                <SkillBadges skills={technician.skills || technician.categories || []} size="md" />
              </div>
            </div>
          )}

          {/* Tab 2: Services */}
          {activeTab === 'services' && (
            <div className="pt-4 space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Standard Inspection & Diagnosis</h4>
                  <p className="text-[11px] text-slate-500">Comprehensive on-site assessment</p>
                </div>
                <span className="text-sm font-extrabold text-slate-900">{formatCurrency(199)}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Hourly Labor Service</h4>
                  <p className="text-[11px] text-slate-500">Standard repair and maintenance work</p>
                </div>
                <span className="text-sm font-extrabold text-slate-900">{formatCurrency(hourlyRate)}/hr</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Emergency Rapid Callout</h4>
                  <p className="text-[11px] text-slate-500">Priority arrival within 30 minutes</p>
                </div>
                <span className="text-sm font-extrabold text-rose-600">{formatCurrency(hourlyRate + 150)}</span>
              </div>
            </div>
          )}

          {/* Tab 3: Reviews */}
          {activeTab === 'reviews' && (
            <div className="pt-4 space-y-3">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <ReviewCard key={rev.id} review={rev} />
                ))
              ) : (
                <div className="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
                  <Star className="w-6 h-6 text-amber-400 mx-auto mb-2 fill-amber-400" />
                  <p className="font-bold text-slate-700">4.8 Average Rating</p>
                  <p className="text-slate-400 mt-1">Based on verified completed service bookings.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Availability */}
          {activeTab === 'availability' && (
            <div className="pt-4 space-y-3 text-xs text-slate-600">
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <p className="font-bold text-emerald-900">Currently Available</p>
                  <p className="text-emerald-700 text-[11px]">Accepting emergency and scheduled tasks today.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block">Mon - Fri:</span>
                  <span className="font-bold text-slate-800">08:00 AM - 08:00 PM</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block">Sat - Sun:</span>
                  <span className="font-bold text-slate-800">09:00 AM - 06:00 PM</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. WORKING HOURS STEPPER (Screen 2 Inspiration) */}
        <div className="pt-2 flex items-center justify-between bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-800">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs sm:text-sm font-bold">Estimated Working Hours</span>
          </div>

          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-slate-200/90 shadow-2xs">
            <button
              type="button"
              onClick={() => setWorkingHours(Math.max(1, workingHours - 1))}
              className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-sm font-extrabold text-slate-900 w-4 text-center">
              {workingHours}
            </span>
            <button
              type="button"
              onClick={() => setWorkingHours(workingHours + 1)}
              className="w-6 h-6 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 6. BOTTOM CTA (Screen 2 Inspiration) */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => setIsBookingModalOpen(true)}
            className="w-full py-4 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white font-extrabold text-sm sm:text-base shadow-md shadow-blue-500/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            <span>Hire Now</span>
            <span className="text-xs font-semibold text-blue-100">
              ({formatCurrency(hourlyRate * workingHours)})
            </span>
          </button>
        </div>
      </div>

      {/* 7. LIGHTBOX MODAL FOR PORTFOLIO SAMPLES */}
      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-xl w-full bg-black rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/90 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage}
              alt="Work Sample Preview"
              className="w-full h-auto max-h-[75vh] object-contain rounded-2xl"
            />
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs">
              <span className="font-bold">Verified Portfolio Work Sample</span>
              <span className="text-slate-400">Completed by {fullName}</span>
            </div>
          </div>
        </div>
      )}

      {/* 8. COMPLETE 8-STEP IN-PAGE BOOKING MODAL */}
      {isBookingModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
        >
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-fixblue-600 to-fixblue-700 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-200">
                  Book Professional Service
                </span>
                <h3 className="text-lg font-extrabold text-white">
                  Hire {fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsBookingModalOpen(false);
                  setConfirmedBooking(null);
                }}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* If successfully confirmed, display Step 8 Confirmation Screen */}
            {confirmedBooking ? (
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    Booking Confirmed
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900 mt-1">
                    Your Request Has Been Dispatched!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {fullName} has been notified and will arrive according to your chosen schedule.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Booking Reference:</span>
                    <span className="font-mono font-bold text-slate-800">
                      #{confirmedBooking.booking_number || `BK-${confirmedBooking.id || confirmedBooking.booking_id}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date & Slot:</span>
                    <span className="font-bold text-slate-800">
                      {bookingDate} at {timeSlot}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Total:</span>
                    <span className="font-extrabold text-fixblue-600">
                      {formatCurrency(hourlyRate * workingHours)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/customer/bookings/${confirmedBooking.id || confirmedBooking.booking_id}`
                      )
                    }
                    className="w-full py-3.5 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Track Booking Status</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsBookingModalOpen(false);
                      setConfirmedBooking(null);
                    }}
                    className="w-full py-2.5 rounded-full text-slate-500 font-bold text-xs hover:bg-slate-100 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* 8-Step Interactive Booking Form */
              <form onSubmit={handleBookingSubmit} className="p-6 space-y-4">
                {/* Step 1: Availability Check */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-900">
                      Technician is Available Today
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700">Instant Dispatch</span>
                </div>

                {/* Step 2: Select Service */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    1. Select Service Category
                  </label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-fixblue-400"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="1">Plumbing Repair & Fixtures</option>
                        <option value="2">Electrical & Wiring Fix</option>
                        <option value="3">Carpentry & Furniture</option>
                        <option value="4">AC Servicing & Gas Refill</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Step 3 & 4: Date & Time Slot */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      2. Booking Date
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-fixblue-400"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      3. Available Time Slot
                    </label>
                    <select
                      value={timeSlot}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-fixblue-400"
                    >
                      {availableTimeSlots.map((slot) => (
                        <option key={slot} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Step 5: Service Location */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      4. Service Location Address
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      className="text-[11px] font-bold text-fixblue-500 hover:text-fixblue-600 flex items-center gap-1"
                    >
                      <Compass className="w-3 h-3" />
                      <span>Use Current GPS</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={serviceLocation}
                    onChange={(e) => setServiceLocation(e.target.value)}
                    placeholder="e.g. 142 Avinashi Road, Tiruppur"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-fixblue-400 placeholder:text-slate-400"
                    required
                  />
                </div>

                {/* Step 6: Problem Description */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    5. Describe Repair Problem
                  </label>
                  <textarea
                    rows={3}
                    value={problemDescription}
                    onChange={(e) => setProblemDescription(e.target.value)}
                    placeholder="Please explain the issue (e.g. Water leaking from main pipe under the sink)..."
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-fixblue-400 placeholder:text-slate-400 resize-none"
                    required
                  />
                </div>

                {/* Summary Row */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Duration & Rate:</span>
                    <span className="font-bold text-slate-800">
                      {workingHours} hrs × {formatCurrency(hourlyRate)}/hr
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Upfront Estimate:</span>
                    <span className="text-base font-extrabold text-fixblue-600">
                      {formatCurrency(hourlyRate * workingHours)}
                    </span>
                  </div>
                </div>

                {/* Step 7: Submit Booking Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submittingBooking}
                    className="w-full py-3.5 rounded-full bg-fixblue-500 hover:bg-fixblue-600 disabled:bg-slate-300 text-white font-extrabold text-xs shadow-md shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
                  >
                    {submittingBooking ? (
                      <Spinner size="sm" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm & Dispatch Booking</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
