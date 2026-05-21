import admin from 'firebase-admin';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize Firebase Admin only once
    if (!admin?.apps?.length) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (serviceAccountKey) {
        const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
        admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(decodedKey)),
        });
      } else if (process.env.FIREBASE_PRIVATE_KEY) {
        let pk = process.env.FIREBASE_PRIVATE_KEY;
        // Strip surrounding quotes if the user pasted them by mistake
        if (pk.startsWith('"') && pk.endsWith('"')) {
          pk = pk.substring(1, pk.length - 1);
        }
        if (pk.startsWith("'") && pk.endsWith("'")) {
          pk = pk.substring(1, pk.length - 1);
        }
        // Replace literal escaped newlines
        pk = pk.replace(/\\n/g, '\n');
        
        try {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: process.env.FIREBASE_PROJECT_ID,
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
              privateKey: pk,
            }),
          });
        } catch (initErr: any) {
          return res.status(500).json({ error: 'مشكلة في المفتاح الخاص (Private Key)', details: initErr.message });
        }
      } else {
        return res.status(500).json({ error: 'متغيرات البيئة غير موجودة في Vercel.' });
      }
    }

    if (!admin?.apps?.length) {
      return res.status(500).json({ error: 'Firebase Admin failed to configure' });
    }

    const { userId, type, title, body, data, notificationId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    // 1. Verify Authorization Header (Firebase ID Token)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    
    try {
      await admin.auth().verifyIdToken(idToken);
      // We could check if decodedToken.uid has permission, but for now just being authenticated is enough.
    } catch (err) {
      console.error('Token verification failed:', err);
      return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
    }

    // 2. Check user notification preferences
    const prefSnap = await admin.firestore().collection('notificationPreferences').doc(userId).get();
    let shouldSend = true;

    if (prefSnap.exists) {
      const prefs = prefSnap.data();
      if (prefs) {
        if (type === 'chat_message' && prefs.chatMessages === false) shouldSend = false;
        else if (type === 'workout_assigned' && prefs.workoutUpdates === false) shouldSend = false;
        else if (type === 'nutrition_updated' && prefs.nutritionUpdates === false) shouldSend = false;
        else if ((type === 'checkin_reviewed' || type === 'checkin_submitted') && prefs.checkinUpdates === false) shouldSend = false;
        else if (type === 'subscription_update' && prefs.subscriptionUpdates === false) shouldSend = false;
      }
    }

    if (!shouldSend) {
      return res.status(200).json({ success: true, message: 'Notification disabled by user preferences.' });
    }

    // 3. Get user's FCM tokens
    const tokensSnap = await admin.firestore()
      .collection('fcmTokens')
      .where('uid', '==', userId)
      .get();
    
    const tokens = tokensSnap.docs.map(d => d.data().token);
    
    if (tokens.length === 0) {
      return res.status(200).json({ success: true, message: 'No FCM tokens found for user.' });
    }

    // 4. Send the push notification
    const payload = {
      notification: {
        title: title || 'إشعار جديد',
        body: body || '',
      },
      data: {
        type: type || 'general',
        id: notificationId || 'new',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        ...(data || {})
      },
      tokens: tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(payload);
    
    // 5. Clean up failed tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      
      if (failedTokens.length > 0) {
        const batch = admin.firestore().batch();
        tokensSnap.docs.forEach(doc => {
          if (failedTokens.includes(doc.data().token)) {
            batch.delete(doc.ref);
          }
        });
        await batch.commit();
      }
    }

    return res.status(200).json({ 
      success: true, 
      sent: response.successCount,
      failed: response.failureCount
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
