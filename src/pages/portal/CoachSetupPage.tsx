import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../portal/firebase';
import { setCoachMapping } from '../../portal/firestore';
import { motion } from 'framer-motion';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

export default function CoachSetupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const COACH_EMAIL = import.meta.env.VITE_COACH_EMAIL?.toLowerCase();
      if (!COACH_EMAIL || email.trim().toLowerCase() !== COACH_EMAIL) {
        setError('هذه الصفحة مخصصة لحساب المدرب الرسمي فقط');
        setLoading(false);
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setCoachMapping(cred.user.uid);
      navigate('/portal/admin', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'هذا البريد مستخدم بالفعل — سجل الدخول بدلاً من ذلك',
        'auth/weak-password': 'كلمة المرور ضعيفة (6 أحرف على الأقل)',
        'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
      };
      setError(messages[code || ''] || 'حدث خطأ: ' + code);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080706] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-[#E8520D]/8 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#E8520D]/15 border border-[#E8520D]/20 mb-4">
            <ShieldCheck size={32} className="text-[#E8520D]" />
          </div>
          <h1 className="text-2xl font-black text-white">إعداد حساب المدرب</h1>
          <p className="text-white/40 text-sm mt-2">أنشئ حسابك كمدرب (مرة واحدة فقط)</p>
        </div>

        <div className="bg-[#0f0e0d]/80 backdrop-blur-xl border border-white/8 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm text-white/60 mb-2">بريدك الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 outline-none focus:border-[#E8520D]/60 transition text-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-white/60 mb-2">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل..."
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-12 text-white placeholder:text-white/25 outline-none focus:border-[#E8520D]/60 transition text-sm"
                />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8520D] hover:bg-[#C9440A] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <ShieldCheck size={18} />
              }
              {loading ? 'جاري الإنشاء...' : 'إنشاء حساب المدرب'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/5 text-center">
            <p className="text-xs text-white/25">هل لديك حساب بالفعل؟</p>
            <a href="/#/portal/login" className="text-xs text-[#E8520D] hover:text-[#C9440A] transition">تسجيل الدخول</a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
