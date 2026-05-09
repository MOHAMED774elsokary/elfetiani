import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Language } from '../App';

interface TestimonialsProps { lang: Language; }

const reviews = {
  ar: [
    { name: 'محمد علي', result: 'خسر ٢٠ كجم', stars: 5, image: '/trans1.jpeg' },
    { name: 'عمر خالد', result: 'تنشيف وبروز عضلي', stars: 5, image: '/trans2.jpeg' },
    { name: 'ياسين حسن', result: 'تغيير جذري في ٩٠ يوم', stars: 5, image: '/trans3.jpeg' },
  ],
  en: [
    { name: 'Mohamed Ali', result: 'Lost 20kg', stars: 5, image: '/trans1.jpeg' },
    { name: 'Omar Khaled', result: 'Shredded & Defined', stars: 5, image: '/trans2.jpeg' },
    { name: 'Yassin Hassan', result: '90-Day Transformation', stars: 5, image: '/trans3.jpeg' },
  ]
};

export default function Testimonials({ lang }: TestimonialsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth * 0.8;
      const move = direction === 'left' ? -scrollAmount : scrollAmount;
      scrollRef.current.scrollBy({ left: move, behavior: 'smooth' });
    }
  };

  const t = { ar: { title: 'آراء العملاء', subtitle: 'أكثر من ١٠٠٠ قصة نجاح' }, en: { title: 'Client Reviews', subtitle: 'Over 1,000 success stories' } };
  const list = reviews[lang];

  return (
    <section id="testimonials" className="py-24 relative bg-[#050505] overflow-hidden" ref={ref}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 40% at 50% 80%, rgba(255,85,0,0.04) 0%, transparent 70%)' }} />

      <div className="container mx-auto px-4 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white text-glow mb-3">{t[lang].title}</h2>
          <div className="flex items-center justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-[#FF5500] fill-[#FF5500]" />)}
            <span className="text-white/40 text-sm ml-2 font-bold">4.9 / 5</span>
          </div>
          <div className="w-16 h-1 bg-[#FF5500] mx-auto rounded-full mt-6 shadow-[0_0_10px_rgba(255,85,0,0.6)]" />
        </motion.div>

        <div className="relative group/carousel">
          <div 
            ref={scrollRef} 
            className="flex lg:grid overflow-x-auto lg:overflow-visible lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 md:px-0 hide-scrollbar snap-x snap-mandatory py-4 scroll-smooth"
            style={{ scrollbarWidth: 'none' }}
          >
            {list.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.65, delay: i * 0.09 }}
                className="w-[85vw] shrink-0 snap-center md:w-[45vw] lg:w-auto bg-transparent border border-white/5 hover:border-[#FF5500]/25 rounded-2xl overflow-hidden flex flex-col gap-0 transition-colors duration-500 group"
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              >
                {/* Image Container */}
                <div className="relative overflow-hidden">
                  <img 
                    src={r.image} 
                    alt="Testimonial" 
                    className="w-full h-auto group-hover:scale-105 transition-transform duration-700" 
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Swipe indicator arrows overlaid on cards (Mobile/Tablet only, matching Pricing) */}
          <button 
            onClick={() => scroll(lang === 'ar' ? 'right' : 'left')} 
            className="absolute left-1 top-[40%] -translate-y-1/2 p-2.5 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-[#FF5500] hover:border-[#FF5500] transition-all lg:hidden z-20 shadow-lg pointer-events-auto active:scale-95"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => scroll(lang === 'ar' ? 'left' : 'right')} 
            className="absolute right-1 top-[40%] -translate-y-1/2 p-2.5 bg-black/60 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-[#FF5500] hover:border-[#FF5500] transition-all lg:hidden z-20 shadow-lg pointer-events-auto active:scale-95"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
