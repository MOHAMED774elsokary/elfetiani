/* eslint-disable no-undef */
// Firebase Cloud Messaging Service Worker
// This runs in the background and handles push notifications when the app is not in the foreground.
//
// SECURITY NOTE: Firebase config values below are intentionally hardcoded.
// Service Workers run outside the Vite build pipeline and CANNOT read environment variables.
// Firebase API keys are designed to be public — they identify the project, not authenticate access.
// All actual security is enforced server-side via Firestore Security Rules and Firebase Auth.
// See: https://firebase.google.com/docs/projects/api-keys

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

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'الفتياني Coaching';
  const notificationOptions = {
    body: payload.notification?.body || 'لديك إشعار جديد',
    icon: '/icons/icon-512x512.svg',
    badge: '/favicon.svg',
    tag: payload.data?.type || 'general',
    data: payload.data || {},
    dir: 'rtl',
    lang: 'ar',
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: 'فتح التطبيق' },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  let url = '/';

  // Route based on notification type
  if (data.type === 'chat_message' || data.type === 'workout_assigned' ||
      data.type === 'nutrition_updated' || data.type === 'checkin_reviewed') {
    url = data.clientId ? '/#/portal/dashboard' : '/#/portal/admin';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Otherwise open a new window
      return clients.openWindow(url);
    })
  );
});
