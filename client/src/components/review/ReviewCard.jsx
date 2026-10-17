import React from 'react';
import StarRating from './StarRating';
import { formatRelativeTime } from '../../utils/formatters';
import { User, CheckCircle2 } from 'lucide-react';

export default function ReviewCard({ review, showTechnician = false, onEdit, onDelete }) {
  if (!review) return null;

  const authorName = review.customer_name || review.author_name || 'Verified Customer';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-fixblue-900 font-bold text-sm">
            {review.customer_avatar ? (
              <img
                src={review.customer_avatar}
                alt={authorName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span>{authorName[0]}</span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-sm font-bold text-slate-800">{authorName}</h4>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" />
                Verified Job
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {formatRelativeTime(review.created_at)}
            </p>
          </div>
        </div>

        <StarRating rating={review.rating} size="sm" />
      </div>

      {showTechnician && review.technician_name && (
        <div className="text-xs text-slate-500">
          Serviced by <span className="font-semibold text-slate-700">{review.technician_name}</span>
        </div>
      )}

      {review.title && (
        <h5 className="text-sm font-bold text-slate-900 leading-snug">
          {review.title}
        </h5>
      )}

      {review.comment && (
        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
          {review.comment}
        </p>
      )}

      {(onEdit || onDelete) && (
        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(review)}
              className="text-fixteal-600 font-semibold hover:underline"
            >
              Edit Review
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(review)}
              className="text-rose-600 font-semibold hover:underline"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
