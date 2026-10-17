import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { formatRelativeTime } from '../../utils/formatters';
import {
  Calendar,
  AlertTriangle,
  CreditCard,
  CheckCircle,
  FileText,
  Clock,
  ShieldAlert,
  Bell,
} from 'lucide-react';

const NOTIF_ICONS = {
  BOOKING: Calendar,
  ASSIGNMENT: Clock,
  PAYMENT: CreditCard,
  ESTIMATE: FileText,
  EMERGENCY: AlertTriangle,
  CLAIM: ShieldAlert,
  REVIEW: CheckCircle,
};

export default function NotificationList({
  notifications = [],
  onItemClick,
  className = '',
}) {
  const { markRead } = useNotifications();

  if (!notifications || notifications.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400">
        <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-xs">No notifications yet</p>
      </div>
    );
  }

  const getIcon = (type) => {
    if (!type) return Bell;
    const upper = type.toUpperCase();
    for (const [key, Icon] of Object.entries(NOTIF_ICONS)) {
      if (upper.includes(key)) return Icon;
    }
    return Bell;
  };

  const handleItemClick = (notif) => {
    if (!notif.is_read) {
      markRead(notif.id);
    }
    if (onItemClick) {
      onItemClick(notif);
    }
  };

  return (
    <div className={`divide-y divide-slate-100 ${className}`}>
      {notifications.map((notif) => {
        const IconComponent = getIcon(notif.type);
        const isUnread = !notif.is_read;

        return (
          <div
            key={notif.id}
            onClick={() => handleItemClick(notif)}
            className={`
              p-3.5 flex items-start gap-3 cursor-pointer transition-colors
              ${isUnread ? 'bg-sky-50/50 hover:bg-sky-50' : 'bg-white hover:bg-slate-50'}
            `}
          >
            <div
              className={`p-2 rounded-xl shrink-0 ${
                isUnread
                  ? 'bg-fixteal-100 text-fixteal-800'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <IconComponent className="w-4 h-4" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h5
                  className={`text-xs truncate ${
                    isUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                  }`}
                >
                  {notif.title}
                </h5>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {formatRelativeTime(notif.created_at)}
                </span>
              </div>

              <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                {notif.message}
              </p>
            </div>

            {isUnread && (
              <span className="w-2 h-2 rounded-full bg-fixteal-500 shrink-0 mt-1.5" />
            )}
          </div>
        );
      })}
    </div>
  );
}
