import { motion, useScroll, useTransform } from 'framer-motion';
import Magnetic from './Magnetic';
import type { Language } from '../App';

interface HeroProps {
  lang: Language;
}

export default function Hero({ lang }: HeroProps) {
  const content = {
    ar: {
      headlineMain: 'انا جاهز.. انت',
      headlineGlow: 'جاهز؟',
      cta: 'اشترك دلوقتي',
    },
    en: {
      headlineMain: 'I am ready.. are',
      headlineGlow: 'you?',
      cta: 'Subscribe Now',
    }
  };

  const t = content[lang];

  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 800], [1.1, 1]);
  const opacity = useTransform(scrollY, [0, 800], [1, 0.3]);
  const textY = useTransform(scrollY, [0, 500], [0, -60]);

  return (
    <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
      
      {/* Left side image background */}
      <div className="absolute inset-0 z-0 flex flex-col lg:flex-row">
        <div className="w-full h-[65vh] lg:h-full lg:w-1/2 relative overflow-hidden">
          <motion.img 
            style={{ scale, opacity }}
            src="/hero-back.jpg.png"
            alt="Coach" 
            className="w-full h-full object-cover object-[center_top] md:object-center origin-top opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent lg:bg-gradient-to-l lg:via-[#050505]/80 lg:to-black/30" />
        </div>
        <div className="flex-1 bg-[#050505]"></div>
      </div>

      {/* Floating ambient particles */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-[#FF5500] pointer-events-none"
          style={{
            width: `${(i + 1) * 4}px`,
            height: `${(i + 1) * 4}px`,
            top: `${20 + i * 30}%`,
            right: `${5 + i * 8}%`,
            opacity: 0.3,
          }}
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ repeat: Infinity, duration: 3 + i, delay: i * 0.8, ease: "easeInOut" }}
        />
      ))}

      <div className="container mx-auto px-4 md:px-8 relative z-10 h-full flex items-center justify-center lg:justify-end pt-24 lg:pt-20">
        
        <motion.div 
          style={{ y: textY }}
          className="w-full lg:w-1/2 flex flex-col items-center lg:items-end text-center lg:text-end mt-10"
        >
          <motion.h1 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-5xl md:text-6xl lg:text-8xl font-black leading-tight tracking-tight mb-8"
          >
            <span className="block text-white mb-2 leading-[1.1]">{t.headlineMain}</span>
            <motion.span 
              className="block text-hollow drop-shadow-[0_0_15px_rgba(255,85,0,0.8)] leading-[1.3]"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {t.headlineGlow}
            </motion.span>
          </motion.h1>
          
          <Magnetic intensity={0.15}>
            <motion.a 
              href="#economic-packages"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById('economic-packages')?.scrollIntoView({ behavior: 'smooth' });
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(255,85,0,0.5)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-block cursor-pointer text-center bg-primary text-white font-bold text-lg lg:text-xl px-10 py-4 rounded-lg shadow-lg mb-12 lg:mb-16 w-full sm:w-auto relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
              <span className="relative">{t.cta}</span>
            </motion.a>
          </Magnetic>
          
        </motion.div>

      </div>
    </section>
  );
}
