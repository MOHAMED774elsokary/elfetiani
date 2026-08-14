import admin from 'firebase-admin';

// Re-use the same Admin SDK initialisation pattern from send-push.ts
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
    return `Missing env vars. Got: projectId=${!!projectId}, clientEmail=${!!clientEmail}, privateKey=${!!privateKey}`;
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
    return `Failed to init Firebase Admin: ${e.message}`;
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const initError = ensureAdminInitialized();
  if (initError) {
    return res.status(500).json({ error: 'Firebase Admin init failed', details: initError });
  }

  // ── 1. Verify coach identity ────────────────────────────────────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Authorization header' });
  }
  const idToken = authHeader.split('Bearer ')[1];

  let callerUid: string;
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch (err: any) {
    return res.status(401).json({ error: 'Unauthorized: Token verification failed', details: err.message });
  }

  // Check that the caller is a coach (has role === 'coach' in userMappings)
  const mappingSnap = await admin.firestore().collection('userMappings').doc(callerUid).get();
  if (!mappingSnap.exists || mappingSnap.data()?.role !== 'coach') {
    return res.status(403).json({ error: 'Forbidden: Only coaches can perform this action' });
  }

  // ── 2. Parse & validate body ────────────────────────────────────────────────
  const { targetUid, action, newEmail, newPassword } = req.body ?? {};

  if (!targetUid || !action) {
    return res.status(400).json({ error: 'Missing targetUid or action' });
  }

  try {
    switch (action) {
      // Change the client's email address
      case 'updateEmail': {
        if (!newEmail) return res.status(400).json({ error: 'Missing newEmail' });
        await admin.auth().updateUser(targetUid, { email: newEmail });
        // Revoke tokens so the old session is invalidated immediately
        await admin.auth().revokeRefreshTokens(targetUid);
        return res.status(200).json({ success: true, message: `Email updated and sessions revoked for uid=${targetUid}` });
      }

      // Change the client's password
      case 'updatePassword': {
        if (!newPassword) return res.status(400).json({ error: 'Missing newPassword' });
        if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
        await admin.auth().updateUser(targetUid, { password: newPassword });
        // Revoke tokens so the client is forced to re-login with the new password
        await admin.auth().revokeRefreshTokens(targetUid);
        return res.status(200).json({ success: true, message: `Password updated and sessions revoked for uid=${targetUid}` });
      }

      // Force-logout the client from all devices (revoke all refresh tokens)
      case 'revokeTokens': {
        await admin.auth().revokeRefreshTokens(targetUid);
        return res.status(200).json({ success: true, message: `All sessions revoked for uid=${targetUid}` });
      }

      // Change both email and password in one call
      case 'updateEmailAndPassword': {
        if (!newEmail) return res.status(400).json({ error: 'Missing newEmail' });
        if (!newPassword) return res.status(400).json({ error: 'Missing newPassword' });
        if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
        await admin.auth().updateUser(targetUid, { email: newEmail, password: newPassword });
        await admin.auth().revokeRefreshTokens(targetUid);
        return res.status(200).json({ success: true, message: `Email & password updated and sessions revoked for uid=${targetUid}` });
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error: any) {
    console.error('[manage-client-auth] Error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
