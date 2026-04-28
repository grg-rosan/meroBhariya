// src/shared/context/NotificationContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../modules/auth/AuthContext';
const NotificationContext = createContext(null);
const STORAGE_KEY = (userId) => `porter_notifications_${userId}`;

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState(() => {
    if (!user?.id) return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY(user.id));
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });

  useEffect(() => {
    if (!user?.id) return;
    localStorage.setItem(STORAGE_KEY(user.id), JSON.stringify(notifications));
  }, [notifications, user?.id]);

  // persist to localStorage on every change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const push = useCallback((notification) => {
    const id = Date.now();
    setNotifications(prev => [{ id, ...notification, read: false }, ...prev]);
  }, []);

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ notifications, push, markRead, markAllRead, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}