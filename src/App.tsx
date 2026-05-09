import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import EconomicPackages from './components/EconomicPackages';
import FAQ from './components/FAQ';
import Footer from './components/Footer';

import WhatsAppFloat from './components/WhatsAppFloat';


export type Language = 'ar' | 'en';

function App() {
  const [lang, setLang] = useState<Language>('ar');

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  return (
    <div className="bg-dark text-white min-h-[100dvh] font-sans selection:bg-primary/30 relative">
      <div className="bg-noise"></div>
      <Navbar lang={lang} toggleLang={toggleLang} />
      <main>
        <Hero lang={lang} />
        <About lang={lang} />
        <Testimonials lang={lang} />
        <Services lang={lang} />
        <EconomicPackages lang={lang} />
        <Pricing lang={lang} />
        <FAQ lang={lang} />
        <Footer lang={lang} />
      </main>
      <WhatsAppFloat lang={lang} />
    </div>
  );
}

export default App;
