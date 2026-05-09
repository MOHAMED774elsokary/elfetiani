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
          </Routes>
          <PWAInstallPrompt />
        </NotificationProvider>
      </AuthProvider>
    </HashRouter>
  </StrictMode>,
)
