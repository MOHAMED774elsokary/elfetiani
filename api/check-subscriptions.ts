import admin from 'firebase-admin';

/**
 * Daily subscription checker — runs at 8:00 AM UTC (cron: "0 8 * * *")
 *
 * Two jobs:
 * 1. AUTO-LOCK: Locks clients whose endDate has passed (expired subscriptions)
 * 2. WARNING:   Sends push + in-app notification to clients whose subscription
 *               expires within the next 5 days
 */

function ensureAdminInitialized(): string | null {
  if (admin.apps.length > 0) return null;

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
      admin.initializeApp({ credential: admin.credential.cert(JSON.parse(decodedKey)) });
      return null;
    } catch (e: any) {
      return `Failed to init from FIREBASE_SERVICE_ACCOUNT_KEY: ${e.message}`;
    }
  }

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let   privateKey  = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return `Missing env vars. projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`;
  }

  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
    return null;
  } catch (e: any) {
    return `Firebase Admin init failed: ${e.message}`;
  }
}

/** Get the Firebase Auth UID for a Firestore clientId */
async function getUidForClient(firestore: admin.firestore.Firestore, clientId: string): Promise<string | null> {
  const snap = await firestore.collection('userMappings').where('clientId', '==', clientId).get();
  return snap.empty ? null : snap.docs[0].id;
}

/** Send push + in-app notification to a client */
async function notifyClient(
  firestore: admin.firestore.Firestore,
  uid: string,
  clientName: string,
  title: string,
  body: string,
  notifIdPrefix: string,
  today: string,
) {
  const notifId = `${notifIdPrefix}-${today}-${uid.substring(0, 6)}`;

  // 1. In-app notification (bell)
  await firestore.collection('notifications').doc(notifId).set({
    id: notifId,
    userId: uid,
    type: 'general',
    title,
    body,
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    data: {},
  });

  // 2. Push notification
  const tokensSnap = await firestore.collection('fcmTokens').where('uid', '==', uid).get();
  if (tokensSnap.empty) return;

  const tokens: string[] = tokensSnap.docs.map(d => d.data().token).filter(Boolean);
  if (tokens.length === 0) return;

  const payload: admin.messaging.MulticastMessage = {
    notification: { title, body },
    data: { type: 'general', id: notifId, url: '/' },
    webpush: {
      notification: {
        icon: '/icons/icon-512x512.svg',
        badge: '/favicon.svg',
        dir: 'rtl',
        lang: 'ar',
        requireInteraction: true,
        vibrate: [200, 100, 200],
      },
      fcmOptions: { link: '/' },
      headers: { Urgency: 'high' },
    },
    tokens,
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(payload);
    console.log(`[check-subscriptions] ${clientName}: sent=${response.successCount}, failed=${response.failureCount}`);

    // Clean up stale tokens
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
  } catch (err) {
    console.error(`[check-subscriptions] Push send failed for ${clientName}:`, err);
  }
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
    console.error('[check-subscriptions]', initError);
    return res.status(500).json({ error: initError });
  }

  try {
    const firestore = admin.firestore();
    const today = new Date().toISOString().slice(0, 10);

    // Calculate 5 days from now
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 5);
    const warningDateStr = warningDate.toISOString().slice(0, 10);

    const clientsSnap = await firestore.collection('clients').get();
    const results: Record<string, string> = {};

    for (const doc of clientsSnap.docs) {
      const client = doc.data();
      const clientId = doc.id;
      const clientName = client.name || 'عزيزي العميل';
      const endDate = client.endDate;

      if (!endDate) {
        results[clientId] = 'skipped: no endDate';
        continue;
      }

      // ── 1. AUTO-LOCK: subscription expired ──────────────────────────
      if (endDate < today && !client.isLocked) {
        await firestore.collection('clients').doc(clientId).set(
          { isLocked: true, lockedAt: new Date().toISOString() },
          { merge: true }
        );

        const uid = await getUidForClient(firestore, clientId);
        if (uid) {
          // Revoke tokens so the client can't use the app
          try { await admin.auth().revokeRefreshTokens(uid); } catch {}

          await notifyClient(
            firestore, uid, clientName,
            '⚠️ انتهى اشتراكك',
            `${clientName}، اشتراكك انتهى. تواصل مع الكوتش لتجديد الاشتراك وإعادة تفعيل حسابك.`,
            'sub-expired',
            today,
          );
        }

        results[clientId] = 'LOCKED: subscription expired';
        continue;
      }

      // ── 2. WARNING: expires in ≤ 5 days ─────────────────────────────
      if (!client.isLocked && endDate >= today && endDate <= warningDateStr) {
        const daysLeft = Math.ceil(
          (new Date(endDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Don't send duplicate warnings — check if we already warned today
        const warningRef = firestore.collection('subscriptionWarnings').doc(`${clientId}_${today}`);
        const warningDoc = await warningRef.get();
        if (warningDoc.exists) {
          results[clientId] = `skipped: warning already sent today (${daysLeft} days left)`;
          continue;
        }

        const uid = await getUidForClient(firestore, clientId);
        if (uid) {
          const daysText = daysLeft === 1 ? 'يوم واحد' : daysLeft === 2 ? 'يومين' : `${daysLeft} أيام`;
          await notifyClient(
            firestore, uid, clientName,
            `⏳ اشتراكك ينتهي خلال ${daysText}`,
            `${clientName}، اشتراكك ينتهي في ${endDate}. جدّد اشتراكك عشان تكمل رحلتك! 💪`,
            'sub-warning',
            today,
          );
        }

        // Mark warning as sent for today
        await warningRef.set({
          clientId,
          clientName,
          daysLeft,
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        results[clientId] = `WARNING sent: ${daysLeft} days left`;
        continue;
      }

      results[clientId] = client.isLocked ? 'already locked' : 'active';
    }

    console.log('[check-subscriptions] Done:', results);
    return res.status(200).json({ success: true, date: today, results });

  } catch (error: any) {
    console.error('[check-subscriptions] Fatal error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
