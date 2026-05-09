import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

// ─── SET YOUR PASSWORD HERE ─────────────────────────────────
const INTAKE_PASSWORD = 'elfetiani2024';
// ────────────────────────────────────────────────────────────

interface PasswordGateProps {
  children: React.ReactNode;
}

export default function PasswordGate({ children }: PasswordGateProps) {
  const [input, setInput] = useState('');
  const [show, setShow] = useState(false);
  const [unlocked, setUnlocked] = useState(() => {
    return localStorage.getItem('intake_unlocked') === 'yes';
  });
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  const attempt = () => {
    if (input === INTAKE_PASSWORD) {
      localStorage.setItem('intake_unlocked', 'yes');
      setUnlocked(true);
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setTimeout(() => setError(false), 2500);
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center px-6 relative overflow-hidden" dir="ltr">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,85,0,0.07) 0%, transparent 70%)' }} />

      {/* Top/bottom lines */}
      <div className="absolute top-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #FF5500 50%, transparent)' }} />
      <div className="absolute bottom-0 inset-x-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, #FF5500 50%, transparent)' }} />

      {/* Corner brackets */}
      {['top-6 left-6 border-t-2 border-l-2','top-6 right-6 border-t-2 border-r-2',
        'bottom-6 left-6 border-b-2 border-l-2','bottom-6 right-6 border-b-2 border-r-2'].map((c,i) => (
        <div key={i} className={`absolute w-6 h-6 ${c} border-[#FF5500]/30`} />
      ))}

      <motion.div
        className="w-full max-w-md"
        animate={shake ? { x: [-8, 8, -6, 6, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo + title */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-[#FF5500]/10 border border-[#FF5500]/20 flex items-center justify-center mx-auto mb-6"
          >
            <Lock className="w-7 h-7 text-[#FF5500]" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-black text-white mb-2"
          >
            EL FETIANI <span className="text-[#FF5500]">COACHING</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-white/30 font-medium text-sm tracking-widest uppercase"
          >
            Client Portal — Restricted Access
          </motion.p>
        </div>

        {/* Password card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-[#0d0d0d] border border-white/8 rounded-3xl p-8"
        >
          <label className="block text-white/50 text-sm font-bold mb-3 tracking-wider uppercase">
            Access Password
          </label>
          <div className="relative mb-4">
            <input
              type={show ? 'text' : 'password'}
              value={input}
              onChange={e => { setInput(e.target.value); setError(false); }}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              placeholder="Enter password..."
              className="w-full bg-[#070707] border border-white/10 rounded-xl px-4 py-4 pr-12 text-white font-medium placeholder:text-white/15 focus:outline-none focus:border-[#FF5500]/60 focus:shadow-[0_0_0_3px_rgba(255,85,0,0.1)] transition-all duration-300"
            />
            <button type="button" onClick={() => setShow(s => !s)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-red-400 text-sm font-bold mb-4 text-center"
              >
                ❌ Incorrect password. Please try again.
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            onClick={attempt}
            whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(255,85,0,0.3)' }}
            whileTap={{ scale: 0.97 }}
            className="w-full py-4 bg-[#FF5500] text-white font-black text-lg rounded-xl flex items-center justify-center gap-2 relative overflow-hidden group"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <ShieldCheck className="w-5 h-5 relative" />
            <span className="relative">Unlock Access</span>
          </motion.button>
        </motion.div>

        <p className="text-center text-white/15 text-xs mt-6">
          This page is private. Contact your coach for access.
        </p>
      </motion.div>
    </div>
  );
}
