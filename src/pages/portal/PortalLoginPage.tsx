import { useState, useEffect } from 'react';
import { useNavigate, useLocation, type Location } from 'react-router-dom';
import { useAuth } from '../../portal/AuthContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Home, Loader2 } from 'lucide-react';

export default function PortalLoginPage() {
  const { login, currentUser, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Redirect if already logged in — inside useEffect to avoid navigate-during-render crash.
  // Reads location.state.from to redirect back to the originally requested page.
  useEffect(() => {
    if (currentUser) {
      const from = (location.state as { from?: Location })?.from?.pathname;
      navigate(
        from || (currentUser.role === 'coach' ? '/portal/admin' : '/portal/dashboard'),
        { replace: true }
      );
    }
  }, [currentUser, navigate, location.state]);

  // While Firebase is resolving auth state, show a spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#FF5500]" />
      </div>
    );
  }

  // Already logged in — useEffect will navigate, render nothing in the meantime
  if (currentUser) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email.trim(), password, rememberMe);
    setLoading(false);
    if (!result.ok) {
      setError(result.error || 'حدث خطأ');
    }
    // Navigation handled by onAuthStateChanged in AuthContext → useEffect in parent
  }

  return (
    <div
      className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden"
      dir="rtl"
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-[#FF5500]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-[#FF5500]/5 rounded-full blur-[80px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <a href="/#/" className="inline-flex flex-col items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#FF5500] to-[#FF3300] font-black text-white text-3xl shadow-[0_0_30px_rgba(255,85,0,0.4)] mb-2">
              F
            </div>
            <h1 className="text-2xl font-black text-white">
              EL FETIANI <span className="text-[#FF5500]">COACHING</span>
            </h1>
          </a>
          <p className="text-white/40 text-sm mt-2">منصة التدريب الخاصة</p>
        </div>

        {/* Card */}
        <div className="bg-[#0e0e0e]/80 backdrop-blur-xl border border-white/8 rounded-2xl p-8">
          <h2 className="text-lg font-bold mb-6 text-center">تسجيل الدخول</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-white/60 mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                autoComplete="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#FF5500]/60 focus:bg-white/8 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور..."
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-12 text-white placeholder:text-white/25 outline-none focus:border-[#FF5500]/60 focus:bg-white/8 transition text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border border-white/10 bg-white/5 text-[#FF5500] focus:ring-[#FF5500]/60 w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-white/60 select-none">تذكرني (أضفني للدخول تلقائيًا)</span>
              </label>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 text-center"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#FF5500] hover:bg-[#FF6620] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  دخول
                </>
              )}
            </button>
          </form>

          <div className="mt-4">
            <a href="/#/" className="w-full border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2">
              <Home size={18} />
              العودة للصفحة الرئيسية
            </a>
          </div>

          <div className="mt-6 pt-6 border-t border-white/5 text-center">
            <p className="text-xs text-white/25">
              هل نسيت كلمة المرور؟ تواصل مع مدربك
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
