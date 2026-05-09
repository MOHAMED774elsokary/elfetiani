import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Play, Zap, ChevronDown } from 'lucide-react';
import type { Language } from '../App';

interface VideoSectionProps {
  lang: Language;
}

export default function VideoSection({ lang }: VideoSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  // Parallax on the title text
  const titleY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  // Scale the video container as it enters screen
  const videoScale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.92, 1, 1, 0.95]);
  // Glow opacity tied to scroll progress
  const glowOpacity = useTransform(scrollYProgress, [0, 0.4, 0.8], [0, 1, 0.6]);

  const t = {
    ar: {
      title: 'تفاصيل التدريب الاونلاين؟ معاك خطوه بخطوه',
      bubble: 'ممكن تفاصيل؟',
      tag: 'تدريب أونلاين'
    },
    en: {
      title: 'Online Coaching Details? Step by Step with You',
      bubble: 'Details please?',
      tag: 'Online Coaching'
    }
  };

  return (
    <section className="py-24 relative bg-[#050505] overflow-hidden" ref={sectionRef}>
      
      {/* Ambient background glow */}
      <motion.div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#FF5500]/8 blur-[120px] rounded-full pointer-events-none"
        style={{ opacity: glowOpacity }}
      />
      
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      
      <div className="container mx-auto px-4 md:px-8 relative z-10">

        {/* Animated section label */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-2 bg-[#FF5500]/10 border border-[#FF5500]/30 text-[#FF5500] px-4 py-2 rounded-full text-sm font-bold">
            <Zap className="w-4 h-4" />
            <span>{t[lang].tag}</span>
          </div>
        </motion.div>

        {/* Video title with parallax */}
        <div className="overflow-hidden mb-12 text-center">
          <motion.h2
            style={{ y: titleY }}
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight"
          >
            {t[lang].title}
          </motion.h2>
        </div>

        {/* Video container with scroll-scale */}
        <motion.div
          style={{ scale: videoScale }}
          initial={{ opacity: 0, y: 60 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden aspect-video cursor-pointer bg-[#111] border border-white/10 group shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
        >
          
          <img 
            src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" 
            alt="Video Thumbnail" 
            className="w-full h-full object-cover opacity-70 transition-all duration-700 group-hover:opacity-90 group-hover:scale-105"
          />

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/80 via-transparent to-[#050505]/40 z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/30 via-transparent to-[#050505]/30 z-10 pointer-events-none" />

          {/* Hover glow ring */}
          <div className="absolute inset-0 rounded-3xl border-2 border-[#FF5500]/0 group-hover:border-[#FF5500]/30 transition-all duration-700 z-20 pointer-events-none" />

          {/* Center Play Button */}
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            <div className="relative">
              {/* Outer pulsing ring */}
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-red-600/40 -m-4"
              />
              <div className="w-20 h-14 bg-red-600 rounded-xl flex items-center justify-center shadow-[0_10px_40px_rgba(220,38,38,0.5)] transition-all duration-300 group-hover:bg-red-500 group-hover:shadow-[0_10px_60px_rgba(220,38,38,0.7)]">
                <Play className="w-8 h-8 fill-white" />
              </div>
            </div>
          </motion.div>
          
          {/* Floating bubble badge */}
          <motion.div 
            initial={{ y: 0 }}
            animate={{ y: [-6, 6, -6] }}
            transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            className="absolute bottom-8 left-8 z-30"
          >
            <div className="bg-[#FF5500] text-white font-black text-2xl md:text-4xl px-6 py-4 rounded-2xl rounded-bl-none shadow-[0_10px_40px_rgba(255,85,0,0.5)] border border-white/10 backdrop-blur-sm">
              {t[lang].bubble}
            </div>
          </motion.div>

        </motion.div>

        {/* Bottom scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1, delay: 0.8 }}
          className="flex justify-center mt-10"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          >
            <ChevronDown className="w-6 h-6 text-white/20" />
          </motion.div>
        </motion.div>

      </div>
    </section>
  );
}
