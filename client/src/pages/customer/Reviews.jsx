import React, { useState, useEffect, useCallback } from 'react';
import { reviewsApi } from '../../services/api';
import ReviewCard from '../../components/review/ReviewCard';
import ReviewForm from '../../components/review/ReviewForm';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Spinner from '../../components/common/Spinner';
import EmptyState from '../../components/common/EmptyState';
import { showToast } from '../../components/common/Toast';
import { Star, MessageSquare } from 'lucide-react';

export default function CustomerReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingReview, setEditingReview] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete State
  const [deletingReview, setDeletingReview] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const res = await reviewsApi.getMyReviews();
      const list = res?.data?.reviews || res?.data || [];
      setReviews(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load reviews:', err);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleEditSubmit = async (formData) => {
    try {
      setEditLoading(true);
      await reviewsApi.update(editingReview.id, formData);
      showToast.success('Review updated successfully!');
      setEditingReview(null);
      fetchReviews();
    } catch (err) {
      showToast.error(err.message || 'Failed to update review');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      await reviewsApi.delete(deletingReview.id);
      showToast.success('Review removed.');
      setDeletingReview(null);
      fetchReviews();
    } catch (err) {
      showToast.error(err.message || 'Failed to delete review');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
          Feedback & Ratings
        </span>
        <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
          My Submitted Reviews
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Ratings and feedback you have provided to local technicians.
        </p>
      </div>

      {loading ? (
        <Spinner size="lg" label="Loading reviews..." className="py-16" />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={Star}
          title="No reviews submitted yet"
          description="Once your repair jobs are completed, you can rate and review your technicians here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reviews.map((rev) => (
            <ReviewCard
              key={rev.id}
              review={rev}
              showTechnician={true}
              onEdit={(r) => setEditingReview(r)}
              onDelete={(r) => setDeletingReview(r)}
            />
          ))}
        </div>
      )}

      {/* Edit Review Modal */}
      <Modal
        isOpen={Boolean(editingReview)}
        onClose={() => setEditingReview(null)}
        title="Edit Your Review"
        size="md"
      >
        {editingReview && (
          <ReviewForm
            bookingId={editingReview.booking_id}
            technicianId={editingReview.technician_id}
            initialData={editingReview}
            onSubmit={handleEditSubmit}
            loading={editLoading}
            onCancel={() => setEditingReview(null)}
          />
        )}
      </Modal>

      {/* Delete Review Confirm Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingReview)}
        onClose={() => setDeletingReview(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Review?"
        message="Are you sure you want to delete this rating? This action cannot be undone."
        confirmText="Yes, Delete"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
