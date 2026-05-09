import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Language } from '../App';

interface ServicesProps {
  lang: Language;
}

export default function Services({ lang }: ServicesProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
    }
  };

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });

  const bgY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  const content = {
    ar: {
      title: 'كل الباقات تشمل',
      items: [
        {
          id: 1,
          title: 'متابعة',
          desc: 'المتابعة هي أساس كل شئ عشان كده مش هتلاقي عندي باقات بدون متابعة بالعكس هتلاقيني بحب اعرف عنك أبسط التفاصيل و اعرف منك يومك كان ماشي ازاي؟ وتلاقيني جنبك اول ما تبعتلي او تحتاجني',
          bg: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          icon: ''
        },
        {
          id: 2,
          title: 'نظام التمرين',
          desc: 'حجم تدريبي يخص جسمك انت فقط بناء علي خبرتك و عمرك التدريبي و الأجهزة المتاحة اللي عندك في الجيم او الادوات اللي عندك في البيت، مش بس كده ده مشروح بالفيديوهات بشكل احترافي كاني واقف معاك بالظبط',
          bg: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          icon: ''
        },
        {
          id: 3,
          title: 'نظام غذائي',
          desc: 'نظام غذائي محسوب السعرات و الماكروز و الميكروز و الأهم من ده انه واقعي و مناسب ليك من ناحية اختيارات الاكل و الميزانية و طبعاً مرن جداً لاقصي درجة مش لازم كل يوم نفس الاكل، شوف الفيديو اللي فوق و تعالي',
          bg: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          icon: ''
        }
      ]
    },
    en: {
      title: 'All Packages Include',
      items: [
        {
          id: 1,
          title: 'Follow-up',
          desc: 'Continuous tracking is the foundation. I want to know your simplest details to ensure we stay on track. Im right by your side whenever you need me.',
          bg: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          icon: ''
        },
        {
          id: 2,
          title: 'Training System',
          desc: 'Volume optimized for your body, experience, and available equipment. Detailed high-quality video demonstrations make it feel like Im training you in person.',
          bg: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          icon: ''
        },
        {
          id: 3,
          title: 'Nutrition Plan',
          desc: 'Calculated macros tailored realistically to your budget and food preferences. Highly flexible so you never get bored. Watch the video above to learn more!',
          bg: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
          icon: ''
        }
      ]
    }
  };

  const t = content[lang];

  return (
    <section id="services" className="py-24 relative bg-[#050505] overflow-hidden" ref={sectionRef}>
      
      {/* Floating ambient background */}
      <motion.div 
        style={{ y: bgY }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF5500]/5 blur-[100px] rounded-full pointer-events-none"
      />

      <div className="container mx-auto px-4 md:px-8 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 text-glow">
            {t.title}
          </h2>
          <div className="w-16 h-1 bg-[#FF5500] mx-auto rounded-full mt-4 shadow-[0_0_10px_rgba(255,85,0,0.6)]" />
        </motion.div>

        <div className="relative group/carousel">
          <div ref={scrollRef} className="flex lg:grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-8 sm:pb-0 scroll-smooth style-scroll-none" style={{ scrollbarWidth: 'none' }}>
            {t.items.map((item, index) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: index * 0.15 }}
                className="flex-shrink-0 w-[85vw] sm:w-[45vw] lg:w-auto snap-center bg-[#111111] rounded-2xl overflow-hidden flex flex-col group h-full border border-white/5 hover:border-[#FF5500]/30 transition-colors duration-500 cursor-pointer"
              >
                {/* Image Zone */}
                <div className="h-64 overflow-hidden relative">
                  <div className="absolute inset-0 bg-dark/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                  <img 
                    src={item.bg} 
                    alt={item.title} 
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Top orange glow reveal on hover */}
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-[#FF5500] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20" />
                </div>
                
                {/* Content */}
                <div className="p-8 text-end flex-grow flex flex-col">
                  <div className="flex items-center justify-end mb-4">
                    <h3 className="text-2xl font-bold text-primary group-hover:text-white transition-colors duration-300">{item.title}</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed font-medium group-hover:text-gray-300 transition-colors duration-300">
                    {item.desc}
                  </p>
                </div>
                
                {/* Bottom progress bar animation on hover */}
                <div className="h-[2px] bg-white/5 mx-6 mb-6 rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF5500] w-0 group-hover:w-full transition-all duration-700 ease-out rounded-full shadow-[0_0_8px_rgba(255,85,0,0.6)]" />
                </div>

              </motion.div>
            ))}
          </div>

          {/* Swipe indicator arrows overlaid on images (Mobile only) */}
          <button onClick={() => scroll('left')} className="absolute left-1 top-32 -translate-y-1/2 p-2.5 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-[#FF5500] hover:border-[#FF5500] transition-colors lg:hidden z-20 shadow-lg pointer-events-auto">
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button onClick={() => scroll('right')} className="absolute right-1 top-32 -translate-y-1/2 p-2.5 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-[#FF5500] hover:border-[#FF5500] transition-colors lg:hidden z-20 shadow-lg pointer-events-auto">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
