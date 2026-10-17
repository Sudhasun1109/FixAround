import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../services/api';
import StarRating from '../../components/review/StarRating';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import { formatDateTime } from '../../utils/formatters';
import { showToast } from '../../components/common/Toast';
import { Star, Eye, EyeOff, Trash2, CheckCircle2 } from 'lucide-react';

export default function ReviewModeration() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Delete State
  const [deletingId, setDeletingId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getReviews({
        page,
        limit: 10,
      });

      const list = res?.data?.reviews || res?.data || [];
      const pagination = res?.pagination || {};

      setReviews(Array.isArray(list) ? list : []);
      setTotalPages(pagination.totalPages || 1);
      setTotalCount(pagination.total || list.length);
    } catch (err) {
      console.error('Failed to load reviews for moderation:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleToggleVisibility = async (review) => {
    const nextVis = review.is_visible ? 0 : 1;
    try {
      await adminApi.toggleReviewVisibility(review.id, nextVis);
      showToast.success(`Review visibility set to: ${nextVis ? 'Visible' : 'Hidden'}`);
      fetchReviews();
    } catch (err) {
      showToast.error(err.message || 'Failed to toggle visibility');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);
      await adminApi.deleteReview(deletingId);
      showToast.success('Review permanently deleted.');
      setDeletingId(null);
      fetchReviews();
    } catch (err) {
      showToast.error(err.message || 'Failed to delete review');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          Content Moderation
        </span>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
          Customer Review & Rating Moderation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Monitor public customer ratings, conceal inappropriate reviews, or remove abusive feedback.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading ? (
          <Spinner size="lg" label="Loading reviews for moderation..." className="py-16" />
        ) : reviews.length === 0 ? (
          <EmptyState
            icon={Star}
            title="No reviews in moderation queue"
            description="All platform ratings and reviews are currently moderated."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className={`p-6 space-y-3 transition-colors ${
                  !rev.is_visible ? 'bg-slate-50/80 opacity-75' : 'bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <StarRating rating={rev.rating} size="sm" showScore />
                    <span className="text-xs text-slate-400">
                      &bull; Booking #{rev.booking_id}
                    </span>
                    {!rev.is_visible && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                        HIDDEN FROM PUBLIC
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={rev.is_visible ? EyeOff : Eye}
                      onClick={() => handleToggleVisibility(rev)}
                    >
                      {rev.is_visible ? 'Hide from Public' : 'Make Visible'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      icon={Trash2}
                      onClick={() => setDeletingId(rev.id)}
                      className="text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="text-xs text-slate-600">
                  <span>Author: <strong>{rev.customer_name || 'Customer'}</strong></span>
                  <span className="mx-2">&bull;</span>
                  <span>Reviewed Specialist: <strong>{rev.technician_name || 'Technician'}</strong></span>
                </div>

                {rev.title && (
                  <h4 className="text-sm font-bold text-slate-900">{rev.title}</h4>
                )}

                <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {rev.comment}
                </p>

                <p className="text-[11px] text-slate-400 pt-1">
                  Submitted {formatDateTime(rev.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalCount}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Review Permanently?"
        message="This action removes the review from public visibility and recalculates technician aggregate score."
        confirmText="Confirm Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
