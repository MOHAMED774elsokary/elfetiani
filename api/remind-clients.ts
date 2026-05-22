import admin from 'firebase-admin';

/**
 * Bi-weekly reminder: sends a push notification to ALL active clients
 * asking them to upload their progress photo and weight.
 *
 * Triggered by Vercel Cron (see vercel.json):
 *   Schedule: 0 9 1,15 * *  →  9:00 AM on the 1st and 15th of every month
 *
 * Can also be triggered manually via POST /api/remind-clients
 * with header: Authorization: Bearer <CRON_SECRET>
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

export default async function handler(req: any, res: any) {
  // Allow GET (from Vercel Cron) or POST (manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret to prevent abuse
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
    console.error('[remind-clients] Firebase Admin init failed:', initError);
    return res.status(500).json({ error: initError });
  }

  try {
    // 1. Get all clients
    const clientsSnap = await admin.firestore().collection('clients').get();
    const clients = clientsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

    console.log(`[remind-clients] Sending reminders to ${clients.length} client(s)`);

    let sent = 0;
    let skipped = 0;

    for (const client of clients) {
      // Get the Firebase Auth UID for this client
      const mappingSnap = await admin.firestore()
        .collection('userMappings')
        .where('clientId', '==', client.id)
        .get();

      if (mappingSnap.empty) {
        skipped++;
        continue;
      }

      const uid = mappingSnap.docs[0].id;

      // Check if user has FCM tokens
      const tokensSnap = await admin.firestore()
        .collection('fcmTokens')
        .where('uid', '==', uid)
        .get();

      if (tokensSnap.empty) {
        skipped++;
        continue;
      }

      // Create a Firestore notification
      const notifId = `remind-${Date.now()}-${uid.substring(0, 6)}`;
      await admin.firestore().collection('notifications').doc(notifId).set({
        id: notifId,
        userId: uid,
        type: 'general',
        title: '⏰ تذكير نصف شهري',
        body: `${client.name || 'عزيزي العميل'}، حان وقت تسجيل وزنك ورفع صورة تقدمك!`,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        data: {},
      });

      // Send push notification
      const tokens: string[] = tokensSnap.docs.map(d => d.data().token).filter(Boolean);
      if (tokens.length > 0) {
        const payload: admin.messaging.MulticastMessage = {
          notification: {
            title: '⏰ تذكير نصف شهري',
            body: `${client.name || 'عزيزي العميل'}، حان وقت تسجيل وزنك ورفع صورة تقدمك! 📸⚖️`,
          },
          data: { type: 'general', id: notifId },
          webpush: {
            notification: {
              icon: '/icons/icon-512x512.svg',
              badge: '/favicon.svg',
              dir: 'rtl',
              lang: 'ar',
            },
            fcmOptions: { link: '/' },
          },
          tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(payload);
        console.log(`[remind-clients] ${client.name}: sent=${response.successCount}, failed=${response.failureCount}`);

        // Clean up stale tokens
        if (response.failureCount > 0) {
          const batch = admin.firestore().batch();
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
      }

      sent++;
    }

    return res.status(200).json({
      success: true,
      total: clients.length,
      sent,
      skipped,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[remind-clients] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
