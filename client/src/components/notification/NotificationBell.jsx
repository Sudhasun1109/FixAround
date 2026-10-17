import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../hooks/useAuth';
import NotificationList from './NotificationList';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';

export default function NotificationBell() {
  const { unreadCount, notifications, markAllRead } = useNotifications();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fullNotificationsPath =
    user?.role === 'technician'
      ? '/technician/dashboard'
      : user?.role === 'admin'
      ? '/admin/audit-logs'
      : '/customer/notifications';

  return (
    <div className="relative" ref={bellRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-600 hover:text-fixblue-900 hover:bg-slate-100 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[10px] font-bold text-white items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-100 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-[11px] font-semibold text-fixteal-600 hover:text-fixteal-700 flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            <NotificationList
              notifications={notifications.slice(0, 5)}
              onItemClick={() => setIsOpen(false)}
            />
          </div>

          <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
            <Link
              to={fullNotificationsPath}
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-fixblue-800 hover:text-fixblue-950 inline-flex items-center gap-1.5"
            >
              <span>View all notifications</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
