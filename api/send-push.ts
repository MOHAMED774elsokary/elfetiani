import admin from 'firebase-admin';

// Initialize Firebase Admin SDK once (Vercel may reuse the same instance across requests)
function ensureAdminInitialized(): string | null {
  if (admin.apps.length > 0) return null; // already initialized

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountKey) {
    try {
      const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(decodedKey)),
      });
      return null;
    } catch (e: any) {
      return `Failed to init from FIREBASE_SERVICE_ACCOUNT_KEY: ${e.message}`;
    }
  }

  const projectId   = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let   privateKey  = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    return `Missing env vars. Got: projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`;
  }

  // Strip surrounding quotes (common copy-paste mistake in Vercel UI)
  if ((privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
    privateKey = privateKey.slice(1, -1);
  }

  // Replace literal \n with real newlines
  privateKey = privateKey.replace(/\\n/g, '\n');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    return null;
  } catch (e: any) {
    return `Failed to init Firebase Admin: ${e.message}`;
  }
}

export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Initialize Firebase Admin
  const initError = ensureAdminInitialized();
  if (initError) {
    console.error('[send-push] Firebase Admin init failed:', initError);
    return res.status(500).json({ error: 'Firebase Admin init failed', details: initError });
  }

  try {
    const { userId, type, title, body, data, notificationId } = req.body ?? {};

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // 1. Verify Authorization (Firebase ID Token)
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
    }
    const idToken = authHeader.split('Bearer ')[1];

    try {
      await admin.auth().verifyIdToken(idToken);
    } catch (err: any) {
      console.error('[send-push] Token verification failed:', err.message);
      return res.status(401).json({ error: 'Unauthorized: Token verification failed', details: err.message });
    }

    // 2. Check notification preferences
    const prefSnap = await admin.firestore().collection('notificationPreferences').doc(userId).get();
    if (prefSnap.exists) {
      const prefs = prefSnap.data()!;
      const disabledMap: Record<string, string> = {
        chat_message:        'chatMessages',
        workout_assigned:    'workoutUpdates',
        nutrition_updated:   'nutritionUpdates',
        checkin_reviewed:    'checkinUpdates',
        checkin_submitted:   'checkinUpdates',
        subscription_update: 'subscriptionUpdates',
      };
      const prefKey = disabledMap[type];
      if (prefKey && prefs[prefKey] === false) {
        return res.status(200).json({ success: true, message: `Notification type "${type}" disabled by user.` });
      }
    }

    // 3. Get FCM tokens
    const tokensSnap = await admin.firestore()
      .collection('fcmTokens')
      .where('uid', '==', userId)
      .get();

    if (tokensSnap.empty) {
      console.log(`[send-push] No FCM tokens for userId=${userId}`);
      return res.status(200).json({ success: true, message: 'No FCM tokens registered for this user.' });
    }

    const tokens: string[] = tokensSnap.docs.map(d => d.data().token).filter(Boolean);
    console.log(`[send-push] Sending to ${tokens.length} token(s) for userId=${userId}`);

    // 4. Build and send the message
    const payload: admin.messaging.MulticastMessage = {
      notification: {
        title: title || 'إشعار جديد',
        body: body || '',
      },
      data: {
        type: type || 'general',
        id: notificationId || 'new',
        ...(data || {}),
      },
      webpush: {
        notification: {
          icon: '/icons/icon-512x512.svg',
          badge: '/favicon.svg',
          dir: 'rtl',
          lang: 'ar',
        },
        fcmOptions: {
          link: '/',
        },
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(payload);
    console.log(`[send-push] Success: ${response.successCount}, Failed: ${response.failureCount}`);

    // 5. Clean up stale tokens
    if (response.failureCount > 0) {
      const staleTokenRefs: admin.firestore.DocumentReference[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          console.warn(`[send-push] Token failed (${errCode}):`, tokens[idx]?.substring(0, 20));
          // Only delete tokens that are truly invalid, not temporary errors
          if (errCode === 'messaging/registration-token-not-registered' ||
              errCode === 'messaging/invalid-registration-token') {
            staleTokenRefs.push(tokensSnap.docs[idx].ref);
          }
        }
      });

      if (staleTokenRefs.length > 0) {
        const batch = admin.firestore().batch();
        staleTokenRefs.forEach(ref => batch.delete(ref));
        await batch.commit();
        console.log(`[send-push] Cleaned up ${staleTokenRefs.length} stale token(s)`);
      }
    }

    return res.status(200).json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    });

  } catch (error: any) {
    console.error('[send-push] Unhandled error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
