import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import { AuthContext } from './AuthContext';
import { notificationsApi } from '../services/api';
import { showToast } from '../components/common/Toast';

export const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const seenNotificationIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  // Request browser / mobile system notification permission
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        try {
          const res = await Notification.requestPermission();
          return res;
        } catch (e) {
          console.warn('Notification permission request error:', e);
        }
      }
      return Notification.permission;
    }
    return 'unsupported';
  }, []);

  const triggerMobilePopupNotification = useCallback((item) => {
    // 1. In-app popup toast (visible on mobile / desktop screen)
    showToast.info(`${item.title || 'FixAround Update'}: ${item.message || ''}`, {
      duration: 5000,
      position: 'top-center',
    });

    // 2. Native System / PWA Push Notification if permission granted
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const notif = new Notification(item.title || 'FixAround Alert', {
          body: item.message,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          tag: `notif-${item.id}`,
        });
        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (err) {
        console.warn('Native notification failed:', err);
      }
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await notificationsApi.getAll({ limit: 20 });
      const items = res.data?.notifications || res.data || [];
      const notifArray = Array.isArray(items) ? items : [];
      setNotifications(notifArray);
      
      const countRes = await notificationsApi.getUnreadCount();
      const count = countRes.data?.count ?? countRes.data?.unreadCount ?? notifArray.filter(n => !n.is_read).length;
      setUnreadCount(count);

      // Check for incoming new unread notifications to popup
      if (!isFirstLoadRef.current) {
        notifArray.forEach((item) => {
          if (!item.is_read && !seenNotificationIdsRef.current.has(item.id)) {
            triggerMobilePopupNotification(item);
          }
        });
      }

      // Record seen IDs
      notifArray.forEach((item) => {
        seenNotificationIdsRef.current.add(item.id);
      });
      isFirstLoadRef.current = false;
    } catch (err) {
      console.warn('Failed to fetch notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, triggerMobilePopupNotification]);

  // Initial fetch and 20-second polling
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      seenNotificationIdsRef.current.clear();
      isFirstLoadRef.current = true;
      return;
    }

    fetchNotifications();
    const interval = setInterval(() => {
      fetchNotifications();
    }, 20000);

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
    requestNotificationPermission,
    triggerMobilePopupNotification,
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
