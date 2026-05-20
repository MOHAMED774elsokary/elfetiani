import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { getUserMapping, setCoachMapping } from './firestore';
import type { UserRole } from './types';

export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
  clientId?: string;
}

interface AuthContextValue {
  currentUser: AuthUser | null;
  login: (email: string, password: string, remember?: boolean) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  createClientAccount: (email: string, password: string, clientId: string) => Promise<{ ok: boolean; error?: string }>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }
      try {
        const mapping = await getUserMapping(firebaseUser.uid);
        if (mapping) {
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: mapping.role,
            clientId: mapping.clientId,
          });
        } else {
          // No mapping — only treat the specific coach email as a coach
          const isCoachEmail = firebaseUser.email?.toLowerCase() === 'elfetyaniabdo@gmail.com';
          const assignedRole = isCoachEmail ? 'coach' : 'client';
          
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: assignedRole,
          });
          
          // Auto-heal only for the coach
          if (isCoachEmail) {
            setCoachMapping(firebaseUser.uid).catch(err => {
              console.error("Auto-initializing coach mapping failed:", err);
            });
          }
        }
      } catch (err) {
        console.error("Error fetching user mapping:", err);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    });
    return unsub;
  }, []);

  async function login(email: string, password: string, remember: boolean = true) {
    try {
      await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const messages: Record<string, string> = {
        'auth/user-not-found': 'البريد الإلكتروني غير موجود',
        'auth/wrong-password': 'كلمة المرور غير صحيحة',
        'auth/invalid-credential': 'البريد أو كلمة المرور غير صحيحة',
        'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
        'auth/too-many-requests': 'محاولات كثيرة، انتظر قليلاً',
      };
      return { ok: false, error: messages[code || ''] || 'حدث خطأ في تسجيل الدخول' };
    }
  }

  async function createClientAccount(email: string, password: string, _clientId: string) {
    // We save the mapping in AdminPanel after this succeeds
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return { ok: true };
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'هذا البريد مستخدم بالفعل',
        'auth/weak-password': 'كلمة المرور ضعيفة (6 أحرف على الأقل)',
        'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
      };
      return { ok: false, error: messages[code || ''] || 'حدث خطأ في إنشاء الحساب' };
    }
  }

  async function logout() {
    await firebaseSignOut(auth);
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout, createClientAccount, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
