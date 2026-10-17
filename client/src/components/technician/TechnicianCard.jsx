import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../review/StarRating';
import SkillBadges from './SkillBadges';
import { formatDistance } from '../../utils/formatters';
import { ShieldCheck, MapPin, CheckCircle, ArrowRight, Briefcase } from 'lucide-react';

export default function TechnicianCard({ technician, onBookNow }) {
  if (!technician) return null;

  const fullName =
    technician.full_name ||
    `${technician.first_name || ''} ${technician.last_name || ''}`.trim() ||
    'Certified Technician';

  const isOnline = Boolean(technician.is_online);
  const isAvailable = Boolean(technician.is_available);
  const isVerified = technician.verification_status === 'approved';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
      <div>
        {/* Top Info */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center text-fixblue-900 font-bold text-lg">
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

            {/* Online Indicator */}
            <span
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                isOnline && isAvailable
                  ? 'bg-emerald-500'
                  : isOnline
                  ? 'bg-amber-500'
                  : 'bg-slate-300'
              }`}
              title={
                isOnline && isAvailable
                  ? 'Online & Available'
                  : isOnline
                  ? 'Online (Busy)'
                  : 'Offline'
              }
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-base font-bold text-fixblue-900 truncate">
                {fullName}
              </h4>
              {isVerified && (
                <ShieldCheck className="w-4 h-4 text-fixteal-600 shrink-0" title="Verified Professional" />
              )}
            </div>

            {/* Rating & Reviews */}
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={Number(technician.avg_rating || 0)} size="sm" showScore />
              <span className="text-xs text-slate-400">
                ({technician.review_count || 0})
              </span>
            </div>

            {/* Stats: Distance & Jobs */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              {technician.distance !== undefined && (
                <span className="flex items-center gap-1 text-fixteal-700 font-medium">
                  <MapPin className="w-3.5 h-3.5" />
                  {formatDistance(technician.distance)}
                </span>
              )}

              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                {technician.completed_jobs || 0} jobs done
              </span>
            </div>
          </div>
        </div>

        {/* Bio snippet */}
        {technician.bio && (
          <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {technician.bio}
          </p>
        )}

        {/* Skills */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <SkillBadges skills={technician.skills || technician.categories || []} max={3} />
        </div>
      </div>

      {/* Footer Action */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
        <div className="text-xs">
          <span className="text-slate-400 block">Experience</span>
          <span className="font-bold text-slate-700">
            {technician.experience_years ? `${technician.experience_years} Years` : 'Certified'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/technicians/${technician.id || technician.user_id}`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Profile
          </Link>

          {onBookNow ? (
            <button
              type="button"
              onClick={() => onBookNow(technician)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-fixblue-800 text-white hover:bg-fixblue-900 transition-colors shadow-xs"
            >
              <span>Book</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Link
              to={`/customer/book?technicianId=${technician.id || technician.user_id}`}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-fixblue-800 text-white hover:bg-fixblue-900 transition-colors shadow-xs"
            >
              <span>Book</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
