import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
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
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';
import { getUserMapping, setCoachMapping } from './firestore';
import type { UserRole } from './types';

export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
  clientId?: string;
  isLocked?: boolean;
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
  // Ref to the real-time Firestore unsubscribe so we can clean it up on sign-out
  const lockListenerUnsub = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      // Clean up any previous real-time lock listener
      if (lockListenerUnsub.current) {
        lockListenerUnsub.current();
        lockListenerUnsub.current = null;
      }

      if (!firebaseUser) {
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      // Force-refresh the ID token to detect revoked sessions immediately.
      // If revokeRefreshTokens() was called server-side, getIdToken(true) will throw.
      try {
        await firebaseUser.getIdToken(true);
      } catch {
        // Token is revoked — sign out silently and show the login page
        await firebaseSignOut(auth);
        setCurrentUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const mapping = await getUserMapping(firebaseUser.uid);
        if (mapping) {
          // Set user immediately so the UI can render
          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: mapping.role,
            clientId: mapping.clientId,
            isLocked: false,
          });

          // For clients: start a REAL-TIME listener on their Firestore doc.
          // The moment the coach locks the account (isLocked = true) or the
          // subscription expires, this snapshot fires and the client's UI
          // instantly shows the locked screen — no token expiry wait needed.
          if (mapping.role === 'client' && mapping.clientId) {
            const clientDocRef = doc(db, 'clients', mapping.clientId);
            lockListenerUnsub.current = onSnapshot(
              clientDocRef,
              (snap) => {
                if (snap.exists()) {
                  const data = snap.data();
                  const isManuallyLocked = data?.isLocked === true;
                  
                  // Also check if subscription has expired (endDate < today)
                  let isExpired = false;
                  if (data?.endDate) {
                    const today = new Date().toISOString().slice(0, 10);
                    isExpired = data.endDate < today;
                  }
                  
                  setCurrentUser((prev) => {
                    if (!prev) return prev;
                    return { ...prev, isLocked: isManuallyLocked || isExpired };
                  });
                }
              },
              () => {
                // Silently ignore snapshot errors (e.g. permission denied after lock)
              }
            );
          }
        } else {
          // No mapping — only treat the specific coach email as a coach.
          const COACH_EMAIL = import.meta.env.VITE_COACH_EMAIL?.toLowerCase();
          const isCoachEmail = COACH_EMAIL
            ? firebaseUser.email?.toLowerCase() === COACH_EMAIL
            : false;
          const assignedRole = isCoachEmail ? 'coach' : 'client';

          setCurrentUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            role: assignedRole,
          });

          // Auto-heal only for the coach
          if (isCoachEmail) {
            setCoachMapping(firebaseUser.uid).catch(err => {
              console.error('Auto-initializing coach mapping failed:', err);
            });
          }
        }
      } catch (err) {
        console.error('Error fetching user mapping:', err);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => {
      unsub();
      if (lockListenerUnsub.current) lockListenerUnsub.current();
    };
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
    if (lockListenerUnsub.current) {
      lockListenerUnsub.current();
      lockListenerUnsub.current = null;
    }
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
