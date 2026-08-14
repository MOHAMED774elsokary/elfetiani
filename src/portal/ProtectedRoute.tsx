import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import type { ReactNode } from 'react';
import { Lock, MessageCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  requireCoach?: boolean;
}

// ─── Locked Account Screen ──────────────────────────────────────────────────
function AccountLockedScreen() {
  const { logout } = useAuth();
  return (
    <div className="min-h-screen bg-[#080706] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
          <Lock size={36} className="text-red-400" />
        </div>

        {/* Heading */}
        <div>
          <h1 className="text-2xl font-black text-white mb-2">الحساب موقوف</h1>
          <p className="text-white/50 text-sm leading-relaxed">
            تم إيقاف اشتراكك مؤقتاً. يرجى التواصل مع كوتشك لتجديد الاشتراك وإعادة تفعيل الحساب.
          </p>
        </div>

        {/* Coach contact */}
        <a
          href={`https://wa.me/${import.meta.env.VITE_COACH_PHONE || ''}`.trim()}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 text-[#25D366] font-bold py-4 rounded-2xl transition"
        >
          <MessageCircle size={20} />
          تواصل مع الكوتش عبر واتساب
        </a>

        {/* Logout */}
        <button
          onClick={logout}
          className="text-white/30 hover:text-white/60 text-sm transition"
        >
          تسجيل الخروج
        </button>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children, requireCoach = false }: Props) {
  const { currentUser, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080706] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#E8520D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/portal/login" state={{ from: location }} replace />;
  }

  if (requireCoach && currentUser.role !== 'coach') {
    return <Navigate to="/portal/dashboard" replace />;
  }

  // Locked clients see a blocking screen — coaches are never locked
  if (currentUser.role === 'client' && currentUser.isLocked) {
    return <AccountLockedScreen />;
  }

  return <>{children}</>;
}
