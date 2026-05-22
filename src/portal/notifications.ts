// ─── Notification Types & Firestore Helpers ─────────────────────────────────
// This module handles:
// 1. FCM token registration / storage
// 2. Notification creation in Firestore
// 3. Real-time notification listeners
// 4. Notification preferences

import {
  doc, setDoc, getDoc, getDocs, collection, query,
  where, orderBy, limit, onSnapshot, updateDoc,
  serverTimestamp, deleteDoc, Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging';
import { getAuth } from 'firebase/auth';
import { db } from './firebase';
import { initializeApp, getApps } from 'firebase/app';

// ─── Types ──────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'chat_message'
  | 'workout_assigned'
  | 'nutrition_updated'
  | 'checkin_reviewed'
  | 'checkin_submitted'
  | 'subscription_update'
  | 'general';

export interface AppNotification {
  id: string;
  userId: string;          // recipient uid
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: Timestamp | null;
  data?: Record<string, string>;  // extra data (clientId, etc.)
}

export interface NotificationPreferences {
  chatMessages: boolean;
  workoutUpdates: boolean;
  nutritionUpdates: boolean;
  checkinUpdates: boolean;
  subscriptionUpdates: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  chatMessages: true,
  workoutUpdates: true,
  nutritionUpdates: true,
  checkinUpdates: true,
  subscriptionUpdates: true,
};

// ─── FCM Token Management ───────────────────────────────────────────────────

/**
 * Get the existing Firebase app or initialize one.
 * We need this because `getMessaging` needs the app instance.
 */
function getFirebaseApp() {
  const apps = getApps();
  if (apps.length > 0) return apps[0];
  return initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
}

/**
 * Request notification permission, generate FCM token, and store it in Firestore.
 * Returns the token string or null if permission denied.
 */
export async function requestNotificationPermission(uid: string): Promise<string | null> {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    const app = getFirebaseApp();
    const messaging = getMessaging(app);

    // Get VAPID key from env
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      alert('⚠️ المتغير VITE_FIREBASE_VAPID_KEY غير موجود في إعدادات Vercel. لا يمكن تفعيل الإشعارات.');
      console.warn('VITE_FIREBASE_VAPID_KEY is not set. FCM tokens cannot be generated.');
      return null;
    }

    // Register the FCM service worker
    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (token) {
      // Store token in Firestore
      await saveDeviceToken(uid, token);
      console.log('FCM token saved:', token.substring(0, 20) + '...');
      return token;
    }

    return null;
  } catch (error: any) {
    console.error('Error requesting notification permission:', error);
    throw error;
  }
}

/**
 * Save device FCM token to Firestore.
 */
async function saveDeviceToken(uid: string, token: string): Promise<void> {
  const tokenRef = doc(db, 'fcmTokens', `${uid}_${token.substring(0, 10)}`);
  await setDoc(tokenRef, {
    uid,
    token,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    platform: detectPlatform(),
  });
}

/**
 * Remove a device token (e.g. on logout).
 */
export async function removeDeviceToken(uid: string, token: string): Promise<void> {
  try {
    const tokenRef = doc(db, 'fcmTokens', `${uid}_${token.substring(0, 10)}`);
    await deleteDoc(tokenRef);
  } catch (error) {
    console.error('Error removing device token:', error);
  }
}

function detectPlatform(): string {
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'web';
}

// ─── Foreground Message Handler ─────────────────────────────────────────────

export type ForegroundMessageHandler = (payload: MessagePayload) => void;

/**
 * Set up a listener for foreground messages.
 * Returns an unsubscribe function.
 */
export function onForegroundMessage(handler: ForegroundMessageHandler): Unsubscribe {
  try {
    const app = getFirebaseApp();
    const messaging = getMessaging(app);
    return onMessage(messaging, handler);
  } catch {
    console.warn('FCM foreground listener not available');
    return () => {};
  }
}

// ─── Notification CRUD ──────────────────────────────────────────────────────

/**
 * Create a notification in Firestore (called when an action happens).
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const notifRef = doc(db, 'notifications', id);
  await setDoc(notifRef, {
    id,
    userId,
    type,
    title,
    body,
    read: false,
    createdAt: serverTimestamp(),
    data: data || {},
  });

  // Call Vercel Serverless Function to send Push Notification
  try {
    const auth = getAuth();
    if (auth.currentUser) {
      const idToken = await auth.currentUser.getIdToken();
      // Call the API endpoint. Uses relative path so it works in both dev (Vite proxy/direct) and prod (Vercel)
      fetch('/api/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          userId,
          type,
          title,
          body,
          data: data || {},
          notificationId: id
        })
      }).catch(err => console.error('Failed to trigger push notification:', err));
    }
  } catch (error) {
    console.error('Error getting auth token for push notification:', error);
  }
}

/**
 * Get all notifications for a user (latest 50).
 */
export async function getNotifications(userId: string): Promise<AppNotification[]> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as AppNotification);
}

/**
 * Subscribe to real-time notifications for a user.
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: AppNotification[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50),
  );
  return onSnapshot(q, (snap) => {
    const notifications = snap.docs.map((d) => d.data() as AppNotification);
    callback(notifications);
  });
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(notificationId: string): Promise<void> {
  const ref = doc(db, 'notifications', notificationId);
  await updateDoc(ref, { read: true });
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsRead(userId: string): Promise<void> {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false),
  );
  const snap = await getDocs(q);
  const promises = snap.docs.map((d) => updateDoc(d.ref, { read: true }));
  await Promise.all(promises);
}

// ─── Notification Preferences ───────────────────────────────────────────────

export async function getNotificationPreferences(uid: string): Promise<NotificationPreferences> {
  const ref = doc(db, 'notificationPreferences', uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return { ...DEFAULT_PREFERENCES, ...snap.data() } as NotificationPreferences;
  }
  return DEFAULT_PREFERENCES;
}

export async function saveNotificationPreferences(
  uid: string,
  prefs: NotificationPreferences,
): Promise<void> {
  const ref = doc(db, 'notificationPreferences', uid);
  await setDoc(ref, { ...prefs, updatedAt: serverTimestamp() });
}

// ─── Helper: Send Notification on Action ────────────────────────────────────
// These are convenience wrappers to fire notifications when specific actions happen.

export async function notifyWorkoutAssigned(clientUid: string, clientName: string): Promise<void> {
  await createNotification(
    clientUid,
    'workout_assigned',
    'تم تحديث التمارين 💪',
    `تم تحديث برنامج التمارين الخاص بك، ${clientName}`,
    { clientId: clientUid },
  );
}

export async function notifyNutritionUpdated(clientUid: string, clientName: string): Promise<void> {
  await createNotification(
    clientUid,
    'nutrition_updated',
    'تم تحديث التغذية 🥗',
    `تم تحديث خطة التغذية الخاصة بك، ${clientName}`,
    { clientId: clientUid },
  );
}

export async function notifyCheckinSubmitted(coachUid: string, clientName: string): Promise<void> {
  await createNotification(
    coachUid,
    'checkin_submitted',
    'تسجيل أسبوعي جديد 📊',
    `${clientName} أرسل تقريره الأسبوعي`,
  );
}

export async function notifyCheckinReviewed(clientUid: string): Promise<void> {
  await createNotification(
    clientUid,
    'checkin_reviewed',
    'تمت مراجعة التقرير ✅',
    'المدرب راجع تقريرك الأسبوعي',
    { clientId: clientUid },
  );
}

export async function notifyChatMessage(
  recipientUid: string,
  senderName: string,
  messagePreview: string,
): Promise<void> {
  await createNotification(
    recipientUid,
    'chat_message',
    `رسالة من ${senderName} 💬`,
    messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
  );
}

export async function notifyPhotoUploaded(coachUid: string, clientName: string): Promise<void> {
  await createNotification(
    coachUid,
    'checkin_submitted',
    `صورة تقدم جديدة 📸`,
    `${clientName} قام برفع صورة تقدم جديدة`,
  );
}

