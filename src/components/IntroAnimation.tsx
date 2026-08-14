import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function IntroAnimation() {
  const [phase, setPhase] = useState<'loading' | 'reveal' | 'done'>('loading');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let p = 0;
    const interval = setInterval(() => {
      p += Math.random() * 12 + 4;
      if (p >= 100) {
        p = 100;
        setProgress(100);
        clearInterval(interval);
        setTimeout(() => setPhase('reveal'), 600);
        setTimeout(() => setPhase('done'), 2400);
      } else {
        setProgress(Math.round(p));
      }
    }, 90);
    return () => clearInterval(interval);
  }, []);

  if (phase === 'done') return null;

  const line1 = ['E','L',' ','F','E','T','I','A','N','I'];
  const line2 = ['C','O','A','C','H','I','N','G'];

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden will-change-transform" dir="ltr">

      {/* ── Layer 0: Solid dark background ── */}
      <div className="absolute inset-0 bg-[#030303]" style={{ zIndex: 0 }} />

      {/* ── Layer 0: Ambient center glow ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: 'radial-gradient(ellipse 70% 50% at 50% 50%, rgba(232, 82, 13, 0.08) 0%, transparent 70%)',
        }}
      />

      {/* ── Layer 1: Horizontal glow lines top/bottom ── */}
      <motion.div className="absolute top-0 left-0 right-0 h-px"
        style={{ zIndex: 2, background: 'linear-gradient(90deg, transparent, #E8520D 50%, transparent)' }}
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      />
      <motion.div className="absolute bottom-0 left-0 right-0 h-px"
        style={{ zIndex: 2, background: 'linear-gradient(90deg, transparent, #E8520D 50%, transparent)' }}
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      />

      {/* ── Layer 3 (TOP): All text content — ALWAYS above panels ── */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center px-6"
        style={{ zIndex: 30 }}
        animate={phase === 'reveal' ? { opacity: 0, y: -30 } : { opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* EL FETIANI */}
        <div className="flex flex-wrap items-center justify-center gap-x-0.5 mb-1"
          style={{ perspective: '800px' }}>
          {line1.map((ch, i) =>
            ch === ' '
              ? <span key={i} className="w-3 sm:w-5 md:w-8" />
              : (
                <motion.span
                  key={i}
                  className="font-black leading-none text-white"
                  style={{
                    fontSize: 'clamp(2.2rem, 8vw, 6.5rem)',
                    display: 'inline-block',
                    transformStyle: 'preserve-3d',
                  }}
                  initial={{ opacity: 0, rotateX: -90, y: 30 }}
                  animate={{ opacity: 1, rotateX: 0, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.15 + i * 0.055, ease: [0.16, 1, 0.3, 1] }}
                >
                  {ch}
                </motion.span>
              )
          )}
        </div>

        {/* Glowing divider */}
        <motion.div
          className="rounded-full my-3"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: '80%', opacity: 1 }}
          transition={{ duration: 0.9, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          style={{
            maxWidth: '560px',
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #E8520D, #FF8C00, #E8520D, transparent)',
            boxShadow: '0 0 18px rgba(232, 82, 13, 0.55)',
          }}
        />

        {/* COACHING */}
        <div className="flex flex-wrap items-center justify-center gap-x-0.5"
          style={{ perspective: '800px' }}>
          {line2.map((ch, i) => (
            <motion.span
              key={i}
              className="font-black leading-none"
              style={{
                fontSize: 'clamp(2.2rem, 8vw, 6.5rem)',
                display: 'inline-block',
                transformStyle: 'preserve-3d',
                color: '#E8520D',
                textShadow: '0 0 28px rgba(232, 82, 13, 0.4)',
              }}
              initial={{ opacity: 0, rotateX: 90, y: -30 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              transition={{ duration: 0.65, delay: 0.6 + i * 0.055, ease: [0.16, 1, 0.3, 1] }}
            >
              {ch}
            </motion.span>
          ))}
        </div>

        {/* Tagline */}
        <motion.p
          className="font-semibold uppercase text-white/25 mt-7 mb-10"
          style={{ fontSize: 'clamp(9px, 1.2vw, 12px)', letterSpacing: '0.38em' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.7 }}
        >
          TRANSFORM · PERFORM · SUCCEED
        </motion.p>

        {/* Progress bar */}
        <div className="w-48 sm:w-72 md:w-80 rounded-full overflow-hidden relative"
          style={{ height: '2px', background: 'rgba(255,255,255,0.06)' }}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.15, ease: 'linear' }}
            style={{
              background: 'linear-gradient(90deg, #E8520D, #FF8C00)',
              boxShadow: '0 0 10px rgba(232, 82, 13, 0.9)',
            }}
          />
        </div>

        <motion.span
          className="font-mono text-white/20 mt-2"
          style={{ fontSize: '10px', letterSpacing: '0.35em' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {String(progress).padStart(3, '0')}%
        </motion.span>

        {/* Orbit ring decorations */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{ width: '55vmin', height: '55vmin', border: '1px solid rgba(232, 82, 13, 0.07)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{ width: '75vmin', height: '75vmin', border: '1px solid rgba(232, 82, 13, 0.04)' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      {/* ── Layer 2: Split curtain panels — BELOW content (z-20 < z-30) ── */}
      {/* These slide away on reveal to expose the real site behind */}
      <motion.div
        className="absolute inset-y-0 left-0 w-1/2 bg-[#030303]"
        style={{ zIndex: 20 }}
        animate={phase === 'reveal' ? { x: '-100%' } : { x: 0 }}
        transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
      />
      <motion.div
        className="absolute inset-y-0 right-0 w-1/2 bg-[#030303]"
        style={{ zIndex: 20 }}
        animate={phase === 'reveal' ? { x: '100%' } : { x: 0 }}
        transition={{ duration: 1.0, ease: [0.76, 0, 0.24, 1], delay: 0.2 }}
      />

      {/* ── Corner brackets (z above panels) ── */}
      {[
        'top-5 left-5 border-t-2 border-l-2',
        'top-5 right-5 border-t-2 border-r-2',
        'bottom-5 left-5 border-b-2 border-l-2',
        'bottom-5 right-5 border-b-2 border-r-2',
      ].map((cls, i) => (
        <motion.div
          key={i}
          className={`absolute w-6 h-6 ${cls} border-[#E8520D]/40`}
          style={{ zIndex: 31 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.05 }}
        />
      ))}
    </div>
  );
}
