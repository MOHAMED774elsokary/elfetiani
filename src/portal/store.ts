import type {
  PortalUser,
  Client,
  WorkoutPlan,
  NutritionPlan,
  BodyStat,
  CheckIn,
} from './types';

// ─── Storage Keys ──────────────────────────────────────────────────────────
const KEYS = {
  USERS: 'portal_users',
  CLIENTS: 'portal_clients',
  WORKOUT_PLANS: 'portal_workout_plans',
  NUTRITION_PLANS: 'portal_nutrition_plans',
  CHECK_INS: 'portal_check_ins',
  SEEDED: 'portal_seeded',
};

// ─── Helpers ───────────────────────────────────────────────────────────────
function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || '[]');
  } catch {
    return [];
  }
}

function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Simple password "hash" — just base64 with salt prefix (upgrade to bcrypt with backend later)
export function hashPassword(raw: string): string {
  return btoa(`fett_salt:${raw}`);
}

export function verifyPassword(raw: string, stored: string): boolean {
  return hashPassword(raw) === stored;
}

// ─── Users ─────────────────────────────────────────────────────────────────
export function getUsers(): PortalUser[] {
  return read<PortalUser>(KEYS.USERS);
}

export function saveUser(user: PortalUser): void {
  const users = getUsers().filter((u) => u.id !== user.id);
  write(KEYS.USERS, [...users, user]);
}

export function findUserByUsername(username: string): PortalUser | undefined {
  return getUsers().find((u) => u.username.toLowerCase() === username.toLowerCase());
}

export function deleteUser(id: string): void {
  write(KEYS.USERS, getUsers().filter((u) => u.id !== id));
}

// ─── Clients ───────────────────────────────────────────────────────────────
export function getClients(): Client[] {
  return read<Client>(KEYS.CLIENTS);
}

export function getClient(id: string): Client | undefined {
  return getClients().find((c) => c.id === id);
}

export function saveClient(client: Client): void {
  const all = getClients().filter((c) => c.id !== client.id);
  write(KEYS.CLIENTS, [...all, client]);
}

export function deleteClient(id: string): void {
  write(KEYS.CLIENTS, getClients().filter((c) => c.id !== id));
  // cascade delete plans
  write(KEYS.WORKOUT_PLANS, read<WorkoutPlan>(KEYS.WORKOUT_PLANS).filter((p) => p.clientId !== id));
  write(KEYS.NUTRITION_PLANS, read<NutritionPlan>(KEYS.NUTRITION_PLANS).filter((p) => p.clientId !== id));
  write(KEYS.CHECK_INS, read<CheckIn>(KEYS.CHECK_INS).filter((c) => c.clientId !== id));
  // remove matching user account
  write(KEYS.USERS, getUsers().filter((u) => u.clientId !== id));
}

export function addBodyStat(clientId: string, stat: BodyStat): void {
  const client = getClient(clientId);
  if (!client) return;
  const updated: Client = {
    ...client,
    bodyStats: [...client.bodyStats.filter((s) => s.date !== stat.date), stat].sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
  };
  saveClient(updated);
}

// ─── Workout Plans ─────────────────────────────────────────────────────────
export function getWorkoutPlan(clientId: string): WorkoutPlan | undefined {
  return read<WorkoutPlan>(KEYS.WORKOUT_PLANS).find((p) => p.clientId === clientId);
}

export function saveWorkoutPlan(plan: WorkoutPlan): void {
  const all = read<WorkoutPlan>(KEYS.WORKOUT_PLANS).filter((p) => p.clientId !== plan.clientId);
  write(KEYS.WORKOUT_PLANS, [...all, plan]);
}

// ─── Nutrition Plans ───────────────────────────────────────────────────────
export function getNutritionPlan(clientId: string): NutritionPlan | undefined {
  return read<NutritionPlan>(KEYS.NUTRITION_PLANS).find((p) => p.clientId === clientId);
}

export function saveNutritionPlan(plan: NutritionPlan): void {
  const all = read<NutritionPlan>(KEYS.NUTRITION_PLANS).filter((p) => p.clientId !== plan.clientId);
  write(KEYS.NUTRITION_PLANS, [...all, plan]);
}

// ─── Check-ins ─────────────────────────────────────────────────────────────
export function getCheckIns(clientId: string): CheckIn[] {
  return read<CheckIn>(KEYS.CHECK_INS).filter((c) => c.clientId === clientId);
}

export function saveCheckIn(checkIn: CheckIn): void {
  const all = read<CheckIn>(KEYS.CHECK_INS).filter((c) => c.id !== checkIn.id);
  write(KEYS.CHECK_INS, [...all, checkIn]);
}

// ─── Seed ──────────────────────────────────────────────────────────────────
export function seedIfNeeded(): void {
  if (localStorage.getItem(KEYS.SEEDED)) return;

  // Users
  const coach: PortalUser = {
    id: 'coach-1',
    username: 'coach',
    passwordHash: hashPassword('coach123'),
    role: 'coach',
  };
  const user1: PortalUser = {
    id: 'user-ali',
    username: 'ali',
    passwordHash: hashPassword('pass123'),
    role: 'client',
    clientId: 'client-ali',
  };
  const user2: PortalUser = {
    id: 'user-sara',
    username: 'sara',
    passwordHash: hashPassword('pass123'),
    role: 'client',
    clientId: 'client-sara',
  };
  write(KEYS.USERS, [coach, user1, user2]);

  // Clients
  const ali: Client = {
    id: 'client-ali',
    name: 'علي أحمد',
    email: 'ali@example.com',
    phone: '+966501234567',
    goal: 'بناء العضلات وخسارة الدهون',
    startDate: '2026-01-15',
    avatarInitials: 'عأ',
    coachNotes: 'عميل منضبط، يحتاج تركيز على البروتين.',
    bodyStats: [
      { date: '2026-01-15', weight: 86, bodyFat: 22 },
      { date: '2026-02-01', weight: 84.5, bodyFat: 21 },
      { date: '2026-03-01', weight: 82, bodyFat: 19.5 },
      { date: '2026-04-01', weight: 80, bodyFat: 18 },
    ],
  };
  const sara: Client = {
    id: 'client-sara',
    name: 'سارة محمد',
    email: 'sara@example.com',
    goal: 'تنسيق الجسم وزيادة اللياقة',
    startDate: '2026-02-10',
    avatarInitials: 'سم',
    bodyStats: [
      { date: '2026-02-10', weight: 68, bodyFat: 28 },
      { date: '2026-03-10', weight: 66.5, bodyFat: 26.5 },
      { date: '2026-04-01', weight: 65, bodyFat: 25 },
    ],
  };
  write(KEYS.CLIENTS, [ali, sara]);

  // Workout Plans
  const aliWorkout: WorkoutPlan = {
    clientId: 'client-ali',
    planName: 'برنامج بناء العضلات - 4 أيام',
    coachNotes: 'استرح 60-90 ثانية بين الجولات. ركز على الشكل الصحيح.',
    updatedAt: new Date().toISOString(),
    days: [
      {
        id: 'day-1',
        dayName: 'اليوم 1 – صدر وترايسبس',
        exercises: [
          { id: 'e1', name: 'بنش برس', sets: 4, reps: '8-10', muscleGroup: 'صدر', notes: 'ببطء في مرحلة النزول' },
          { id: 'e2', name: 'دمبل فلاي على بنش مائل', sets: 3, reps: '12', muscleGroup: 'صدر' },
          { id: 'e3', name: 'تمديد ترايسبس بالكابل', sets: 3, reps: '12-15', muscleGroup: 'ترايسبس' },
        ],
      },
      {
        id: 'day-2',
        dayName: 'اليوم 2 – ظهر وبايسبس',
        exercises: [
          { id: 'e4', name: 'سحب اللاتيسيموس بالكابل', sets: 4, reps: '10', muscleGroup: 'ظهر' },
          { id: 'e5', name: 'تجديف بار', sets: 3, reps: '8-10', muscleGroup: 'ظهر' },
          { id: 'e6', name: 'كيرل الحديد', sets: 3, reps: '12', muscleGroup: 'بايسبس' },
        ],
      },
      {
        id: 'day-3',
        dayName: 'اليوم 3 – أرجل',
        exercises: [
          { id: 'e7', name: 'سكوات', sets: 4, reps: '8-10', muscleGroup: 'أرجل', notes: 'عمق كامل' },
          { id: 'e8', name: 'ليج برس', sets: 3, reps: '12', muscleGroup: 'أرجل' },
          { id: 'e9', name: 'ككل رفع', sets: 4, reps: '15', muscleGroup: 'أرجل' },
        ],
      },
      {
        id: 'day-4',
        dayName: 'اليوم 4 – أكتاف وأبدومينال',
        exercises: [
          { id: 'e10', name: 'ضغط الكتف بالدمبل', sets: 4, reps: '10', muscleGroup: 'أكتاف' },
          { id: 'e11', name: 'رفع جانبي', sets: 3, reps: '15', muscleGroup: 'أكتاف' },
          { id: 'e12', name: 'كرانش بالكابل', sets: 3, reps: '15', muscleGroup: 'بطن' },
        ],
      },
    ],
  };

  const saraWorkout: WorkoutPlan = {
    clientId: 'client-sara',
    planName: 'برنامج التنسيق والحرق - 3 أيام',
    coachNotes: '20 دقيقة كارديو بعد كل جلسة.',
    updatedAt: new Date().toISOString(),
    days: [
      {
        id: 'day-a',
        dayName: 'اليوم A – جسم أعلى',
        exercises: [
          { id: 'ea1', name: 'ضغط دمبل على بنش', sets: 3, reps: '12', muscleGroup: 'صدر' },
          { id: 'ea2', name: 'سحب علوي', sets: 3, reps: '12', muscleGroup: 'ظهر' },
          { id: 'ea3', name: 'رفع كتف أمامي', sets: 3, reps: '15', muscleGroup: 'أكتاف' },
        ],
      },
      {
        id: 'day-b',
        dayName: 'اليوم B – أرجل',
        exercises: [
          { id: 'eb1', name: 'سكوات بالدمبل', sets: 4, reps: '15', muscleGroup: 'أرجل' },
          { id: 'eb2', name: 'خطوة للأمام', sets: 3, reps: '12 لكل جانب', muscleGroup: 'أرجل' },
          { id: 'eb3', name: 'رفع كعب واقف', sets: 3, reps: '20', muscleGroup: 'ساق' },
        ],
      },
    ],
  };
  write(KEYS.WORKOUT_PLANS, [aliWorkout, saraWorkout]);

  // Nutrition Plans
  const aliNutrition: NutritionPlan = {
    clientId: 'client-ali',
    dailyCalories: 2600,
    proteinG: 195,
    carbsG: 290,
    fatG: 72,
    coachNotes: 'تناول وجبة البروتين خلال 30 دقيقة بعد التمرين.',
    updatedAt: new Date().toISOString(),
    meals: [
      { id: 'm1', name: 'الفطور', foods: '3 بيض مسلوق + شوفان مع حليب + موز', calories: 550 },
      { id: 'm2', name: 'منتصف الصباح', foods: 'مزيج المكسرات + بروتين شيك', calories: 350 },
      { id: 'm3', name: 'الغداء', foods: '200g صدر دجاج مشوي + أرز بني + خضروات', calories: 700 },
      { id: 'm4', name: 'قبل التمرين', foods: 'توست عسل + موز', calories: 300 },
      { id: 'm5', name: 'بعد التمرين', foods: 'بروتين شيك + تمر', calories: 350 },
      { id: 'm6', name: 'العشاء', foods: '200g سمك + بطاطا حلوة + سلطة', calories: 600 },
    ],
  };

  const saraNutrition: NutritionPlan = {
    clientId: 'client-sara',
    dailyCalories: 1800,
    proteinG: 140,
    carbsG: 180,
    fatG: 55,
    coachNotes: 'عدم تخطي وجبة الإفطار. اشربي 2.5 لتر ماء يومياً.',
    updatedAt: new Date().toISOString(),
    meals: [
      { id: 'sm1', name: 'الفطور', foods: '2 بيض + قطعة توست + شاي أخضر', calories: 350 },
      { id: 'sm2', name: 'الغداء', foods: '150g دجاج + أرز + خضار مشوي', calories: 550 },
      { id: 'sm3', name: 'وجبة خفيفة', foods: 'تفاحة + جبن قريش', calories: 200 },
      { id: 'sm4', name: 'العشاء', foods: 'سمك تونة + خضار نيء + زيت زيتون', calories: 450 },
      { id: 'sm5', name: 'ما قبل النوم', foods: 'زبادي يوناني', calories: 150 },
    ],
  };
  write(KEYS.NUTRITION_PLANS, [aliNutrition, saraNutrition]);

  localStorage.setItem(KEYS.SEEDED, '1');
}
