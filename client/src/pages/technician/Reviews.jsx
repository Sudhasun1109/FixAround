import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { techniciansApi } from '../../services/api';
import StarRating from '../../components/review/StarRating';
import ReviewCard from '../../components/review/ReviewCard';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { Star, ThumbsUp, ShieldCheck } from 'lucide-react';

export default function TechnicianReviews() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await techniciansApi.getReviews(user?.id);
      const list = res?.data?.reviews || res?.data || [];
      setReviews(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load technician reviews:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const avgRating = Number(user?.avg_rating || 4.8);
  const totalReviews = reviews.length;

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          Performance & Feedback
        </span>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
          Client Reviews & Testimonials
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Honest feedback received from customers after completed repairs.
        </p>
      </div>

      {/* Rating Snapshot Card */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-amber-50 text-amber-500 flex flex-col items-center justify-center border border-amber-200/60 shadow-xs">
            <span className="text-3xl font-extrabold">{avgRating.toFixed(1)}</span>
            <span className="text-[10px] font-bold uppercase text-amber-700">out of 5</span>
          </div>

          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">Overall Rating Score</h3>
            <StarRating rating={avgRating} size="md" />
            <p className="text-xs text-slate-400">
              Calculated from {totalReviews} client reviews
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-500 max-w-xs text-center sm:text-right">
          <span className="inline-flex items-center gap-1 font-bold text-fixteal-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            FixAround Verified
          </span>
          <p className="leading-relaxed">
            Maintaining a rating above 4.2 qualifies you for priority emergency dispatch matching.
          </p>
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <Spinner size="lg" label="Loading customer reviews..." className="py-16" />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No customer reviews yet"
          description="Customer reviews and ratings will be showcased here once your active jobs are completed."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reviews.map((rev) => (
            <ReviewCard key={rev.id} review={rev} />
          ))}
        </div>
      )}
    </div>
  );
}
