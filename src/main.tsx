import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// Lazy-load portal and intake pages so the public landing page
// does NOT pull in Firebase and all portal code on first load.
const IntakePage = lazy(() => import('./pages/IntakePage.tsx'));
const PortalLoginPage = lazy(() => import('./pages/portal/PortalLoginPage.tsx'));
const ClientDashboard = lazy(() => import('./pages/portal/ClientDashboard.tsx'));
const AdminPanel = lazy(() => import('./pages/portal/AdminPanel.tsx'));
const CoachSetupPage = lazy(() => import('./pages/portal/CoachSetupPage.tsx'));
const PWAInstallPrompt = lazy(() => import('./portal/PWAInstallPrompt.tsx'));

import { AuthProvider } from './portal/AuthContext.tsx'
import { NotificationProvider } from './portal/NotificationContext.tsx'
import ProtectedRoute from './portal/ProtectedRoute.tsx'

// Register PWA service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // The VitePWA plugin auto-registers the Workbox SW.
    // We also register the Firebase messaging SW for background notifications.
    navigator.serviceWorker.register('/firebase-messaging-sw.js')
      .then((reg) => console.log('FCM SW registered:', reg.scope))
      .catch((err) => console.warn('FCM SW registration failed:', err));
  });
  // NOTE: No controllerchange reload listener here — it conflicts with the
  // version-based nuke script in index.html and causes infinite reload loops.
}

// ─── Simple 404 page ────────────────────────────────────────────────────────
function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#080706] flex flex-col items-center justify-center gap-6 text-white" dir="rtl">
      <div className="text-8xl font-black text-[#E8520D]">404</div>
      <h1 className="text-2xl font-bold">الصفحة غير موجودة</h1>
      <p className="text-white/40 text-sm">الرابط الذي تبحث عنه غير موجود أو تم حذفه.</p>
      <a
        href="/#/"
        className="bg-[#E8520D] hover:bg-[#C9440A] text-white font-bold px-8 py-3 rounded-xl transition"
      >
        العودة للرئيسية
      </a>
    </div>
  );
}

// ─── Fallback spinner for lazy routes ───────────────────────────────────────
function PortalFallback() {
  return (
    <div className="min-h-screen bg-[#080706] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#E8520D] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <NotificationProvider>
          <Suspense fallback={<PortalFallback />}>
            <Routes>
              {/* Public site */}
              <Route path="/" element={<App />} />
              <Route path="/intake" element={<IntakePage />} />

              {/* Portal */}
              <Route path="/portal/login" element={<PortalLoginPage />} />

              {/*
                /portal/setup — Coach account creation.
                SECURITY: The route itself is kept accessible (coach may need it on first run),
                but the CoachSetupPage enforces the email restriction via VITE_COACH_EMAIL.
                Redirect to login if already authenticated.
              */}
              <Route path="/portal/setup" element={<CoachSetupPage />} />

              <Route
                path="/portal/dashboard/*"
                element={
                  <ProtectedRoute>
                    <ClientDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/portal/admin/*"
                element={
                  <ProtectedRoute requireCoach>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />

              {/* 404 catch-all */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <PWAInstallPrompt />
          </Suspense>
        </NotificationProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
