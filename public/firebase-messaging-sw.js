/* eslint-disable no-undef */
/**
 * Combined Service Worker:
 * - Firebase Cloud Messaging (background push notifications)
 * - Workbox PWA caching (offline support)
 *
 * IMPORTANT: This file is registered by VitePWA as the main service worker.
 * It must be at /firebase-messaging-sw.js so Firebase getToken() can find it.
 *
 * SECURITY NOTE: Firebase config values are intentionally hardcoded here.
 * Service Workers run outside the Vite build pipeline and CANNOT read environment variables.
 * Firebase API keys are public-safe — see: https://firebase.google.com/docs/projects/api-keys
 */

// ─── Firebase Messaging ──────────────────────────────────────────────────────
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.8.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAp9zdGpdZvy3-4ndScqCj05bXdgsctZS8',
  authDomain: 'coaching-cd245.firebaseapp.com',
  projectId: 'coaching-cd245',
  storageBucket: 'coaching-cd245.firebasestorage.app',
  messagingSenderId: '911488374306',
  appId: '1:911488374306:web:197ef393a4ba447e721c7b',
});

const messaging = firebase.messaging();

// Handle background push messages (app closed or not focused)
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background FCM message:', payload);

  const title = payload.notification?.title || 'الفتياني Coaching';
  const options = {
    body: payload.notification?.body || 'لديك إشعار جديد',
    icon: '/icons/icon-512x512.svg',
    badge: '/favicon.svg',
    tag: payload.data?.type || 'general',
    data: payload.data || {},
    dir: 'rtl',
    lang: 'ar',
    requireInteraction: true,   // stay on screen until user taps
    vibrate: [200, 100, 200, 100, 200],
    actions: [
      { action: 'open', title: 'فتح التطبيق' },
      { action: 'dismiss', title: 'إغلاق' },
    ],
  };

  self.registration.showNotification(title, options);
});

// Handle notification click — open/focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const data = event.notification.data || {};
  let url = '/';

  if (data.type === 'workout_assigned') url = '/#/portal/dashboard/workout';
  else if (data.type === 'nutrition_updated') url = '/#/portal/dashboard/nutrition';
  else if (data.type === 'checkin_reviewed') url = '/#/portal/dashboard/checkin';
  else if (data.type === 'checkin_submitted') url = '/#/portal/admin';
  else if (data.type === 'chat_message') url = '/#/portal/dashboard';
  else url = '/#/portal/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ─── Workbox PWA Caching (injected by VitePWA at build time) ─────────────────
// The line below is replaced by VitePWA's manifest injection during build.
// It enables offline caching, asset precaching, and PWA functionality.
self.__WB_MANIFEST;
