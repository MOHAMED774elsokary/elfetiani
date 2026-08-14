import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Language } from '../App';

export default function StickyCtaButton({ lang }: { lang: Language }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const label = lang === 'ar' ? 'ابدأ الآن' : 'Start Now';

  return (
    <AnimatePresence>
      {visible && (
        <motion.a
          href="/#/intake"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(232, 82, 13, 0.5)' }}
          whileTap={{ scale: 0.97 }}
          className="fixed bottom-28 left-6 z-[9997] bg-[#E8520D] text-white font-black text-sm px-6 py-3 rounded-full shadow-[0_4px_24px_rgba(232, 82, 13, 0.35)] flex items-center gap-2 overflow-hidden group"
        >
          {/* shimmer */}
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative">{label}</span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
