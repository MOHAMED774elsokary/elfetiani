import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import Magnetic from './Magnetic';
import type { Language } from '../App';

interface PricingProps {
  lang: Language;
}

const vipFeatures = {
  ar: [
    'برنامج غذائي محسوب حسب هدفك',
    'برنامج تدريبي مخصص لك',
    'منصة تجمع التمارين الخاصة بك',
    'متابعة الأوزان والتقدم',
    'كل شيء متجمع في منصة واحدة',
    'متابعة يومية مساءً مع المدرب',
    'استلام البرنامج خلال يوم واحد',
  ],
  en: [
    'Personalised nutrition plan',
    'Custom training program',
    'Platform for all your workouts',
    'Weight & progress tracking',
    'Everything in one platform',
    'Daily evening check-in with coach',
    'Program delivered within 1 day',
  ],
};

export default function Pricing({ lang }: PricingProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = window.innerWidth * 0.8;
      const move = direction === 'left' ? -scrollAmount : scrollAmount;
      scrollRef.current.scrollBy({ left: move, behavior: 'smooth' });
    }
  };

  const content = {
    ar: {
      titleMain: 'باقات VIP',
      titleSub: 'متابعة يومية – نتائج أسرع',
      desc: 'لو عايز تحقق نتائجك بأسرع وقت ممكن مع متابعة يومية من المدرب مباشرةً – باقات VIP هي اختيارك. أسعار حصرية لفترة محدودة.',
      tiers: [
        {
          id: '1-month',
          name: 'اشتراك شهر واحد',
          price: '1000',
          fakePrice: '1500',
          discountPercent: '33',
          popular: false,
          cta: 'اشترك الآن',
        },
        {
          id: '3-months',
          name: 'اشتراك ٣ شهور',
          price: '2000',
          fakePrice: '3500',
          discountPercent: '42',
          popular: true,
          badge: 'الأكثر مبيعاً',
          cta: 'اشترك الآن',
        },
        {
          id: '6-months',
          name: 'اشتراك ٦ شهور',
          price: '3000',
          fakePrice: '6000',
          discountPercent: '50',
          popular: false,
          cta: 'اشترك الآن',
        },
      ],
    },
    en: {
      titleMain: 'VIP Packages',
      titleSub: 'Daily coaching – faster results',
      desc: 'Get maximum results with daily coaching and a fully personalised plan. Limited-time exclusive pricing.',
      tiers: [
        {
          id: '1-month',
          name: '1 Month Plan',
          price: '1000',
          fakePrice: '1500',
          discountPercent: '33',
          popular: false,
          cta: 'Subscribe Now',
        },
        {
          id: '3-months',
          name: '3 Months Plan',
          price: '2000',
          fakePrice: '3500',
          discountPercent: '42',
          popular: true,
          badge: 'Best Seller',
          cta: 'Subscribe Now',
        },
        {
          id: '6-months',
          name: '6 Months Plan',
          price: '3000',
          fakePrice: '6000',
          discountPercent: '50',
          popular: false,
          cta: 'Subscribe Now',
        },
      ],
    },
  };

  const t = content[lang];
  const feats = vipFeatures[lang];
  const WA_NUMBER = '201015140099';

  const getMessageText = (tierName: string) => {
    return lang === 'ar'
      ? `مرحباً، أريد الاشتراك في باقات VIP – ${tierName}`
      : `Hello, I would like to subscribe to the VIP package – ${tierName}`;
  };

  return (
    <section id="pricing" className="py-24 bg-[#050505] relative z-10 overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(255,85,0,0.07) 0%, transparent 70%)',
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
          <h2 className="text-4xl md:text-5xl font-black mb-3 text-white text-glow">
            {t.titleMain}
          </h2>
          <p className="text-primary font-bold text-lg md:text-xl mb-3">{t.titleSub}</p>
          <p className="text-white/55 text-base max-w-xl mx-auto leading-relaxed">{t.desc}</p>
        </motion.div>

        <div className="relative group/carousel">
          <div
            ref={scrollRef}
            className="flex lg:grid overflow-x-auto lg:overflow-visible lg:grid-cols-3 gap-6 lg:gap-8 hide-scrollbar snap-x snap-mandatory py-6 max-w-7xl mx-auto px-4 lg:px-0 scroll-smooth"
            style={{ scrollbarWidth: 'none' }}
          >
            {t.tiers.map((tier, index) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                viewport={{ once: true }}
                className={`bg-[#111111] rounded-3xl p-8 lg:p-10 relative flex flex-col shrink-0 w-[85vw] sm:w-[400px] lg:w-auto snap-center border transition-colors duration-500
                  ${tier.popular
                    ? 'border-[#FF5500]/40 shadow-[0_0_40px_rgba(255,85,0,0.12)]'
                    : 'border-white/5 hover:border-[#FF5500]/30'
                  }`}
              >
                {tier.popular && (
                  <div
                    className="absolute -top-6 -left-6 z-20 transform -rotate-12 bg-white px-6 py-2 shadow-xl border border-gray-200"
                    style={{ clipPath: 'polygon(0% 0%, 100% 0%, 90% 50%, 100% 100%, 0% 100%, 10% 50%)' }}
                  >
                    <span className="text-primary font-black text-xl italic drop-shadow-sm block transform rotate-2">
                      {tier.badge}
                    </span>
                  </div>
                )}

                {/* Price block */}
                <div className="text-center mb-8 flex flex-col items-center py-4 pt-10">
                  <h3 className="text-2xl font-black text-white mb-5">{tier.name}</h3>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white/35 font-bold text-xl line-through decoration-red-500/80 decoration-[3px]">
                      {tier.fakePrice}{' '}
                      <span className="text-sm">{lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                    </span>
                    <span className="text-5xl font-black text-primary drop-shadow-[0_0_20px_rgba(255,85,0,0.4)] mt-1">
                      {tier.price}{' '}
                      <span className="text-xl text-white/50">{lang === 'ar' ? 'ج.م' : 'EGP'}</span>
                    </span>
                    {tier.discountPercent && (
                      <span className="mt-3 bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/30 px-4 py-1.5 rounded-full text-sm font-bold">
                        {lang === 'ar' ? 'خصم' : 'Save'} {tier.discountPercent}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 border-t border-white/5 pt-6 flex-grow">
                  {feats.map((feat) => (
                    <li key={feat} className="flex items-center gap-3 text-white/65 text-sm">
                      <span className="w-5 h-5 rounded-full bg-[#FF5500]/15 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto border-t border-white/5 pt-6 text-center">
                  <Magnetic intensity={0.15}>
                    <a
                      href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(getMessageText(tier.name))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block text-center w-full py-4 rounded-xl font-black text-lg transition-all hover:scale-105
                        ${tier.popular
                          ? 'bg-primary text-white shadow-[0_0_20px_rgba(255,85,0,0.4)] hover:shadow-[0_0_30px_rgba(255,85,0,0.8)]'
                          : 'bg-transparent text-white border-2 border-white/30 hover:border-white hover:bg-white hover:text-[#111111]'
                        }`}
                    >
                      {tier.cta}
                    </a>
                  </Magnetic>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Mobile scroll arrows */}
          <button
            onClick={() => scroll(lang === 'ar' ? 'right' : 'left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-[#FF5500] hover:border-[#FF5500] transition-colors lg:hidden z-20 shadow-lg pointer-events-auto active:scale-95"
            aria-label="Previous"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => scroll(lang === 'ar' ? 'left' : 'right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2.5 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/10 hover:bg-[#FF5500] hover:border-[#FF5500] transition-colors lg:hidden z-20 shadow-lg pointer-events-auto active:scale-95"
            aria-label="Next"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </section>
  );
}
