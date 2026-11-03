import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../review/StarRating';
import { formatCurrency, formatDistance } from '../../utils/formatters';
import {
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  Briefcase,
  Star,
  CheckCircle2,
} from 'lucide-react';

export default function TechnicianCard({
  technician,
  onBookNow,
  variant = 'horizontal', // 'horizontal' (Screen 1 style) | 'grid'
}) {
  if (!technician) return null;

  const fullName =
    technician.full_name ||
    `${technician.first_name || ''} ${technician.last_name || ''}`.trim() ||
    'Professional Specialist';

  const isOnline = Boolean(technician.is_online);
  const isAvailable = Boolean(technician.is_available);
  const isVerified = technician.verification_status === 'approved';
  const rating = Number(technician.avg_rating || technician.rating || 4.8);
  const reviewCount = Number(technician.review_count || 120);
  const experienceYears = technician.experience_years || technician.experience || 5;

  // Primary skill or specialization
  const specialization =
    technician.specialization ||
    technician.primary_service ||
    technician.skills?.[0]?.name ||
    'Home Repair Expert';

  const hourlyPrice = technician.hourly_rate || technician.base_price || 499;

  // Default avatars matching trade
  const defaultAvatars = [
    'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=500&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
  ];
  const avatarIndex = Math.abs((Number(technician.id) || 0) % defaultAvatars.length);
  const avatarSrc = technician.avatar_url || defaultAvatars[avatarIndex];

  // HORIZONTAL CARD (Matching Screen 1 - Top Rated Experts)
  if (variant === 'horizontal') {
    return (
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-sm hover:shadow-card transition-all duration-300 flex flex-col sm:flex-row items-center justify-between gap-4 group">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          {/* Technician Image */}
          <div className="relative shrink-0">
            <img
              src={avatarSrc}
              alt={fullName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border border-slate-100 shadow-2xs group-hover:scale-[1.02] transition-transform"
            />
            {isOnline && (
              <span
                className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-xs"
                title="Online & Ready"
              />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-fixblue-600 transition-colors truncate">
                {fullName}
              </h3>
              {isVerified && (
                <ShieldCheck
                  className="w-4 h-4 text-fixblue-500 shrink-0"
                  title="Verified Professional"
                />
              )}
            </div>

            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {specialization}
            </p>

            {/* Price Row */}
            <div className="mt-1.5 flex items-baseline gap-1">
              <span className="text-base sm:text-lg font-extrabold text-slate-900">
                {formatCurrency(hourlyPrice)}
              </span>
              <span className="text-xs text-slate-400 font-medium">/hour</span>
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <div className="flex items-center gap-1 text-amber-500">
                <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                <span className="text-xs font-bold text-slate-800">
                  {rating.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-slate-400">
                ({reviewCount})
              </span>
              <span className="text-slate-300 text-xs">&bull;</span>
              <span className="text-xs font-medium text-slate-500">
                {experienceYears}+ yrs exp
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <Link
            to={`/technicians/${technician.id}`}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-fixblue-600 rounded-full hover:bg-slate-50 transition-colors"
          >
            View Profile
          </Link>

          {onBookNow ? (
            <button
              type="button"
              onClick={() => onBookNow(technician)}
              className="px-6 py-2.5 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all"
            >
              Book Now
            </button>
          ) : (
            <Link
              to={`/customer/book?technician_id=${technician.id}`}
              className="px-6 py-2.5 rounded-full bg-fixblue-500 hover:bg-fixblue-600 text-white font-bold text-xs shadow-md shadow-blue-500/25 active:scale-95 transition-all"
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    );
  }

  // GRID CARD (For Search Directory & Multicolumn Views)
  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-card transition-all duration-300 flex flex-col justify-between group">
      <div>
        <div className="relative mb-4">
          <img
            src={avatarSrc}
            alt={fullName}
            className="w-full h-44 rounded-2xl object-cover border border-slate-100"
          />
          {isVerified && (
            <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-fixblue-600 flex items-center gap-1 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-fixblue-500" />
              Verified
            </span>
          )}
          {isOnline && (
            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Available
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-base font-bold text-slate-900 group-hover:text-fixblue-600 transition-colors">
              {fullName}
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {specialization}
            </p>
          </div>
          <div className="text-right">
            <span className="text-base font-extrabold text-slate-900">
              {formatCurrency(hourlyPrice)}
            </span>
            <span className="block text-[10px] text-slate-400">/hr</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
            <span className="font-bold text-slate-800">{rating.toFixed(1)}</span>
          </div>
          <span>({reviewCount} reviews)</span>
          <span className="text-slate-300">&bull;</span>
          <span>{experienceYears}+ yrs</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link
          to={`/technicians/${technician.id}`}
          className="text-center py-2 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          Profile
        </Link>
        <Link
          to={`/customer/book?technician_id=${technician.id}`}
          className="text-center py-2 px-3 text-xs font-bold text-white bg-fixblue-500 hover:bg-fixblue-600 rounded-full shadow-sm shadow-blue-500/25 transition-all"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
