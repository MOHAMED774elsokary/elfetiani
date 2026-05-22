import {
  doc, getDoc, setDoc, collection,
  getDocs, query, where, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Client, WorkoutPlan, NutritionPlan, BodyStat, CheckIn } from './types';

// ─── Clients ───────────────────────────────────────────────────────────────

export async function getClient(id: string): Promise<Client | undefined> {
  const snap = await getDoc(doc(db, 'clients', id));
  return snap.exists() ? (snap.data() as Client) : undefined;
}

export async function getClients(): Promise<Client[]> {
  const snap = await getDocs(collection(db, 'clients'));
  return snap.docs.map((d) => d.data() as Client);
}

export async function saveClient(client: Client): Promise<void> {
  await setDoc(doc(db, 'clients', client.id), client);
}

/**
 * Full cascade delete of a client and ALL their associated data.
 * FIXED: Now also deletes userMappings, fcmTokens, notifications,
 * and notificationPreferences for the client.
 */
export async function deleteClientData(clientId: string): Promise<void> {
  // 1. Find the Firebase Auth UID for this clientId (needed to clean up auth-keyed collections)
  const firebaseUid = await getUidByClientId(clientId);

  // 2. Delete core client documents in one batch
  const batch = writeBatch(db);
  batch.delete(doc(db, 'clients', clientId));
  batch.delete(doc(db, 'workoutPlans', clientId));
  batch.delete(doc(db, 'nutritionPlans', clientId));
  if (firebaseUid) {
    batch.delete(doc(db, 'userMappings', firebaseUid));
    batch.delete(doc(db, 'notificationPreferences', firebaseUid));
  }
  await batch.commit();

  // 3. Delete check-ins (may be many — use separate batch)
  const ciSnap = await getDocs(query(collection(db, 'checkIns'), where('clientId', '==', clientId)));
  if (ciSnap.docs.length > 0) {
    const batch2 = writeBatch(db);
    ciSnap.docs.forEach((d) => batch2.delete(d.ref));
    await batch2.commit();
  }

  // 4. Delete FCM tokens for this user
  if (firebaseUid) {
    const tokensSnap = await getDocs(
      query(collection(db, 'fcmTokens'), where('uid', '==', firebaseUid))
    );
    if (tokensSnap.docs.length > 0) {
      const batch3 = writeBatch(db);
      tokensSnap.docs.forEach((d) => batch3.delete(d.ref));
      await batch3.commit();
    }

    // 5. Delete notifications for this user
    const notifsSnap = await getDocs(
      query(collection(db, 'notifications'), where('userId', '==', firebaseUid))
    );
    if (notifsSnap.docs.length > 0) {
      const batch4 = writeBatch(db);
      notifsSnap.docs.forEach((d) => batch4.delete(d.ref));
      await batch4.commit();
    }
  }
}

export async function addBodyStat(clientId: string, stat: BodyStat): Promise<void> {
  const clientRef = doc(db, 'clients', clientId);
  // Step 1: remove any existing entry for the same date (if any)
  // Step 2: add the new stat
  // We do this as two separate updateDoc calls (arrayRemove then arrayUnion)
  // to avoid a full document read. This is still 2 ops but they're small writes.
  try {
    // Try to find existing stat for this date and remove it first
    const snap = await getDoc(clientRef);
    if (snap.exists()) {
      const existing = (snap.data() as Client).bodyStats || [];
      const old = existing.find((s) => s.date === stat.date);
      const { updateDoc, arrayRemove, arrayUnion } = await import('firebase/firestore');
      if (old) {
        await updateDoc(clientRef, { bodyStats: arrayRemove(old) });
      }
      await updateDoc(clientRef, { bodyStats: arrayUnion(stat) });
    }
  } catch {
    // Fallback: full read-modify-write
    const client = await getClient(clientId);
    if (!client) return;
    const existing = client.bodyStats.filter((s) => s.date !== stat.date);
    await saveClient({ ...client, bodyStats: [...existing, stat].sort((a, b) => a.date.localeCompare(b.date)) });
  }
}


// ─── Workout Plans ─────────────────────────────────────────────────────────

export async function getWorkoutPlan(clientId: string): Promise<WorkoutPlan | undefined> {
  const snap = await getDoc(doc(db, 'workoutPlans', clientId));
  return snap.exists() ? (snap.data() as WorkoutPlan) : undefined;
}

export async function saveWorkoutPlan(plan: WorkoutPlan): Promise<void> {
  await setDoc(doc(db, 'workoutPlans', plan.clientId), plan);
}

// ─── Nutrition Plans ────────────────────────────────────────────────────────

export async function getNutritionPlan(clientId: string): Promise<NutritionPlan | undefined> {
  const snap = await getDoc(doc(db, 'nutritionPlans', clientId));
  return snap.exists() ? (snap.data() as NutritionPlan) : undefined;
}

export async function saveNutritionPlan(plan: NutritionPlan): Promise<void> {
  await setDoc(doc(db, 'nutritionPlans', plan.clientId), plan);
}

// ─── Check-ins ─────────────────────────────────────────────────────────────

export async function getCheckIns(clientId: string): Promise<CheckIn[]> {
  const snap = await getDocs(query(collection(db, 'checkIns'), where('clientId', '==', clientId)));
  return snap.docs.map((d) => d.data() as CheckIn);
}

export async function saveCheckIn(checkIn: CheckIn): Promise<void> {
  await setDoc(doc(db, 'checkIns', checkIn.id), { ...checkIn, createdAt: serverTimestamp() });
}

// ─── Client→User mapping ───────────────────────────────────────────────────
// We store a small mapping doc so we can look up clientId from Firebase UID.

export async function setUserMapping(uid: string, clientId: string): Promise<void> {
  await setDoc(doc(db, 'userMappings', uid), { clientId, role: 'client' });
}

export async function setCoachMapping(uid: string): Promise<void> {
  await setDoc(doc(db, 'userMappings', uid), { role: 'coach' });
}

export async function getUserMapping(uid: string): Promise<{ role: 'coach' | 'client'; clientId?: string } | undefined> {
  const snap = await getDoc(doc(db, 'userMappings', uid));
  return snap.exists() ? (snap.data() as { role: 'coach' | 'client'; clientId?: string }) : undefined;
}

/**
 * Reverse lookup: given a Firestore clientId (e.g. "client-abc123"),
 * return the Firebase Auth UID that maps to it.
 * This is needed to send notifications to the correct user.
 *
 * SECURITY NOTE: This query runs as the coach (who has read access to all userMappings).
 * It must NEVER be called from a client-side context where the user could be a regular client.
 */
export async function getUidByClientId(clientId: string): Promise<string | null> {
  const snap = await getDocs(
    query(collection(db, 'userMappings'), where('clientId', '==', clientId))
  );
  if (snap.empty) return null;
  // Return the document ID, which is the Firebase Auth UID
  return snap.docs[0].id;
}

// ─── Workout Logs ──────────────────────────────────────────────────────────

export async function saveWorkoutLog(log: import('./types').WorkoutLog): Promise<void> {
  await setDoc(doc(db, 'workoutLogs', log.id), { ...log, updatedAt: serverTimestamp() });
}

export async function getWorkoutLogs(clientId: string): Promise<import('./types').WorkoutLog[]> {
  const snap = await getDocs(query(collection(db, 'workoutLogs'), where('clientId', '==', clientId)));
  return snap.docs.map((d) => d.data() as import('./types').WorkoutLog);
}

// ─── Coach check-in replies ────────────────────────────────────────────────

export async function addCoachReplyToCheckIn(checkInId: string, reply: string): Promise<void> {
  const checkInRef = doc(db, 'checkIns', checkInId);
  await setDoc(checkInRef, { 
    coachReply: reply, 
    coachReviewed: true, 
    reviewedAt: new Date().toISOString() 
  }, { merge: true });
}

// ─── Client Profile Updates ────────────────────────────────────────────────

export async function updateClientProfile(clientId: string, updates: Partial<Client>): Promise<void> {
  const clientRef = doc(db, 'clients', clientId);
  await setDoc(clientRef, updates, { merge: true });
}

export async function updateClientPhotos(clientId: string, photos: string[]): Promise<void> {
  const clientRef = doc(db, 'clients', clientId);
  await setDoc(clientRef, { progressPhotos: photos }, { merge: true });
}
