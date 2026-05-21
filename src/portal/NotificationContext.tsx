// ─── Notification Context ───────────────────────────────────────────────────
// Provides real-time notification state and push-notification setup to the app.

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  subscribeToNotifications,
  requestNotificationPermission,
  onForegroundMessage,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from './notifications';

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  fcmToken: string | null;
  permissionStatus: NotificationPermission | 'default';
  requestPermission: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | 'default'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Subscribe to real-time notifications from Firestore
  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToNotifications(currentUser.uid, (notifs) => {
      setNotifications(notifs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Set up foreground message handler
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onForegroundMessage((payload) => {
      console.log('Foreground FCM message:', payload);

      // Show a browser notification even when the app is in the foreground
      if (Notification.permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title || 'الفتياني Coaching', {
          body: payload.notification.body || '',
          icon: '/icons/icon-512x512.svg',
          badge: '/favicon.svg',
          dir: 'rtl',
          lang: 'ar',
        });
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Auto-request permission on login if already granted
  useEffect(() => {
    if (!currentUser) return;
    if (typeof Notification === 'undefined') return;

    if (Notification.permission === 'granted') {
      requestNotificationPermission(currentUser.uid).then((token) => {
        if (token) setFcmToken(token);
      });
    }
  }, [currentUser]);

  const requestPermission = useCallback(async () => {
    if (!currentUser) return;
    try {
      const token = await requestNotificationPermission(currentUser.uid);
      if (token) {
        setFcmToken(token);
        setPermissionStatus('granted');
        alert('✅ تم تفعيل الإشعارات بنجاح!');
      } else {
        setPermissionStatus(Notification.permission);
        if (Notification.permission === 'denied') {
          alert('❌ المتصفح يمنع الإشعارات. يرجى تفعيلها من إعدادات المتصفح.');
        } else {
          alert('⚠️ حدثت مشكلة أثناء تسجيل الجهاز (FCM Token لم يصدر). راجع الـ Console للتفاصيل.');
        }
      }
    } catch (err: any) {
      alert('❌ خطأ غير متوقع: ' + err.message);
    }
  }, [currentUser]);

  const markRead = useCallback(async (id: string) => {
    await markNotificationRead(id);
  }, []);

  const markAllRead = useCallback(async () => {
    if (!currentUser) return;
    await markAllNotificationsRead(currentUser.uid);
  }, [currentUser]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fcmToken,
        permissionStatus,
        requestPermission,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside <NotificationProvider>');
  return ctx;
}
