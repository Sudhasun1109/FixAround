import React, { useState } from 'react';
import StarRating from './StarRating';
import Input from '../common/Input';
import Textarea from '../common/Textarea';
import Button from '../common/Button';
import { Send } from 'lucide-react';

export default function ReviewForm({
  bookingId,
  technicianId,
  initialData = null,
  onSubmit,
  loading = false,
  onCancel,
}) {
  const [rating, setRating] = useState(initialData?.rating || 5);
  const [title, setTitle] = useState(initialData?.title || '');
  const [comment, setComment] = useState(initialData?.comment || '');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating || rating < 1) {
      setError('Please select a star rating (1-5 stars)');
      return;
    }
    if (!comment.trim()) {
      setError('Please provide feedback describing your experience');
      return;
    }
    setError('');

    onSubmit({
      booking_id: bookingId,
      technician_id: technicianId,
      rating,
      title: title.trim(),
      comment: comment.trim(),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Your Rating <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-3">
          <StarRating
            rating={rating}
            size="lg"
            interactive
            onChange={(val) => {
              setRating(val);
              if (error) setError('');
            }}
          />
          <span className="text-sm font-bold text-slate-700">
            {rating} of 5 Stars
          </span>
        </div>
      </div>

      <Input
        label="Review Headline (Optional)"
        placeholder="e.g. Prompt arrival, excellent repair work!"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={150}
      />

      <Textarea
        label="Your Review Details"
        required
        placeholder="Share your experience regarding punctuality, cleanliness, quality of repair, and pricing..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={4}
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="secondary"
          loading={loading}
          icon={Send}
        >
          {initialData ? 'Update Review' : 'Submit Review'}
        </Button>
      </div>
    </form>
  );
}
