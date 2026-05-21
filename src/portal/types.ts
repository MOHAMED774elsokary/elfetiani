// ─── User / Auth ───────────────────────────────────────────────────────────

export type UserRole = 'coach' | 'client';

export interface PortalUser {
  id: string;
  username: string;
  passwordHash: string; // bcrypt-style hash stored as plain hash via btoa for simplicity
  role: UserRole;
  clientId?: string; // only for role === 'client'
}

// ─── Client Profile ────────────────────────────────────────────────────────

export interface BodyStat {
  date: string; // ISO yyyy-mm-dd
  weight: number; // kg
  bodyFat?: number; // %
  notes?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  goal?: string;
  startDate: string; // ISO date
  endDate?: string;
  subscriptionPlan?: string;
  avatarInitials: string;
  bodyStats: BodyStat[];
  coachNotes?: string;
  progressPhotos?: string[]; // base64 data URIs
}

// ─── Workout Plan ──────────────────────────────────────────────────────────

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // e.g. "8-12" or "15"
  notes?: string;
  videoUrl?: string;
  muscleGroup?: string;
}

export interface WorkoutDay {
  id: string;
  dayName: string; // e.g. "Day 1 – Chest & Triceps"
  exercises: Exercise[];
}

export interface WorkoutPlan {
  clientId: string;
  planName: string;
  days: WorkoutDay[];
  coachNotes?: string;
  googleSheetUrl?: string;
  updatedAt: string;
}

// ─── Nutrition Plan ────────────────────────────────────────────────────────

export interface Meal {
  id: string;
  name: string; // e.g. "Breakfast"
  foods: string; // free-text description
  calories: number;
}

export interface NutritionPlan {
  clientId: string;
  dailyCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  meals: Meal[];
  coachNotes?: string;
  updatedAt: string;
}

// ─── Check-in ──────────────────────────────────────────────────────────────

export interface CheckIn {
  id: string;
  clientId: string;
  date: string;
  weight: number;
  energyLevel: 1 | 2 | 3 | 4 | 5;
  sleepHours: number;
  notes?: string;
  // Coach review
  coachReply?: string;
  coachReviewed?: boolean;
  reviewedAt?: string;
}

// ─── Workout Log ────────────────────────────────────────────────────────────

export interface SetLog {
  weight: string;
  reps: string;
}

export interface ExerciseLog {
  completed: boolean;
  sets: SetLog[];
}

export interface WorkoutLog {
  id: string;           // `${clientId}_${dayId}_${weekOf}`
  clientId: string;
  dayId: string;
  weekOf: string;       // ISO date of Monday of the logged week
  exercises: Record<string, ExerciseLog>;  // keyed by exercise id
  savedAt: string;
}
