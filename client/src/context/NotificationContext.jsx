import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { notificationsApi } from '../services/api';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await notificationsApi.getAll({ limit: 20 });
      const items = res.data?.notifications || res.data || [];
      setNotifications(Array.isArray(items) ? items : []);
      
      const countRes = await notificationsApi.getUnreadCount();
      const count = countRes.data?.count ?? countRes.data?.unreadCount ?? (Array.isArray(items) ? items.filter(n => !n.is_read).length : 0);
      setUnreadCount(count);
    } catch (err) {
      // Gracefully handle notifications failure without blocking app
      console.warn('Failed to fetch notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial fetch and 30-second polling
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [isAuthenticated, fetchNotifications]);

  const markRead = async (id) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1, read_at: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: 1, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
