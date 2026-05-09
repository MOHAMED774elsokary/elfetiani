// ─── Notification Bell Dropdown (PortalLayout header) ────────────────────────
// Shows notification bell with unread badge, dropdown with notification list,
// and mark-all-read functionality.

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from './NotificationContext';
import { Bell, Check, CheckCheck, MessageCircle, Dumbbell, UtensilsCrossed, ClipboardList, CreditCard, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NotificationType } from './notifications';

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'chat_message': return <MessageCircle size={16} className="text-blue-400" />;
    case 'workout_assigned': return <Dumbbell size={16} className="text-[#FF5500]" />;
    case 'nutrition_updated': return <UtensilsCrossed size={16} className="text-green-400" />;
    case 'checkin_reviewed':
    case 'checkin_submitted': return <ClipboardList size={16} className="text-purple-400" />;
    case 'subscription_update': return <CreditCard size={16} className="text-yellow-400" />;
    default: return <Info size={16} className="text-white/50" />;
  }
}

function timeAgo(timestamp: { seconds: number } | null): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp.seconds * 1000;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} ي`;
}

export default function NotificationsDropdown() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  return (
    <div className="relative" ref={ref}>
      {/* Bell Button */}
      <button
        id="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
        aria-label="الإشعارات"
      >
        <Bell size={20} className={unreadCount > 0 ? 'text-[#FF5500]' : 'text-white/50'} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF5500] text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(255,85,0,0.4)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed md:absolute left-2 right-2 md:left-auto md:right-0 top-[60px] md:top-full md:mt-2 md:w-80 max-h-[70vh] bg-[#111] border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden z-[60] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <h3 className="font-bold text-sm">الإشعارات</h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="flex items-center gap-1 text-xs text-[#FF5500] hover:text-[#FF6620] font-medium transition"
                >
                  <CheckCheck size={14} />
                  قراءة الكل
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1" style={{ maxHeight: '50vh' }}>
              {notifications.length === 0 ? (
                <div className="py-12 text-center">
                  <Bell size={32} className="mx-auto text-white/10 mb-3" />
                  <p className="text-white/30 text-sm">لا توجد إشعارات</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => {
                        if (!notif.read) markRead(notif.id);
                      }}
                      className={`w-full text-right px-4 py-3.5 flex items-start gap-3 transition-all hover:bg-white/5 ${
                        notif.read ? 'opacity-60' : ''
                      }`}
                    >
                      {/* Icon */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        notif.read ? 'bg-white/5' : 'bg-[#FF5500]/10'
                      }`}>
                        {getNotificationIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm truncate">{notif.title}</span>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-[#FF5500] flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-white/50 text-xs mt-0.5 line-clamp-2">{notif.body}</p>
                        <span className="text-white/25 text-[10px] mt-1 block">
                          {timeAgo(notif.createdAt as { seconds: number } | null)}
                        </span>
                      </div>

                      {/* Read indicator */}
                      {notif.read && (
                        <Check size={14} className="text-white/20 flex-shrink-0 mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
