import admin from 'firebase-admin';

/**
 * Per-client bi-weekly reminder system.
 *
 * Logic:
 * - Runs every day at 9:00 AM UTC (cron: "0 9 * * *")
 * - For each client, calculates how many days have passed since their startDate
 * - If it's exactly a multiple of 14 days (±1 day tolerance) AND no reminder was sent today → send it
 * - Stores lastReminderSentAt in Firestore collection "clientReminders"
 *
 * This means each client gets their OWN 2-week rhythm based on when they started,
 * not a global calendar-based blast to everyone at once.
 */

function ensureAdminInitialized(): string | null {
  if (admin.apps.length > 0) return null;

  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !clientEmail || !privateKey) {
    return `Missing env vars. projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`;
  }

  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    return null;
  } catch (e: any) {
    return `Firebase Admin init failed: ${e.message}`;
  }
}

/**
 * Returns true if today is a 14-day milestone for this client.
 * Uses the client's startDate as the anchor.
 * Tolerance: ±0 days (exact match only, since cron runs daily).
 */
function isDueTodayForClient(startDate: string): boolean {
  const start = new Date(startDate);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  start.setUTCHours(0, 0, 0, 0);

  const diffMs = today.getTime() - start.getTime();
  if (diffMs <= 0) return false; // hasn't started yet

  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays % 14 === 0;
}

/**
 * Returns true if a reminder was already sent within the last 12 hours for this client.
 * Prevents double-sending if the cron is retried.
 */
function wasRecentlySent(lastSentAt: admin.firestore.Timestamp | null): boolean {
  if (!lastSentAt) return false;
  const twelveHoursAgo = Date.now() - 12 * 60 * 60 * 1000;
  return lastSentAt.toMillis() > twelveHoursAgo;
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Security: verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.authorization;
    const provided = authHeader?.replace('Bearer ', '') ?? req.query?.secret;
    if (provided !== cronSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const initError = ensureAdminInitialized();
  if (initError) {
    console.error('[remind-clients]', initError);
    return res.status(500).json({ error: initError });
  }

  try {
    const firestore = admin.firestore();
    const today = new Date().toISOString().slice(0, 10);

    // 1. Fetch all clients
    const clientsSnap = await firestore.collection('clients').get();
    const clients = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    const results: Record<string, string> = {};

    for (const client of clients) {
      const clientId: string = client.id;
      const clientName: string = client.name || 'عزيزي العميل';
      const startDate: string = client.startDate;

      if (!startDate) {
        results[clientId] = 'skipped: no startDate';
        continue;
      }

      // Check if today is a 14-day milestone for this specific client
      if (!isDueTodayForClient(startDate)) {
        results[clientId] = 'skipped: not due today';
        continue;
      }

      // Check for duplicate send guard
      const reminderRef = firestore.collection('clientReminders').doc(clientId);
      const reminderDoc = await reminderRef.get();
      const lastSent = reminderDoc.exists ? (reminderDoc.data()?.lastSentAt as admin.firestore.Timestamp | null) : null;

      if (wasRecentlySent(lastSent)) {
        results[clientId] = 'skipped: already sent today';
        continue;
      }

      // 2. Get Firebase UID for this client
      const mappingSnap = await firestore
        .collection('userMappings')
        .where('clientId', '==', clientId)
        .get();

      if (mappingSnap.empty) {
        results[clientId] = 'skipped: no userMapping found';
        continue;
      }

      const uid: string = mappingSnap.docs[0].id;

      // 3. Get FCM tokens
      const tokensSnap = await firestore
        .collection('fcmTokens')
        .where('uid', '==', uid)
        .get();

      if (tokensSnap.empty) {
        results[clientId] = 'skipped: no FCM tokens registered';
        // Still mark reminder as "sent" so we don't keep retrying today
        await reminderRef.set({ lastSentAt: admin.firestore.FieldValue.serverTimestamp(), lastDate: today }, { merge: true });
        continue;
      }

      // 4. Write notification to Firestore (shows in the in-app bell)
      const notifId = `bi-remind-${today}-${uid.substring(0, 6)}`;
      await firestore.collection('notifications').doc(notifId).set({
        id: notifId,
        userId: uid,
        type: 'general',
        title: '⏰ تذكير الأسبوعين',
        body: `${clientName}، مرّت أسبوعان! حان وقت تسجيل وزنك ورفع صورة التقدم 📸⚖️`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        data: {},
      });

      // 5. Send push notification to all registered devices
      const tokens: string[] = tokensSnap.docs.map(d => d.data().token).filter(Boolean);
      const payload: admin.messaging.MulticastMessage = {
        notification: {
          title: '⏰ تذكير الأسبوعين',
          body: `${clientName}، مرّت أسبوعان! سجّل وزنك وارفع صورة تقدمك الآن 📸⚖️`,
        },
        data: {
          type: 'general',
          id: notifId,
          url: '/',
        },
        webpush: {
          notification: {
            icon: '/icons/icon-512x512.svg',
            badge: '/favicon.svg',
            dir: 'rtl',
            lang: 'ar',
            requireInteraction: true, // stays on screen until dismissed
            vibrate: [200, 100, 200],
          },
          fcmOptions: { link: '/' },
          headers: { Urgency: 'high' },
        },
        tokens,
      };

      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`[remind-clients] ${clientName} (${clientId}): sent=${response.successCount}, failed=${response.failureCount}`);

      // 6. Clean up stale tokens
      if (response.failureCount > 0) {
        const batch = firestore.batch();
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const code = resp.error?.code;
            if (code === 'messaging/registration-token-not-registered' ||
                code === 'messaging/invalid-registration-token') {
              batch.delete(tokensSnap.docs[idx].ref);
            }
          }
        });
        await batch.commit();
      }

      // 7. Record that reminder was sent
      await reminderRef.set({
        lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
        lastDate: today,
        clientName,
        successCount: response.successCount,
      }, { merge: true });

      results[clientId] = `sent to ${response.successCount}/${tokens.length} devices`;
    }

    console.log('[remind-clients] Done:', results);
    return res.status(200).json({ success: true, date: today, results });

  } catch (error: any) {
    console.error('[remind-clients] Fatal error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
