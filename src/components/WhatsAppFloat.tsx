import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import type { Language } from '../App';

const WA_NUMBER = '201015140099';

export default function WhatsAppFloat({ lang }: { lang: Language }) {
  const [open, setOpen] = useState(false);
  const isRtl = lang === 'ar';

  const t = {
    ar: {
      greeting: 'مرحباً! 👋',
      sub: 'لو محتاج أي تفاصيل عن الكوتش أو نظام التدريب، أنا هنا لمساعدتك',
      message: 'مرحباً، أريد الاستفسار عن الكوتش ونظام التدريب',
      cta: 'ابدأ المحادثة',
      name: 'الفتياني Coaching',
      status: 'متاح الآن ✅',
    },
    en: {
      greeting: 'Hello! 👋',
      sub: 'Need information about the coach or the system? I am here to help!',
      message: 'Hello, I would like to inquire about the coach and the training system',
      cta: 'Start Chat',
      name: 'EL FETIANI Coaching',
      status: 'Available Now ✅',
    }
  };
  const c = t[lang];

  const waUrl = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(c.message)}`;

  return (
    /* Always on the LEFT — Chatbase widget owns the right side */
    <div className="fixed bottom-6 left-6 z-[45] flex flex-col items-start gap-3"
      style={{ bottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 24px))' }}>

      {/* Expandable card */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="bg-[#111] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] w-72 overflow-hidden"
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="bg-[#25D366] px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-white font-black text-sm">{c.name}</p>
                <p className="text-white/80 text-xs font-medium">{c.status}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {/* Chat bubble */}
              <div className={`bg-[#1a1a1a] border border-white/5 rounded-2xl ${isRtl ? 'rounded-tr-sm' : 'rounded-tl-sm'} px-4 py-3 mb-5`}>
                <p className="text-white font-bold text-sm mb-0.5">{c.greeting}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{c.sub}</p>
              </div>

              <motion.a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-black py-3 rounded-xl transition-colors w-full"
              >
                <MessageCircle className="w-4 h-4" />
                {c.cta}
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.92 }}
        className="relative w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-[0_4px_24px_rgba(37,211,102,0.5)] hover:shadow-[0_4px_32px_rgba(37,211,102,0.7)] transition-shadow"
        aria-label="WhatsApp"
      >
        {/* Pulse rings — only when closed */}
        {!open && (
          <>
            <motion.div className="absolute inset-0 rounded-full bg-[#25D366]"
              animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }} />
            <motion.div className="absolute inset-0 rounded-full bg-[#25D366]"
              animate={{ scale: [1, 1.8, 1.8], opacity: [0.25, 0, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut', delay: 0.5 }} />
          </>
        )}

        <AnimatePresence mode="wait">
          {open
            ? <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <X className="w-6 h-6 text-white relative z-10" />
              </motion.div>
            : <motion.div key="wa" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                <svg className="w-7 h-7 fill-white relative z-10" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </motion.div>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
