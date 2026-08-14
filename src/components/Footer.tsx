import { motion } from 'framer-motion';
import { MessageCircle, Zap, Heart, ArrowUp } from 'lucide-react';
import type { Language } from '../App';

interface FooterProps {
  lang: Language;
}

export default function Footer({ lang }: FooterProps) {
  const WA_NUMBER = "201015140099";

  const content = {
    ar: {
      tagline: 'الفتياني Coaching',
      description: 'أحترافية حقيقية، نتائج حقيقية. معاك في كل خطوة من رحلتك.',
      links: [
        { name: 'الصفحة الرئيسية', href: '#' },
        { name: 'باقات التدريب', href: '#pricing' },
        { name: 'الأسئلة المتكررة', href: '#' },
        { name: 'بوابة العملاء', href: '/#/intake' },
      ],
      copy: 'جميع الحقوق محفوظة',
      made: 'صُنع بـ',
      cta: 'تواصل معي'
    },
    en: {
      tagline: 'الفتياني Coaching',
      description: 'Real professionalism, real results. We are with you every step of the way.',
      links: [
        { name: 'Home', href: '#' },
        { name: 'Training Packages', href: '#pricing' },
        { name: 'FAQ', href: '#' },
        { name: 'Client Portal', href: '/#/intake' },
      ],
      copy: 'All rights reserved',
      made: 'Made with',
      cta: 'Contact Me'
    }
  };

  const t = content[lang];

  return (
    <footer className="relative bg-[#080706] border-t border-white/5 pt-20 pb-10 overflow-hidden">
      


      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-16">
          
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-end"
          >
            <div className="flex items-center justify-end gap-3 mb-4">
              <h3 className="text-2xl font-black text-white text-glow">{t.tagline}</h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed font-medium">{t.description}</p>
            
            {/* Social Icons */}
            <div className="flex items-center justify-end gap-4 mt-6">
              <motion.a href="https://www.instagram.com/_elfetyani_/" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.2 }} className="text-gray-400 hover:text-[#E8520D] transition-colors">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </motion.a>
              <motion.a 
                href={`https://wa.me/${WA_NUMBER}`} 
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.2 }} 
                className="text-gray-400 hover:text-green-400 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </motion.a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-end"
          >
            <h4 className="text-white font-black text-lg mb-6 text-[#E8520D]">
              {lang === 'ar' ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <ul className="space-y-3">
              {t.links.map((link, i) => (
                <motion.li key={i} whileHover={{ x: lang === 'ar' ? 4 : -4 }}>
                  <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm font-medium">
                    {link.name}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* CTA Block */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-end"
          >
            <h4 className="text-white font-black text-lg mb-6 text-[#E8520D]">
              {lang === 'ar' ? 'جاهز تبدأ؟' : 'Ready to Start?'}
            </h4>
            <p className="text-gray-400 text-sm mb-6 font-medium">
              {lang === 'ar' 
                ? 'تواصل معي دلوقتي وابدأ رحلتك للتحول'
                : 'Contact me now and begin your transformation journey'}
            </p>
            <motion.a
              href={`https://wa.me/${WA_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(232, 82, 13, 0.4)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 bg-[#E8520D] text-white font-bold px-6 py-3 rounded-lg transition-all"
            >
              <Zap className="w-4 h-4" />
              {t.cta}
            </motion.a>
          </motion.div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} {t.tagline} — {t.copy}</p>
          <div className="flex items-center gap-6">
            <p className="flex items-center gap-1">
              {t.made} <Heart className="w-3 h-3 text-[#E8520D] fill-[#E8520D]" /> الفتياني
            </p>
            <motion.button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 rounded-full bg-white/5 border border-white/10 hover:bg-[#E8520D] hover:border-[#E8520D] flex items-center justify-center transition-colors duration-300"
            >
              <ArrowUp className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </footer>
  );
}
