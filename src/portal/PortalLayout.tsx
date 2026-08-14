import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import NotificationsDropdown from './NotificationsDropdown';
import type { ReactNode } from 'react';
import {
  LayoutDashboard,
  Dumbbell,
  UtensilsCrossed,
  Users,
  LogOut,
  ShieldCheck,
  ClipboardList,
  BellRing,
} from 'lucide-react';

interface Props {
  children: ReactNode;
  title: string;
}

const Logo = () => (
  <div className="flex items-center gap-2.5">
    <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-[#E8520D] to-[#C44108] flex items-center justify-center font-black text-white shadow-[0_0_15px_rgba(232,82,13,0.25)]">
      F
    </div>
    <div>
      <div className="font-black text-sm text-white leading-none">EL FETIANI</div>
      <div className="text-[#E8520D] text-xs font-bold tracking-widest leading-none">COACHING</div>
    </div>
  </div>
);

export default function PortalLayout({ children, title }: Props) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const isCoach = currentUser?.role === 'coach';

  function handleLogout() {
    logout().then(() => {
      // Replace current history entry so "back" after logout doesn't
      // navigate to a protected URL (the ProtectedRoute would redirect,
      // but this prevents any flash of the spinner on protected paths).
      navigate('/', { replace: true });
      // Additional defense: lock popstate so fast back-press won't bypass
      window.history.pushState(null, '', window.location.href);
    });
  }

  const clientLinks = [
    { to: '/portal/dashboard', icon: LayoutDashboard, label: 'لوحتي', labelEn: 'Dashboard' },
    { to: '/portal/dashboard/workout', icon: Dumbbell, label: 'التمارين', labelEn: 'Workout' },
    { to: '/portal/dashboard/nutrition', icon: UtensilsCrossed, label: 'التغذية', labelEn: 'Nutrition' },
    { to: '/portal/dashboard/checkin', icon: ClipboardList, label: 'تسجيل أسبوعي', labelEn: 'Check-in' },
  ];

  const coachLinks = [
    { to: '/portal/admin', icon: Users, label: 'العملاء', labelEn: 'Clients' },
    { to: '/portal/admin/add', icon: ShieldCheck, label: 'إضافة عميل', labelEn: 'Add Client' },
    { to: '/portal/admin/notifications', icon: BellRing, label: 'الإشعارات', labelEn: 'Notifications' },
  ];

  const links = isCoach ? coachLinks : clientLinks;

  // Height of mobile bottom nav: 64px + safe-area
  // This ensures content never hides behind the nav
  const MOBILE_NAV_HEIGHT = 'calc(64px + env(safe-area-inset-bottom, 0px))';

  return (
    <div className="min-h-[100dvh] bg-[#080706] text-[#f0ece8] flex" dir="rtl">
      {/* Sidebar (Desktop Only) */}
      <aside className="hidden md:flex w-64 bg-[#0d0c0b] border-l border-white/[0.06] flex-col flex-shrink-0 sticky top-0 h-[100dvh] overflow-y-auto">
        <div className="p-6 border-b border-white/5">
          <a href="/#/" title="العودة للصفحة الرئيسية" className="block hover:opacity-75 transition-opacity">
            <Logo />
          </a>
          <div className="mt-4 bg-white/5 rounded-xl p-3">
            <div className="text-xs text-white/40 mb-0.5">مرحباً،</div>
            <div className="font-bold text-sm truncate">{currentUser?.email}</div>
            <div className="text-xs text-[#E8520D] mt-0.5">{isCoach ? 'المدرب' : 'عميل'}</div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {links.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to.split('/').length <= 3}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-[#E8520D]/15 text-[#E8520D] border border-[#E8520D]/20'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors duration-150"
          >
            <LogOut size={18} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Topbar — stable sticky with no backdrop-filter on mobile for perf */}
        <header className="border-b border-white/[0.06] bg-[#0d0c0b] sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between pt-safe"
          style={{ minHeight: '56px' }}>
          <div className="flex items-center gap-3 py-3 md:py-4">
            <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-[#E8520D] to-[#C44108] flex items-center justify-center font-black text-white text-sm shadow-[0_0_15px_rgba(232,82,13,0.25)] flex-shrink-0">
              F
            </div>
            <h1 className="font-bold text-lg md:text-xl truncate max-w-[60vw] md:max-w-none">{title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <NotificationsDropdown />
            <button
              onClick={handleLogout}
              className="md:hidden text-white/40 hover:text-red-400 p-2 rounded-lg bg-white/5 transition-colors"
              aria-label="تسجيل الخروج"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content area — accounts for mobile bottom nav */}
        <div
          className="flex-1 p-4 md:p-8 overflow-x-hidden"
          style={{ paddingBottom: `calc(1rem + ${MOBILE_NAV_HEIGHT})` }}
        >
          <div className="md:!pb-0 contents md:block">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation — fixed with safe-area */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d0c0b] border-t border-white/[0.06] z-40 flex items-center justify-around px-1"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          height: MOBILE_NAV_HEIGHT,
        }}
      >
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 3}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-bold transition-colors duration-150 flex-1 max-w-[80px] active:scale-90 ${
                isActive
                  ? 'text-[#E8520D]'
                  : 'text-white/40'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} className={isActive ? 'drop-shadow-[0_0_8px_rgba(232, 82, 13, 0.5)]' : ''} />
                <span className="truncate w-full text-center leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
