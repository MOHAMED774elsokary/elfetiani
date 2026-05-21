import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import IntakePage from './pages/IntakePage.tsx'
import PortalLoginPage from './pages/portal/PortalLoginPage.tsx'
import ClientDashboard from './pages/portal/ClientDashboard.tsx'
import AdminPanel from './pages/portal/AdminPanel.tsx'
import CoachSetupPage from './pages/portal/CoachSetupPage.tsx'
import { AuthProvider } from './portal/AuthContext.tsx'
import { NotificationProvider } from './portal/NotificationContext.tsx'
import ProtectedRoute from './portal/ProtectedRoute.tsx'
import PWAInstallPrompt from './portal/PWAInstallPrompt.tsx'

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
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-6 text-white" dir="rtl">
      <div className="text-8xl font-black text-[#FF5500]">404</div>
      <h1 className="text-2xl font-bold">الصفحة غير موجودة</h1>
      <p className="text-white/40 text-sm">الرابط الذي تبحث عنه غير موجود أو تم حذفه.</p>
      <a
        href="/#/"
        className="bg-[#FF5500] hover:bg-[#FF6620] text-white font-bold px-8 py-3 rounded-xl transition"
      >
        العودة للرئيسية
      </a>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <NotificationProvider>
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
        </NotificationProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
