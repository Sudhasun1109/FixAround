import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { techniciansApi } from '../../services/api';
import StarRating from '../../components/review/StarRating';
import SkillBadges from '../../components/technician/SkillBadges';
import ReviewCard from '../../components/review/ReviewCard';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import {
  ShieldCheck,
  MapPin,
  Briefcase,
  Calendar,
  Clock,
  ArrowLeft,
  Award,
  CheckCircle,
} from 'lucide-react';

export default function TechnicianProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [technician, setTechnician] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      } catch (err) {
        setError(err.message || 'Technician not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return <Spinner fullScreen label="Loading professional profile..." />;
  }

  if (error || !technician) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Technician Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">{error || 'Could not locate this professional.'}</p>
        <Link to="/customer/search">
          <Button variant="outline" icon={ArrowLeft}>
            Back to Technician Directory
          </Button>
        </Link>
      </div>
    );
  }

  const fullName =
    technician.full_name ||
    `${technician.first_name || ''} ${technician.last_name || ''}`.trim() ||
    'Certified Specialist';

  const isVerified = technician.verification_status === 'approved';

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      <Link
        to="/customer/search"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-fixblue-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Search</span>
      </Link>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-fixblue-900 font-extrabold text-2xl shrink-0">
              {technician.avatar_url ? (
                <img
                  src={technician.avatar_url}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{fullName[0]}</span>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-fixblue-900">
                  {fullName}
                </h1>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-fixteal-700 border border-teal-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verified Pro
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <StarRating rating={Number(technician.avg_rating || 0)} size="md" showScore />
                <span className="text-xs text-slate-400">
                  ({technician.review_count || 0} customer reviews)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {technician.completed_jobs || 0} Jobs Completed
                </span>

                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  {technician.experience_years || 1}+ Years Experience
                </span>

                {technician.service_city && (
                  <span className="flex items-center gap-1 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-fixteal-600" />
                    {technician.service_city} ({technician.service_radius_km || 10}km radius)
                  </span>
                )}
              </div>
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            icon={Calendar}
            onClick={() => navigate(`/customer/book?technicianId=${technician.id || technician.user_id}`)}
            className="w-full sm:w-auto shrink-0 shadow-md"
          >
            Book This Technician
          </Button>
        </div>

        {/* Bio */}
        {technician.bio && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Professional Background
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {technician.bio}
            </p>
          </div>
        )}

        {/* Skills */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
            Service Capabilities & Skills
          </h3>
          <SkillBadges skills={technician.skills || technician.categories || []} size="md" />
        </div>
      </div>

      {/* Reviews Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-fixblue-900">
          Customer Feedback & Reviews ({reviews.length})
        </h2>

        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((rev) => (
              <ReviewCard key={rev.id} review={rev} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
            No public reviews posted yet for this technician.
          </div>
        )}
      </div>
    </div>
  );
}
