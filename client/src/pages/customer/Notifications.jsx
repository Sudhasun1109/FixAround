import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import NotificationList from '../../components/notification/NotificationList';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { Bell, CheckCheck, RefreshCw } from 'lucide-react';

export default function CustomerNotifications() {
  const {
    notifications,
    unreadCount,
    loading,
    markAllRead,
    fetchNotifications,
  } = useNotifications();

  const [filter, setFilter] = useState('ALL');

  const filteredList = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read;
    return true;
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-fixteal-600 uppercase tracking-wider">
            Activity & Alerts
          </span>
          <h1 className="text-2xl font-extrabold text-fixblue-900 mt-0.5">
            Notifications Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status updates on technician arrival, estimates, and warranty reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={fetchNotifications}
          >
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              icon={CheckCheck}
              onClick={markAllRead}
            >
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === 'ALL'
              ? 'bg-fixblue-800 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Notifications ({notifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
            filter === 'UNREAD'
              ? 'bg-fixblue-800 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading && notifications.length === 0 ? (
          <Spinner size="lg" label="Loading notifications..." className="py-16" />
        ) : (
          <NotificationList notifications={filteredList} />
        )}
      </div>
    </div>
  );
}
