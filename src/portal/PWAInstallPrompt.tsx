// ─── PWA Install Prompt ─────────────────────────────────────────────────────
// Shows a native-feeling install banner for the PWA on mobile devices.
// Uses the beforeinstallprompt event.

import { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed the banner before
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      // Show again after 7 days
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    function handleBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Delay showing the banner for a smoother experience
      setTimeout(() => setShowBanner(true), 3000);
    }

    function handleAppInstalled() {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  }

  function handleDismiss() {
    setShowBanner(false);
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  }

  if (isInstalled) return null;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-[calc(72px+env(safe-area-inset-bottom,0px))] md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[45]"
        >
          <div className="bg-[#111]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl shadow-black/50">
            <button
              onClick={handleDismiss}
              className="absolute top-3 left-3 p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition"
              aria-label="إغلاق"
            >
              <X size={14} />
            </button>

            <div className="flex items-start gap-4">
              {/* App Icon */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF5500] to-[#FF3300] flex items-center justify-center font-black text-white text-lg shadow-[0_0_20px_rgba(255,85,0,0.3)] flex-shrink-0">
                F
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone size={14} className="text-[#FF5500]" />
                  <h3 className="font-black text-sm">حمّل التطبيق</h3>
                </div>
                <p className="text-white/50 text-xs leading-relaxed mb-3">
                  أضف التطبيق لشاشتك الرئيسية للوصول السريع وتجربة أفضل
                </p>
                <button
                  onClick={handleInstall}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF5500] hover:bg-[#FF6620] text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-[0_6px_16px_rgba(255,85,0,0.25)] active:scale-[0.97]"
                >
                  <Download size={16} />
                  تثبيت التطبيق
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
