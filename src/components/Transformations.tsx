import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ChevronRight, ChevronLeft, MoveHorizontal } from 'lucide-react';
import type { Language } from '../App';

interface TransformationsProps {
  lang: Language;
}

export default function Transformations({ lang }: TransformationsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth * 0.8;
      const move = direction === 'left' ? -scrollAmount : scrollAmount;
      scrollRef.current.scrollBy({ left: move, behavior: 'smooth' });
    }
  };

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  
  const content = {
    ar: {
      title: 'تحولات الأبطال',
      subtitle: 'نتائج حقيقية، أبطال حقيقيين',
      items: [
        {
          id: 1,
          name: 'أحمد محمود',
          result: 'خسارة ١٥ كجم دهون',
          duration: 'في ٤ شهور',
          image: '/trans1.jpeg',
        },
        {
          id: 2,
          name: 'عمر طارق',
          result: 'زيادة ٨ كجم عضل صافي',
          duration: 'في ٦ شهور',
          image: '/trans2.jpeg',
        },
        {
          id: 3,
          name: 'كريم حسن',
          result: 'خسارة ٢٢ كجم ببرنامج مكثف',
          duration: 'في ٥ شهور',
          image: '/trans3.jpeg',
        },
        {
          id: 4,
          name: 'مصطفى كمال',
          result: 'تنشيف وبروز عضلي',
          duration: 'في ٣ شهور',
          image: '/trans3.jpeg',
        }
      ]
    },
    en: {
      title: 'Heroes Transformations',
      subtitle: 'Real Results, Real Heroes',
      items: [
        {
          id: 1,
          name: 'Ahmed Mahmoud',
          result: 'Lost 15kg Fat',
          duration: 'in 4 Months',
          image: '/trans1.jpeg',
        },
        {
          id: 2,
          name: 'Omar Tarek',
          result: 'Gained 8kg Lean Muscle',
          duration: 'in 6 Months',
          image: '/trans2.jpeg',
        },
        {
          id: 3,
          name: 'Karim Hassan',
          result: 'Lost 22kg on Intensive',
          duration: 'in 5 Months',
          image: '/trans3.jpeg',
        },
        {
          id: 4,
          name: 'Mostafa Kamal',
          result: 'Shredded & Defined',
          duration: 'in 3 Months',
          image: '/trans3.jpeg',
        }
      ]
    }
  };

  const t = content[lang];

  return (
    <section 
      id="transformations" 
      className="py-24 relative bg-[#080706] overflow-hidden"
      ref={containerRef}
    >
      <div className="absolute inset-0 bg-noise opacity-30 pointer-events-none" />
      
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-5xl md:text-6xl font-black mb-4 text-white text-glow">
            {t.title}
          </h2>
          <p className="text-[#E8520D] font-bold text-xl drop-shadow-md">
            {t.subtitle}
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-8 lg:hidden text-white/60 bg-white/5 w-max mx-auto px-4 py-2 rounded-full border border-white/10">
            <MoveHorizontal className="w-5 h-5 animate-pulse text-[#E8520D]" />
            <span className="text-sm font-medium">{lang === 'ar' ? 'اسحب لمعرفة المزيد' : 'Drag or swipe to view more'}</span>
          </div>
        </motion.div>

        {/* CSS Snap Container */}
        <div className="relative max-w-7xl mx-auto">
          
          {/* Scroll Buttons */}
          <button 
            onClick={() => scroll(lang === 'ar' ? 'right' : 'left')} 
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full bg-black/50 hover:bg-[#E8520D] border border-white/10 hover:border-[#E8520D] text-white transition-all shadow-xl backdrop-blur-md hidden lg:block"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          <button 
            onClick={() => scroll(lang === 'ar' ? 'left' : 'right')} 
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-4 rounded-full bg-black/50 hover:bg-[#E8520D] border border-white/10 hover:border-[#E8520D] text-white transition-all shadow-xl backdrop-blur-md hidden lg:block"
          >
            <ChevronRight className="w-8 h-8" />
          </button>

          {/* Scrolling Track */}
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-6 pb-20 pt-10 px-4 -mx-4 md:px-8 md:-mx-8 lg:px-20 snap-x snap-mandatory hide-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {t.items.map((item, index) => {
              const yMotion = index % 2 === 0 ? y1 : y2;

              return (
                <motion.div 
                  key={item.id}
                  style={{ y: yMotion }}
                  className="w-[85vw] sm:w-[350px] lg:w-[400px] shrink-0 snap-center relative group rounded-3xl overflow-hidden shadow-2xl h-[450px] lg:h-[500px] border border-white/5"
                >
                  {/* Background Image */}
                  <img 
                    src={item.image} 
                    alt={item.name}
                    width="400"
                    height="500"
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 filter grayscale group-hover:grayscale-0"
                  />
                  
                  {/* Overlay Darkening */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-500 opacity-80 group-hover:opacity-90" />

                  {/* Content Fade in on Hover */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end text-end">
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + ((index % 3) * 0.1) }}
                    >
                      <h3 className="text-2xl font-black text-white mb-1 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        {item.name}
                      </h3>
                      <div className="h-[2px] w-0 bg-[#E8520D] mb-3 group-hover:w-full transition-all duration-700 ease-in-out" />
                      
                      <p className="text-[#E8520D] font-bold text-lg opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-100">
                        {item.result}
                      </p>
                      <p className="text-gray-300 font-medium text-sm opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 delay-200">
                        {item.duration}
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
