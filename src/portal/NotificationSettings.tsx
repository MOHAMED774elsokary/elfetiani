// ─── Notification Settings Panel ────────────────────────────────────────────
// Embeddable settings panel for notification preferences and push permission.

import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  type NotificationPreferences,
  DEFAULT_PREFERENCES,
} from './notifications';
import {
  Bell, BellOff, Smartphone, CheckCircle2, Loader2,
  MessageCircle, Dumbbell, UtensilsCrossed, ClipboardList, CreditCard,
} from 'lucide-react';

function Toggle({
  label,
  description,
  icon: Icon,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  icon: React.ElementType;
  checked: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer group">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/8 transition">
          <Icon size={16} className="text-[#E8520D]" />
        </div>
        <div>
          <div className="text-sm font-bold">{label}</div>
          <div className="text-xs text-white/40">{description}</div>
        </div>
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-all flex items-center px-0.5 cursor-pointer ${
          checked ? 'bg-[#E8520D]' : 'bg-white/10'
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </label>
  );
}

export default function NotificationSettings() {
  const { currentUser } = useAuth();
  const { permissionStatus, requestPermission, fcmToken } = useNotifications();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    getNotificationPreferences(currentUser.uid)
      .then(setPrefs)
      .finally(() => setLoading(false));
  }, [currentUser]);

  async function updatePref(key: keyof NotificationPreferences, val: boolean) {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    if (!currentUser) return;
    setSaving(true);
    await saveNotificationPreferences(currentUser.uid, updated);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 size={20} className="animate-spin text-[#E8520D]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Push Notification Permission */}
      <div className="bg-[#0f0e0d] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#E8520D]/10 flex items-center justify-center">
            <Smartphone size={20} className="text-[#E8520D]" />
          </div>
          <div>
            <h3 className="font-bold text-sm">إشعارات الدفع</h3>
            <p className="text-xs text-white/40">استلم إشعارات فورية على جهازك</p>
          </div>
        </div>

        {permissionStatus === 'granted' ? (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm">
            <CheckCircle2 size={16} />
            <span>الإشعارات مفعّلة</span>
            {fcmToken && (
              <span className="text-green-400/50 text-xs mr-auto">
                الجهاز مسجّل ✓
              </span>
            )}
          </div>
        ) : permissionStatus === 'denied' ? (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
            <BellOff size={16} />
            <div>
              <span className="block">الإشعارات محظورة</span>
              <span className="text-xs text-red-400/60">
                يرجى تفعيلها من إعدادات المتصفح
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={requestPermission}
            className="w-full flex items-center justify-center gap-2 bg-[#E8520D] hover:bg-[#C9440A] text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_10px_20px_rgba(232, 82, 13, 0.2)] active:scale-[0.98]"
          >
            <Bell size={18} />
            تفعيل الإشعارات
          </button>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-[#0f0e0d] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-sm">تفضيلات الإشعارات</h3>
          {saving && <Loader2 size={14} className="animate-spin text-[#E8520D]" />}
          {saved && <span className="text-xs text-green-400">✓ تم الحفظ</span>}
        </div>
        <p className="text-xs text-white/30 mb-4">اختر أنواع الإشعارات التي تريد استلامها</p>

        <div className="space-y-4">
          <Toggle
            icon={MessageCircle}
            label="الرسائل"
            description="إشعار عند استلام رسالة جديدة"
            checked={prefs.chatMessages}
            onChange={(val) => updatePref('chatMessages', val)}
          />
          <Toggle
            icon={Dumbbell}
            label="تحديثات التمارين"
            description="إشعار عند تحديث برنامج التمارين"
            checked={prefs.workoutUpdates}
            onChange={(val) => updatePref('workoutUpdates', val)}
          />
          <Toggle
            icon={UtensilsCrossed}
            label="تحديثات التغذية"
            description="إشعار عند تحديث خطة التغذية"
            checked={prefs.nutritionUpdates}
            onChange={(val) => updatePref('nutritionUpdates', val)}
          />
          <Toggle
            icon={ClipboardList}
            label="التقارير الأسبوعية"
            description="إشعارات عن التسجيلات والمراجعات"
            checked={prefs.checkinUpdates}
            onChange={(val) => updatePref('checkinUpdates', val)}
          />
          <Toggle
            icon={CreditCard}
            label="الاشتراك"
            description="تحديثات وتذكيرات الاشتراك"
            checked={prefs.subscriptionUpdates}
            onChange={(val) => updatePref('subscriptionUpdates', val)}
          />
        </div>
      </div>
    </div>
  );
}
