import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Zap } from 'lucide-react';
import type { Language } from '../App';

interface AboutProps { lang: Language; }

export default function About({ lang }: AboutProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  const content = {
    ar: {
      tag: 'مين الفتياني',
      title: 'مدربك الشخصي',
      name: 'عبدالرحمن الفتياني',
      bio1: 'مدرب شخصي معتمد دولياً من الأكاديمية الوطنية للطب الرياضي (NASM) - الولايات المتحدة الأمريكية nasm.egypt',
      bio2: 'مدرب متخصص في اللياقة البدنية وبناء الأجسام.',
      bio3: 'أقدم برامج تدريبية وغذائية مخصصة ١٠٠٪ لكل عميل على حسب جسمه وهدفه.',
      bio4: 'أؤمن إن كل جسم مختلف، عشان كده كل برنامج بعمله خصيصاً ليك انت.',
      cta: 'اشترك دلوقتي'
    },
    en: {
      tag: 'Who is ElFetiani',
      title: 'Your Personal Coach',
      name: 'Abdelrahman elFityani',
      bio1: 'NASM Certified Personal Trainer - National Academy of Sports Medicine, USA nasm.org',
      bio2: 'Specialist coach in fitness and bodybuilding.',
      bio3: '100% personalized training and nutrition programs tailored to your body and goal.',
      bio4: 'Every body is different — that is why every program I create is designed specifically for you.',
      cta: 'Subscribe Now'
    }
  };

  const t = content[lang];
  const isRtl = lang === 'ar';

  return (
    <section id="about" className="py-24 relative bg-[#080706] overflow-hidden" ref={ref}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 30% 50%, rgba(232, 82, 13, 0.05) 0%, transparent 70%)' }} />

      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        <div className={`grid grid-cols-1 lg:grid-cols-2 gap-16 items-center ${isRtl ? 'lg:flex-row-reverse' : ''}`}>

          {/* Photo side */}
          <motion.div
            initial={{ opacity: 0, x: isRtl ? 60 : -60 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden aspect-[4/5] max-w-md mx-auto lg:mx-0 border border-white/5 shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
              <img
                src="/fet,jpg.jpeg"
                alt={t.name}
                width="400"
                height="500"
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080706]/80 via-transparent to-transparent" />

              {/* Name badge on photo */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl px-5 py-3">
                  <p className="text-white font-black text-lg">{t.name}</p>
                  <p className="text-[#E8520D] font-bold text-sm">{t.title}</p>
                </div>
              </div>
            </div>



            {/* Orange corner accent */}
            <div className={`absolute -bottom-4 ${isRtl ? '-right-4' : '-left-4'} w-24 h-24 border-b-4 border-[#E8520D] ${isRtl ? 'border-r-4' : 'border-l-4'} rounded-bl-3xl opacity-30 hidden sm:block`} />
          </motion.div>

          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: isRtl ? -60 : 60 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className={`${isRtl ? 'text-right' : 'text-left'}`}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Tag */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 }}
              className={`inline-flex items-center gap-2 bg-[#E8520D]/10 border border-[#E8520D]/30 text-[#E8520D] px-4 py-2 rounded-full text-sm font-bold mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <Zap className="w-3.5 h-3.5" />
              {t.tag}
            </motion.div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-8 text-glow">
              {t.title}
            </h2>

            <div className="space-y-4 mb-10">
              {[t.bio1, t.bio2, t.bio3, t.bio4].map((bio, i) => (
                <motion.p
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="text-gray-300 font-medium text-lg leading-relaxed"
                >
                  {bio}
                </motion.p>
              ))}
            </div>



            <motion.a
              href="#pricing"
              whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(232, 82, 13, 0.4)' }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-[#E8520D] text-white font-black text-lg px-8 py-4 rounded-xl relative overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Zap className="w-5 h-5 relative" />
              <span className="relative">{t.cta}</span>
            </motion.a>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
