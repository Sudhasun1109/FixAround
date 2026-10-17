import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function StarRating({
  rating = 0,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onChange,
  showScore = false,
  className = '',
}) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-7 h-7',
  };

  const activeValue = hoverRating || rating || 0;

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxStars }).map((_, index) => {
          const starValue = index + 1;
          const isFilled = activeValue >= starValue;
          const isHalf = !isFilled && activeValue >= starValue - 0.5;

          if (interactive) {
            return (
              <button
                key={index}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110 p-0.5"
                onMouseEnter={() => setHoverRating(starValue)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => onChange && onChange(starValue)}
                aria-label={`Rate ${starValue} of ${maxStars} stars`}
              >
                <Star
                  className={`
                    ${sizes[size] || sizes.md} transition-colors
                    ${
                      isFilled
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-300'
                    }
                  `}
                />
              </button>
            );
          }

          return (
            <Star
              key={index}
              className={`
                ${sizes[size] || sizes.md} shrink-0
                ${
                  isFilled
                    ? 'text-amber-400 fill-amber-400'
                    : isHalf
                    ? 'text-amber-400 fill-amber-400/50'
                    : 'text-slate-200 fill-slate-100'
                }
              `}
            />
          );
        })}
      </div>

      {showScore && (
        <span className="text-xs font-bold text-slate-700 ml-0.5">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
}
