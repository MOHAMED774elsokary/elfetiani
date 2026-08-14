import { Menu, X, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Language } from '../App';

interface NavbarProps {
  lang: Language;
  toggleLang: () => void;
}

export default function Navbar({ lang, toggleLang }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = {
    ar: [
      { name: 'الصفحة الرئيسية', href: '#' },
      { name: 'مين الفتياني', href: '#' },
      { name: 'الخطط', href: '#pricing' },
      { name: 'الخدمات', href: '#services' },
      { name: 'التعليقات', href: '#testimonials' },
      { name: 'بوابة العملاء', href: '/#/intake', highlight: true }
    ],
    en: [
      { name: 'Home', href: '#' },
      { name: 'Who is الفتياني', href: '#' },
      { name: 'Plans', href: '#pricing' },
      { name: 'Services', href: '#services' },
      { name: 'Testimonials', href: '#testimonials' },
      { name: 'Client Portal', href: '/#/intake', highlight: true }
    ]
  };

  const links = navLinks[lang];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-[background-color,padding,border-color,box-shadow] duration-300 pt-safe ${isScrolled ? 'bg-[#080706]/95 shadow-[0_4px_30px_rgba(0,0,0,0.4)] border-b border-white/5 py-3 md:py-4 backdrop-blur-xl' : 'bg-transparent py-4 md:py-6 border-b border-transparent'}`}>
      
      {/* Scroll Progress Bar */}
      <div className="absolute bottom-0 left-0 h-[2px] bg-[#E8520D]/30 w-full">
        <motion.div 
          className="h-full bg-[#E8520D] shadow-[0_0_8px_rgba(232, 82, 13, 0.8)]"
          style={{ width: `${scrollProgress}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 40 }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo */}
          <motion.div 
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <a href="#" className="text-xl font-black text-white text-glow tracking-tight">الفتياني</a>
          </motion.div>

          {/* Center Links (Desktop) */}
          <motion.nav 
            className="hidden lg:flex items-center gap-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {links.map((link, idx) => {
              const isHash = link.href.startsWith('#') && link.href.length > 1;
              const handleClick = (e: React.MouseEvent) => {
                if (isHash) {
                  e.preventDefault();
                  document.getElementById(link.href.substring(1))?.scrollIntoView({ behavior: 'smooth' });
                }
              };

              return link.highlight
                ? (
                  <a
                    key={idx}
                    href={link.href}
                    onClick={handleClick}
                    className="text-[14px] font-black text-white bg-[#E8520D] hover:bg-[#C9440A] px-4 py-1.5 rounded-full transition-all shadow-[0_0_12px_rgba(232, 82, 13, 0.3)] hover:shadow-[0_0_20px_rgba(232, 82, 13, 0.5)] cursor-pointer"
                  >
                    {link.name}
                  </a>
                ) : (
                  <a
                    key={idx}
                    href={link.href}
                    onClick={link.href === '#' ? (e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); } : handleClick}
                    className="relative text-[15px] font-bold text-gray-200 hover:text-primary transition-colors group cursor-pointer"
                  >
                    {link.name}
                    <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-[#E8520D] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center" />
                  </a>
                );
            })}
          </motion.nav>

          {/* Right Actions */}
          <motion.div 
            className="hidden lg:flex items-center gap-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <button
              onClick={toggleLang}
              aria-label={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
              className="flex items-center gap-2 text-sm font-bold text-white hover:text-primary transition"
            >
              {lang === 'ar' ? 'ENGLISH' : 'العربية'}
            </button>
            <a
              href="/#/portal/login"
              className="flex items-center gap-2 text-primary hover:text-white transition font-bold text-[15px] border border-primary/30 hover:border-primary hover:bg-primary/10 px-4 py-1.5 rounded-full"
            >
              <User className="w-5 h-5 fill-none stroke-2" />
              {lang === 'ar' ? 'منصة التدريب' : 'Client Portal'}
            </a>
          </motion.div>

          {/* Mobile Toggle */}
          <motion.button 
            className="lg:hidden text-white hover:text-primary transition"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileTap={{ scale: 0.9 }}
            aria-label={mobileMenuOpen ? (lang === 'ar' ? 'إغلاق القائمة' : 'Close menu') : (lang === 'ar' ? 'فتح القائمة' : 'Open menu')}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {mobileMenuOpen 
                ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}><X className="w-8 h-8"/></motion.div>
                : <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}><Menu className="w-8 h-8"/></motion.div>
              }
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            id="mobile-menu"
            className="lg:hidden overflow-hidden absolute top-full left-0 right-0 bg-[#080706] border-b border-white/10 shadow-2xl max-h-[80dvh] overflow-y-auto"
          >
            <div className="flex flex-col gap-0 p-6">
              {links.map((link, idx) => {
                const isHash = link.href.startsWith('#') && link.href.length > 1;
                const handleClick = (e: React.MouseEvent) => {
                  if (isHash) {
                    e.preventDefault();
                    document.getElementById(link.href.substring(1))?.scrollIntoView({ behavior: 'smooth' });
                  } else if (link.href === '#') {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                  setMobileMenuOpen(false);
                };
                
                return (
                  <motion.a 
                    key={idx} 
                    href={link.href} 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.06 }}
                    className="text-xl font-bold text-gray-200 py-4 border-b border-white/5 hover:text-primary transition-colors cursor-pointer" 
                    onClick={handleClick}
                  >
                    {link.name}
                  </motion.a>
                );
              })}
              <div className="flex flex-col gap-4 pt-6">
                <button
                  onClick={() => { toggleLang(); setMobileMenuOpen(false); }}
                  aria-label={lang === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
                  className="flex items-center justify-center gap-2 text-lg font-bold text-white bg-white/5 py-3 rounded-lg hover:bg-white/10"
                >
                  {lang === 'ar' ? 'ENGLISH' : 'العربية'}
                </button>
                <a
                  href="/#/portal/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 text-primary font-bold text-lg py-3 rounded-lg border border-primary/30 hover:bg-primary/10"
                >
                  <User className="w-6 h-6" />
                  {lang === 'ar' ? 'منصة التدريب' : 'Client Portal'}
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
