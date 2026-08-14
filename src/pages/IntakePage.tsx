import { useState } from 'react';
import PasswordGate from '../components/PasswordGate';
import ClientIntakeForm from '../components/ClientIntakeForm';
import type { Language } from '../App';

export default function IntakePage() {
  const [lang, setLang] = useState<Language>('ar');

  return (
    <PasswordGate>
      <div className="bg-[#080706] min-h-screen text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        {/* Mini header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#080706]/95 backdrop-blur-xl border-b border-white/5 py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#E8520D] to-[#FF3300] flex items-center justify-center font-black text-white text-sm shadow-[0_0_15px_rgba(232, 82, 13, 0.3)]">
              F
            </div>
            <span className="text-white font-black text-lg">EL FETIANI <span className="text-[#E8520D]">COACHING</span></span>
          </div>
          <button
            onClick={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
            className="text-sm font-bold text-white/50 hover:text-white transition"
          >
            {lang === 'ar' ? 'ENGLISH' : 'العربية'}
          </button>
        </div>
        <div className="pt-20">
          <ClientIntakeForm lang={lang} />
        </div>
      </div>
    </PasswordGate>
  );
}
