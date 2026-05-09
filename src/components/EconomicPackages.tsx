import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Magnetic from './Magnetic';
import type { Language } from '../App';

interface EconomicPackagesProps {
  lang: Language;
}

const WA_NUMBER = '201015140099';

const features = [
  { text: 'برنامج غذائي محسوب حسب هدفك', vip: false },
  { text: 'برنامج تدريبي مخصص لك', vip: false },
  { text: 'منصة تجمع التمارين الخاصة بك', vip: false },
  { text: 'متابعة الأوزان والتقدم', vip: false },
  { text: 'كل شيء متجمع في منصة واحدة', vip: false },
  { text: 'متابعة كل أسبوعين', vip: false },
  { text: 'استلام البرنامج خلال يومين', vip: false },
];

const plans = [
  { id: 'eco-1m', name: 'الخطة الشهرية',  price: '400',  fakePrice: null,   unit: 'شهر',    popular: false },
  { id: 'eco-3m', name: 'خطة 3 شهور',     price: '800',  fakePrice: '1200', unit: '3 شهور', popular: true  },
  { id: 'eco-6m', name: 'خطة 6 شهور',     price: '1500', fakePrice: '2400', unit: '6 شهور', popular: false },
];

export default function EconomicPackages({ lang }: EconomicPackagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = window.innerWidth * 0.8;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const getWaMessage = (planName: string) =>
    lang === 'ar'
      ? `مرحباً، أريد الاشتراك في الباقات الاقتصادية – ${planName}`
      : `Hello, I'd like to subscribe to the Economic Package – ${planName}`;

  return (
    <section id="economic-packages" className="py-24 bg-[#070707] relative z-10 overflow-hidden">
      {/* Ambient glow top */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,85,0,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="container mx-auto px-4 md:px-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-white text-glow">
            الباقات الاقتصادية
          </h2>
          <p className="text-white/55 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            نفس البرنامج الغذائي والتدريبي المحسوب – بسعر أقل. كل حاجة في منصة واحدة، ومتابعة منتظمة كل أسبوعين عشان تكمل مسارك بثبات.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex lg:grid overflow-x-auto lg:overflow-visible lg:grid-cols-3 gap-6 lg:gap-8 hide-scrollbar snap-x snap-mandatory py-6 px-4 lg:px-0 scroll-smooth"
            style={{ scrollbarWidth: 'none' }}
          >
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                viewport={{ once: true }}
                className={`bg-[#111111] rounded-3xl p-8 lg:p-10 relative flex flex-col shrink-0 w-[85vw] sm:w-[400px] lg:w-auto snap-center border transition-colors duration-500
                  ${plan.popular
                    ? 'border-[#FF5500]/40 shadow-[0_0_40px_rgba(255,85,0,0.12)]'
                    : 'border-white/5 hover:border-[#FF5500]/30'
                  }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div
                    className="absolute -top-6 -left-6 z-20 transform -rotate-12 bg-white px-6 py-2 shadow-xl border border-gray-200"
                    style={{ clipPath: 'polygon(0% 0%, 100% 0%, 90% 50%, 100% 100%, 0% 100%, 10% 50%)' }}
                  >
                    <span className="text-primary font-black text-xl italic drop-shadow-sm block transform rotate-2">
                      الأوفر
                    </span>
                  </div>
                )}

                {/* Price block */}
                <div className="text-center mb-8 flex flex-col items-center py-4 pt-10">
                  <h3 className="text-2xl font-black text-white mb-5">{plan.name}</h3>
                  <div className="flex flex-col items-center gap-1">
                    {plan.fakePrice && (
                      <span className="text-white/35 font-bold text-xl line-through decoration-red-500/80 decoration-[3px]">
                        {plan.fakePrice} <span className="text-sm">ج.م</span>
                      </span>
                    )}
                    <span className="text-5xl font-black text-primary drop-shadow-[0_0_20px_rgba(255,85,0,0.4)] mt-1">
                      {plan.price}{' '}
                      <span className="text-xl text-white/50">ج.م</span>
                    </span>
                    <span className="text-white/35 text-sm mt-1">/ {plan.unit}</span>
                    {plan.fakePrice && (
                      <span className="mt-3 bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30 px-4 py-1.5 rounded-full text-sm font-bold">
                        وفّر{' '}
                        {Math.round(
                          ((parseInt(plan.fakePrice) - parseInt(plan.price)) /
                            parseInt(plan.fakePrice)) *
                            100
                        )}
                        %
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 border-t border-white/5 pt-6 flex-grow">
                  {features.map((feat) => (
                    <li key={feat.text} className="flex items-center gap-3 text-white/65 text-sm">
                      <span className="w-5 h-5 rounded-full bg-[#FF5500]/15 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </span>
                      <span>{feat.text}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="border-t border-white/5 pt-6 text-center">
                  <Magnetic intensity={0.15}>
                    <a
                      href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(getWaMessage(plan.name))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block text-center w-full py-4 rounded-xl font-black text-lg transition-all hover:scale-105
                        ${plan.popular
                          ? 'bg-primary text-white shadow-[0_0_20px_rgba(255,85,0,0.4)] hover:shadow-[0_0_30px_rgba(255,85,0,0.8)]'
                          : 'bg-transparent text-white border-2 border-white/30 hover:border-white hover:bg-white hover:text-[#111111]'
                        }`}
                    >
                      اشترك الآن
                    </a>
                  </Magnetic>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile scroll arrows */}
          <button
            onClick={() => scroll(lang === 'ar' ? 'right' : 'left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-[#FF5500] hover:border-[#FF5500] transition-colors lg:hidden z-20 shadow-lg active:scale-95"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scroll(lang === 'ar' ? 'left' : 'right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-[#FF5500] hover:border-[#FF5500] transition-colors lg:hidden z-20 shadow-lg active:scale-95"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
