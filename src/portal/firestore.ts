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

export async function deleteClientData(clientId: string): Promise<void> {
  const batch = writeBatch(db);
  batch.delete(doc(db, 'clients', clientId));
  batch.delete(doc(db, 'workoutPlans', clientId));
  batch.delete(doc(db, 'nutritionPlans', clientId));
  await batch.commit();
  // delete check-ins
  const ciSnap = await getDocs(query(collection(db, 'checkIns'), where('clientId', '==', clientId)));
  const batch2 = writeBatch(db);
  ciSnap.docs.forEach((d) => batch2.delete(d.ref));
  await batch2.commit();
}

export async function addBodyStat(clientId: string, stat: BodyStat): Promise<void> {
  const client = await getClient(clientId);
  if (!client) return;
  const existing = client.bodyStats.filter((s) => s.date !== stat.date);
  const updated: Client = {
    ...client,
    bodyStats: [...existing, stat].sort((a, b) => a.date.localeCompare(b.date)),
  };
  await saveClient(updated);
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
// We store a small mapping doc so we can look up clientId from Firebase UID

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
