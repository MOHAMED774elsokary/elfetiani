import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import PortalLayout from '../../portal/PortalLayout';
import {
  getClients,
  getClient,
  saveClient,
  deleteClientData,
  addBodyStat,
  getWorkoutPlan,
  saveWorkoutPlan,
  getNutritionPlan,
  saveNutritionPlan,
  setUserMapping,
  getUidByClientId,
  getCheckIns,
  addCoachReplyToCheckIn,
  lockClient,
  unlockClient,
  checkAndLockExpiredSubscriptions,
} from '../../portal/firestore';
import { notifyWorkoutAssigned, notifyNutritionUpdated } from '../../portal/notifications';
import {
  createUserWithEmailAndPassword,
  signOut,
  setPersistence,
  inMemoryPersistence
} from 'firebase/auth';
import { secondaryAuth } from '../../portal/firebase';
import { getAuth } from 'firebase/auth';
import NotificationSettings from '../../portal/NotificationSettings';
import type {
  Client,
  WorkoutPlan,
  Exercise,
  NutritionPlan,
  Meal,
  BodyStat,
  CheckIn,
} from '../../portal/types';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Save,
  ChevronLeft,
  Dumbbell,
  UtensilsCrossed,
  Scale,
  Eye,
  EyeOff,
  GripVertical,
  X,
  UserPlus,
  Loader2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  CheckCircle2,
  Link,
  Image,
  Star,
  Send,
  Bell,
  Lock,
  LockOpen,
  KeyRound,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

// ─── Helpers ───────────────────────────────────────────────────────────────
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ─── Workout Library ────────────────────────────────────────────────────────
const WORKOUT_LIBRARY: { session: string; exercises: string[] }[] = [
  {
    session: 'الإحماء والإطالة (Warm Up & Mobility)',
    exercises: [
      'Static stretch (Pectoralis & Lat)',
      'Static stretches for the muscles of the day',
      'Stretch (Lat & Pectoralis)',
      'Dynamic (Shoulder & Arm & Chest)',
      'Dynamic (Leg)',
      'Dynamic (Swing - Lunge - Ankle)',
      'Dynamic (Shoulder)',
      'Dynamic (Shoulder - Scapula - Arm)',
      'Floor Cobra',
      'Upper Rotation',
      'Down Rotation',
    ],
  },
  {
    session: 'الصدر (Chest)',
    exercises: [
      'Bench Press Flat',
      'Chest Press Flat',
      'Incline Chest Press',
      'Fly',
      'Scapula Push Up',
    ],
  },
  {
    session: 'الظهر (Back)',
    exercises: [
      'Lat Pull Down',
      'Super Lat',
      'Seated Row',
      'Row Wide Grip',
      'T Bar Row',
      'T Bar 1set Back Off',
      'Shrug',
      'Back Extension',
    ],
  },
  {
    session: 'الأكتاف (Shoulders)',
    exercises: [
      'Shoulder Press',
      'Lateral Raises',
      'Reverse Fly',
    ],
  },
  {
    session: 'الأرجل (Legs)',
    exercises: [
      'Leg Extension',
      'Leg Curl',
      'RDL',
      'Adductor',
      'Calf Raises',
      'Hip Thrust',
      'Pendulum',
      'Single Leg',
      'Single Leg Hip Rotation',
    ],
  },
  {
    session: 'الذراعين (Arms)',
    exercises: [
      'Bi Preacher Curl',
      'Bi Incline Curl',
      'Bi Cable Curl',
      'Tri Over Head',
      'Tri Push Down',
      'Wrist Flexion & Reverse Cable',
    ],
  },
  {
    session: 'المعدة والبطن (Core & Abs)',
    exercises: [
      'Crunch',
      'Floor Crunch',
      'Plank',
      'Dead Bug',
      'Bird Dog',
      'Cable Rotation',
    ],
  },
];

// Flat list for search
const ALL_EXERCISES = Array.from(
  new Set(WORKOUT_LIBRARY.flatMap((s) => s.exercises))
).sort();

// ─── Exercise Picker ─────────────────────────────────────────────────────────
function ExercisePicker({ onPick, onClose }: { onPick: (name: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [activeSession, setActiveSession] = useState<string>('all');

  const filteredSessions = WORKOUT_LIBRARY.map((s) => ({
    ...s,
    exercises: s.exercises.filter((e) =>
      e.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((s) => s.exercises.length > 0);

  const filteredAll = ALL_EXERCISES.filter((e) =>
    e.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-[#111] border border-white/10 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h4 className="font-bold text-sm">اختر تمريناً من القائمة</h4>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition">
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن تمرين... (بالإنجليزية)"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#E8520D]/60 transition"
          />
        </div>

        {/* Session filter tabs */}
        <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveSession('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              activeSession === 'all' ? 'bg-[#E8520D] text-white' : 'bg-white/5 text-white/50 hover:text-white'
            }`}
          >
            الكل
          </button>
          {WORKOUT_LIBRARY.map((s) => (
            <button
              key={s.session}
              onClick={() => setActiveSession(s.session)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                activeSession === s.session ? 'bg-[#E8520D] text-white' : 'bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              {s.session}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-3">
          {activeSession === 'all' ? (
            query ? (
              filteredAll.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-6">لا توجد نتائج</p>
              ) : (
                <div className="space-y-1 mt-1">
                  {filteredAll.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => { onPick(ex); onClose(); }}
                      className="w-full text-right px-4 py-2.5 rounded-xl text-sm hover:bg-[#E8520D]/10 hover:text-[#E8520D] text-white/70 transition"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              )
            ) : (
              filteredSessions.map((s) => (
                <div key={s.session}>
                  <p className="text-xs text-[#E8520D]/70 font-bold mb-1.5 mt-2">{s.session}</p>
                  <div className="space-y-1">
                    {s.exercises.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => { onPick(ex); onClose(); }}
                        className="w-full text-right px-4 py-2.5 rounded-xl text-sm hover:bg-[#E8520D]/10 hover:text-[#E8520D] text-white/70 transition"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )
          ) : (
            (() => {
              const session = WORKOUT_LIBRARY.find((s) => s.session === activeSession)!;
              const list = session.exercises.filter((e) =>
                e.toLowerCase().includes(query.toLowerCase())
              );
              return list.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-6">لا توجد نتائج</p>
              ) : (
                <div className="space-y-1 mt-2">
                  {list.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => { onPick(ex); onClose(); }}
                      className="w-full text-right px-4 py-2.5 rounded-xl text-sm hover:bg-[#E8520D]/10 hover:text-[#E8520D] text-white/70 transition"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              );
            })()
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div>
      <label className="text-xs text-white/50 block mb-1.5">{label}</label>
      <input
        {...props}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#E8520D]/60 transition"
      />
    </div>
  );
}

function Textarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <div>
      <label className="text-xs text-white/50 block mb-1.5">{label}</label>
      <textarea
        {...props}
        rows={3}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#E8520D]/60 transition resize-none"
      />
    </div>
  );
}

function SaveBtn({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-2 bg-[#E8520D] hover:bg-[#C9440A] disabled:opacity-60 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition">
      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
      {saving ? 'جاري الحفظ...' : 'حفظ'}
    </button>
  );
}

// ─── Client List ───────────────────────────────────────────────────────────
function ClientList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClients().then(async (all) => {
      setClients(all);
      // Auto-lock any clients whose subscription has expired
      try { await checkAndLockExpiredSubscriptions(); } catch {}
      // Refresh list after potential locks
      getClients().then(setClients).finally(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm('هل أنت متأكد؟ سيتم حذف جميع البيانات.')) return;
    try {
      await deleteClientData(id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      alert('تم حذف العميل بنجاح');
    } catch (e: any) {
      console.error('Error deleting client:', e);
      alert('خطأ في حذف العميل: ' + e.message);
    }
  }

  const filtered = clients.filter((c) =>
    c.name.includes(search) || c.email?.includes(search)
  );

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#E8520D]" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <input type="text" placeholder="ابحث عن عميل..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#E8520D]/50 transition w-64" />
        <button onClick={() => navigate('/portal/admin/add')}
          className="flex items-center gap-2 bg-[#E8520D] hover:bg-[#C9440A] text-white font-bold px-5 py-2.5 rounded-xl text-sm transition">
          <UserPlus size={16} />إضافة عميل
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-white/30 py-16 font-medium">{search ? 'لا توجد نتائج' : 'لوحة التحكم جاهزة! ابدأ بإضافة أول بطل للفريق'}</div>
      )}

      <div className="grid gap-3">
        {filtered.map((c) => {
          const latest = c.bodyStats?.at(-1);
          const todayStr = new Date().toISOString().slice(0, 10);
          const isExpired = c.endDate ? c.endDate < todayStr : false;
          const dLeft = c.endDate
            ? Math.ceil((new Date(c.endDate).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24))
            : null;
          const isWarn = dLeft !== null && dLeft > 0 && dLeft <= 5;
          return (
            <div key={c.id} className={`bg-[#0f0e0d] border rounded-2xl p-4 sm:p-5 transition-all ${
              c.isLocked || isExpired ? 'border-red-500/20 hover:border-red-500/30' 
              : isWarn ? 'border-yellow-500/20 hover:border-yellow-500/30'
              : 'border-white/5 hover:border-white/10'
            }`}>
              {/* Top row: avatar + info */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${
                  c.isLocked || isExpired ? 'bg-red-500/60' : isWarn ? 'bg-yellow-500/70' : 'bg-[#E8520D]'
                }`}>
                  {c.isLocked || isExpired ? <Lock size={18} /> : c.avatarInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm truncate">{c.name}</span>
                    {(c.isLocked || isExpired) && (
                      <span className="text-[9px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">موقوف</span>
                    )}
                    {isWarn && !c.isLocked && (
                      <span className="text-[9px] font-bold bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">{dLeft} أيام</span>
                    )}
                    {!c.isLocked && !isExpired && !isWarn && (
                      <span className="text-[9px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded-full">نشط</span>
                    )}
                  </div>
                  <div className="text-white/40 text-xs truncate">{c.email}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {c.subscriptionPlan && <span className="text-[#E8520D] text-[10px]">{c.subscriptionPlan}</span>}
                    {c.endDate && <span className={`text-[10px] ${isExpired ? 'text-red-400' : isWarn ? 'text-yellow-400' : 'text-white/30'}`}>← {c.endDate}</span>}
                  </div>
                </div>
                {latest && (
                  <div className="text-center flex-shrink-0 hidden sm:block">
                    <div className="font-bold text-[#E8520D] text-sm">{latest.weight} kg</div>
                    <div className="text-white/30 text-[10px]">الوزن</div>
                  </div>
                )}
              </div>
              {/* Bottom row: actions */}
              <div className="flex items-center gap-2">
                <button onClick={() => navigate(`/portal/admin/client/${c.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-3 py-2.5 rounded-xl text-xs font-medium transition active:scale-[0.97]">
                  <Eye size={14} />إدارة
                </button>
                {(c.isLocked || isExpired) && (
                  <button onClick={() => navigate(`/portal/admin/client/${c.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#E8520D]/15 to-[#FF7700]/10 text-[#E8520D] hover:from-[#E8520D]/25 hover:to-[#FF7700]/15 border border-[#E8520D]/20 px-3 py-2.5 rounded-xl text-xs font-bold transition active:scale-[0.97]">
                    <LockOpen size={14} />تجديد
                  </button>
                )}
                <button onClick={() => handleDelete(c.id)}
                  className="p-2.5 rounded-xl text-white/30 hover:text-red-400 hover:bg-red-500/10 transition">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── Add Client ─────────────────────────────────────────────────────────────
function AddClient() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', goal: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [packageType, setPackageType] = useState('اقتصادية');
  const [duration, setDuration] = useState('3');
  const [createdClient, setCreatedClient] = useState<{name: string, email: string, pass: string, phone: string, sub: string, end: string} | null>(null);

  const set = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Isolate secondary auth persistence so it doesn't log out the primary coach account
      await setPersistence(secondaryAuth, inMemoryPersistence);
      const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
      // Immediately sign out from the secondary instance so we don't leave it authenticated
      await signOut(secondaryAuth);
      
      const clientId = `client-${uid()}`;

      const startObj = new Date();
      const endObj = new Date(startObj);
      endObj.setMonth(endObj.getMonth() + parseInt(duration));
      
      const subText = `${packageType} - ${duration} ${duration === '1' ? 'شهر' : 'شهور'}`;
      const endDate = endObj.toISOString().slice(0, 10);

      // 2. Save client profile to Firestore
      const client: Client = {
        id: clientId,
        name: form.name,
        email: form.email,
        phone: form.phone,
        goal: form.goal,
        startDate: startObj.toISOString().slice(0, 10),
        endDate,
        subscriptionPlan: subText,
        avatarInitials: form.name.slice(0, 2),
        bodyStats: [],
      };
      await saveClient(client);

      // 3. Save uid → clientId mapping
      await setUserMapping(cred.user.uid, clientId);

      setCreatedClient({ name: form.name, email: form.email, pass: form.password, phone: form.phone, sub: subText, end: endDate });
    } catch (err: unknown) {
      console.error("CREATE CLIENT ERROR:", err);
      const code = (err as { code?: string }).code;
      const messages: Record<string, string> = {
        'auth/email-already-in-use': 'هذا البريد مستخدم بالفعل',
        'auth/weak-password': 'كلمة المرور ضعيفة (6 أحرف على الأقل)',
        'auth/invalid-email': 'البريد الإلكتروني غير صحيح',
      };
      setError(messages[code || ''] || 'حدث خطأ في إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  }

  if (createdClient) {
    const portalUrl = window.location.origin + '/#/portal/login';
    const message = `أهلاً بك يا ${createdClient.name} في منصة التدريب الخاصة بي
    
باقة الاشتراك: ${createdClient.sub}
تاريخ الانتهاء: ${createdClient.end}

تفضل بيانات الدخول الخاصة بك:

رابط المنصة: ${portalUrl}

البريد الإلكتروني: ${createdClient.email}
كلمة المرور: ${createdClient.pass}`;
    const waLink = createdClient.phone
      ? `https://wa.me/${createdClient.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg mx-auto mt-10">
        <div className="bg-[#0f0e0d] border border-green-500/20 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="font-bold text-xl mb-2 text-white">تم إنشاء الحساب بنجاح</h2>
          <p className="text-white/50 text-sm mb-6">يمكنك الآن إرسال بيانات الدخول للعميل مباشرة عبر الواتساب</p>

          <a href={waLink} target="_blank" rel="noreferrer" className="w-full bg-[#25D366] hover:bg-[#20BE5C] text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 mb-3">
            <MessageCircle size={18} />
            إرسال عبر الواتساب
          </a>
          <button onClick={() => { setCreatedClient(null); navigate('/portal/admin'); }} className="w-full bg-white/5 hover:bg-white/10 text-white py-3.5 rounded-xl transition font-medium text-sm">
            العودة للقائمة
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-lg">
      <button onClick={() => navigate('/portal/admin')} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-6 transition">
        <ChevronLeft size={16} />رجوع للقائمة
      </button>

      <div className="bg-[#0f0e0d] border border-white/5 rounded-2xl p-6">
        <h2 className="font-bold text-lg mb-6">إضافة عميل جديد</h2>

        {/* Instruction banner */}
        <div className="bg-[#E8520D]/8 border border-[#E8520D]/15 rounded-xl p-3 mb-5 text-xs text-[#E8520D]/80">
          أدخل بريد العميل وكلمة مرور تختارها أنت، ثم أرسلها له عبر واتساب. سيستخدمها لتسجيل الدخول من هاتفه.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="الاسم الكامل *" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="مثال: أحمد محمد" />
          <Input label="رقم الهاتف" type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+966..." />
          <Input label="الهدف" value={form.goal} onChange={(e) => set('goal', e.target.value)} placeholder="مثال: خسارة الوزن" />

          <div className="border-t border-white/5 pt-4">
            <p className="text-xs text-white/40 mb-4">بيانات الاشتراك</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/50 block mb-1.5">نوع الباقة *</label>
                <select value={packageType} onChange={(e) => setPackageType(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#E8520D]/60 transition">
                  <option value="اقتصادية" className="bg-[#0f0e0d]">اقتصادية</option>
                  <option value="VIP" className="bg-[#0f0e0d]">VIP</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1.5">المدة *</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#E8520D]/60 transition">
                  <option value="1" className="bg-[#0f0e0d]">شهر واحد</option>
                  <option value="3" className="bg-[#0f0e0d]">3 شهور</option>
                  <option value="6" className="bg-[#0f0e0d]">6 شهور</option>
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <p className="text-xs text-white/40 mb-4">بيانات تسجيل الدخول (أرسلها للعميل)</p>
            <div className="space-y-4">
              <Input label="البريد الإلكتروني للعميل *" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required placeholder="client@email.com" autoComplete="off" />
              <div>
                <label className="text-xs text-white/50 block mb-1.5">كلمة المرور *</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    required
                    minLength={6}
                    placeholder="6 أحرف على الأقل..."
                    autoComplete="new-password"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-12 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#E8520D]/60 transition"
                  />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full bg-[#E8520D] hover:bg-[#C9440A] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
            {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

// ─── Client Detail ──────────────────────────────────────────────────────────
type DetailTab = 'stats' | 'workout' | 'nutrition' | 'checkins' | 'account';

function ClientDetail() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState<DetailTab>('stats');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testingPush, setTestingPush] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    getClient(clientId).then((c) => { setClient(c || null); setLoading(false); });
  }, [clientId]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#E8520D]" /></div>;
  if (!client) return <div className="text-white/30 text-center py-16">عميل غير موجود</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={() => navigate('/portal/admin')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition flex-shrink-0">
            <ChevronLeft size={18} />
          </button>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black flex-shrink-0 ${
            client.isLocked ? 'bg-red-500/60' : 'bg-[#E8520D]'
          }`}>
            {client.isLocked ? <Lock size={16} /> : client.avatarInitials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold truncate">{client.name}</h2>
              {client.isLocked && (
                <span className="text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full flex-shrink-0">موقوف</span>
              )}
            </div>
            <p className="text-white/40 text-sm truncate">{client.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {client.phone && (
            <a href={`https://wa.me/${client.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً ${client.name}!\n\nتم تحديث بياناتك أو خطتك على المنصة الخاصة بك. تفضل بزيارة حسابك لمشاهدة التحديثات الجديدة.\n\nمنصة El Fetiani Coaching\n${window.location.origin}/#/portal/login`)}`} target="_blank" rel="noreferrer" 
               className="flex items-center gap-1.5 bg-[#25D366]/20 text-[#25D366] hover:bg-[#25D366]/30 px-3 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap active:scale-95">
              <MessageCircle size={14} />واتساب
            </a>
          )}

          <button 
            onClick={async () => {
              try {
                setTestingPush(true);
                const uid = await getUidByClientId(client.id);
                if (!uid) { alert('لم يتم العثور على حساب للعميل'); return; }
                const auth = getAuth();
                const token = await auth.currentUser?.getIdToken();
                const res = await fetch('/api/send-push', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ userId: uid, type: 'general', title: 'تجربة إشعار', body: 'هذا إشعار تجريبي من لوحة التحكم' })
                });
                const data = await res.json();
                alert(JSON.stringify(data, null, 2));
              } catch (err: any) {
                alert('Error: ' + err.message);
              } finally {
                setTestingPush(false);
              }
            }}
            disabled={testingPush}
            className="flex items-center gap-1.5 border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl text-xs font-bold transition disabled:opacity-50 active:scale-95"
          >
            {testingPush ? <Loader2 size={14} className="animate-spin" /> : <Bell size={14} />}
            إشعار
          </button>
        </div>
      </div>

      <div className="flex gap-1 bg-white/3 p-1 rounded-xl overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-1 md:w-fit">
        {([
          ['stats', Scale, 'الإحصائيات'],
          ['workout', Dumbbell, 'التمارين'],
          ['nutrition', UtensilsCrossed, 'التغذية'],
          ['checkins', CheckCircle2, 'التقارير'],
          ['account', ShieldAlert, 'الحساب'],
        ] as [DetailTab, React.ElementType, string][]).map(([tab, Icon, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex-shrink-0 ${activeTab === tab ? 'bg-[#E8520D] text-white' : 'text-white/50 hover:text-white'}`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'stats' && <StatsEditor key="stats" client={client} saving={saving} setSaving={setSaving} onSaved={setClient} />}
        {activeTab === 'workout' && <WorkoutEditor key="workout" clientId={client.id} clientName={client.name} saving={saving} setSaving={setSaving} />}
        {activeTab === 'nutrition' && <NutritionEditor key="nutrition" clientId={client.id} clientName={client.name} saving={saving} setSaving={setSaving} />}
        {activeTab === 'checkins' && <CheckInsViewer key="checkins" clientId={client.id} />}
        {activeTab === 'account' && <ClientAccountManager key="account" client={client} onClientUpdated={setClient} />}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Client Account Manager ─────────────────────────────────────────────────
function ClientAccountManager({ client, onClientUpdated }: { client: Client; onClientUpdated: (c: Client) => void }) {
  const [targetUid, setTargetUid] = useState<string | null>(null);
  const [loadingUid, setLoadingUid] = useState(true);
  const [locking, setLocking] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [updatingAuth, setUpdatingAuth] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  // Renewal form state
  const [showRenewal, setShowRenewal] = useState(false);
  const [renewPackage, setRenewPackage] = useState('اقتصادية');
  const [renewDuration, setRenewDuration] = useState('3');
  const [renewing, setRenewing] = useState(false);

  useEffect(() => {
    getUidByClientId(client.id).then((uid) => { setTargetUid(uid); setLoadingUid(false); });
  }, [client.id]);

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  // Calculate subscription status
  const today = new Date().toISOString().slice(0, 10);
  const isExpired = client.endDate ? client.endDate < today : false;
  const daysLeft = client.endDate
    ? Math.ceil((new Date(client.endDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24))
    : null;
  const isWarning = daysLeft !== null && daysLeft > 0 && daysLeft <= 5;

  async function callAuthApi(body: object): Promise<{ success: boolean; message?: string }> {
    const { getAuth } = await import('firebase/auth');
    const token = await getAuth().currentUser?.getIdToken();
    const res = await fetch('/api/manage-client-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!text) throw new Error('API غير متاح محلياً — يعمل فقط على Vercel');
    let data: any;
    try { data = JSON.parse(text); } catch { throw new Error('استجابة غير صالحة من الخادم'); }
    if (!res.ok) throw new Error(data.error || 'Server error');
    return data;
  }

  async function handleToggleLock() {
    setLocking(true);
    try {
      if (client.isLocked) {
        // If subscription is expired, must renew first — don't just unlock
        if (isExpired) {
          setShowRenewal(true);
          setLocking(false);
          return;
        }
        await unlockClient(client.id);
        onClientUpdated({ ...client, isLocked: false, lockedAt: undefined });
        showMsg('ok', 'تم إعادة تفعيل الحساب ✓');
      } else {
        await lockClient(client.id);
        onClientUpdated({ ...client, isLocked: true, lockedAt: new Date().toISOString() });
        showMsg('ok', 'تم تعليق الحساب ✓ — العميل سيرى شاشة الإيقاف فوراً');
        if (targetUid) {
          callAuthApi({ targetUid, action: 'revokeTokens' }).catch(() => {});
        }
      }
    } catch (e: any) {
      showMsg('err', e.message);
    } finally {
      setLocking(false);
    }
  }

  async function handleRenewSubscription() {
    setRenewing(true);
    try {
      const startObj = new Date();
      const endObj = new Date(startObj);
      endObj.setMonth(endObj.getMonth() + parseInt(renewDuration));
      const newEndDate = endObj.toISOString().slice(0, 10);
      const subText = `${renewPackage} - ${renewDuration} ${renewDuration === '1' ? 'شهر' : 'شهور'}`;

      // Update client: unlock + set new dates + new plan
      const updated: Client = {
        ...client,
        isLocked: false,
        startDate: startObj.toISOString().slice(0, 10),
        endDate: newEndDate,
        subscriptionPlan: subText,
      };
      delete updated.lockedAt;
      await saveClient(updated);
      onClientUpdated(updated);
      setShowRenewal(false);
      showMsg('ok', `تم تجديد الاشتراك بنجاح ✓ — ينتهي في ${newEndDate}`);
    } catch (e: any) {
      showMsg('err', e.message);
    } finally {
      setRenewing(false);
    }
  }

  async function handleRevokeTokens() {
    if (!targetUid) return;
    if (!confirm('سيتم تسجيل خروج العميل من جميع الأجهزة فوراً. هل أنت متأكد؟')) return;
    setRevoking(true);
    try {
      await callAuthApi({ targetUid, action: 'revokeTokens' });
      showMsg('ok', 'تم تسجيل الخروج من جميع الأجهزة ✓');
    } catch (e: any) {
      showMsg('err', e.message.includes('Vercel') 
        ? 'تسجيل الخروج الإجباري يعمل فقط على الموقع المنشور (Vercel)، وليس محلياً.' 
        : e.message);
    } finally {
      setRevoking(false);
    }
  }

  async function handleUpdateAuth(e: React.FormEvent) {
    e.preventDefault();
    if (!targetUid) return;
    if (!newEmail && !newPassword) return;
    setUpdatingAuth(true);
    try {
      const action = newEmail && newPassword ? 'updateEmailAndPassword' : newEmail ? 'updateEmail' : 'updatePassword';
      await callAuthApi({ targetUid, action, newEmail: newEmail || undefined, newPassword: newPassword || undefined });
      if (newEmail) onClientUpdated({ ...client, email: newEmail });
      setNewEmail(''); setNewPassword('');
      showMsg('ok', 'تم تحديث بيانات الدخول وتسجيل الخروج من الأجهزة ✓');
    } catch (e: any) {
      showMsg('err', e.message);
    } finally {
      setUpdatingAuth(false);
    }
  }

  if (loadingUid) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#E8520D]" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">

      {/* Status message */}
      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium border ${
          msg.type === 'ok' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>{msg.text}</div>
      )}

      {/* Subscription Info Card */}
      <div className={`bg-[#0f0e0d] border rounded-2xl p-4 sm:p-5 space-y-3 ${
        isExpired ? 'border-red-500/20' : isWarning ? 'border-yellow-500/20' : 'border-white/5'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isExpired ? 'bg-red-500/15 text-red-400' : isWarning ? 'bg-yellow-500/15 text-yellow-400' : 'bg-green-500/15 text-green-400'
          }`}>
            {isExpired ? <Lock size={20} /> : isWarning ? <Bell size={20} /> : <LockOpen size={20} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-sm">حالة الاشتراك</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isExpired ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                : isWarning ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                : 'bg-green-500/10 text-green-400 border-green-500/20'
              }`}>
                {isExpired ? 'منتهي' : isWarning ? `متبقي ${daysLeft} أيام` : 'نشط'}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              {client.subscriptionPlan && <p className="text-xs text-[#E8520D]">الباقة: {client.subscriptionPlan}</p>}
              {client.endDate && <p className="text-xs text-white/40">ينتهي: <span className={`font-bold ${isExpired ? 'text-red-400' : isWarning ? 'text-yellow-400' : 'text-white/70'}`}>{client.endDate}</span></p>}
              {client.isLocked && client.lockedAt && <p className="text-xs text-red-400/60">موقوف منذ: {client.lockedAt.slice(0, 10)}</p>}
            </div>
          </div>
        </div>

        {/* Action buttons — stack on mobile */}
        <div className="flex flex-col sm:flex-row gap-2">
          {client.isLocked || isExpired ? (
            <>
              <button
                onClick={() => setShowRenewal(true)}
                disabled={renewing}
                className="flex-1 flex items-center justify-center gap-2 font-bold px-4 py-3 rounded-xl text-sm transition disabled:opacity-50 bg-gradient-to-r from-[#E8520D] to-[#FF7700] text-white hover:from-[#C9440A] hover:to-[#FF8830] shadow-[0_4px_15px_rgba(232, 82, 13, 0.25)] active:scale-[0.98]"
              >
                {renewing ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                تجديد الاشتراك
              </button>
              {!isExpired && (
                <button
                  onClick={handleToggleLock}
                  disabled={locking}
                  className="flex items-center justify-center gap-2 font-bold px-4 py-3 rounded-xl text-sm transition disabled:opacity-50 bg-green-500/15 text-green-400 hover:bg-green-500/25 border border-green-500/20"
                >
                  {locking ? <Loader2 size={15} className="animate-spin" /> : <LockOpen size={15} />}
                  إعادة تفعيل فقط
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleToggleLock}
              disabled={locking}
              className="flex items-center justify-center gap-2 font-bold px-4 py-3 rounded-xl text-sm transition disabled:opacity-50 bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/20"
            >
              {locking ? <Loader2 size={15} className="animate-spin" /> : <Lock size={15} />}
              تعليق الحساب
            </button>
          )}
        </div>

        {!client.isLocked && !isExpired && (
          <p className="text-xs text-white/30 bg-white/3 rounded-xl p-3">
            عند تعليق الحساب، لن يتمكن العميل من الدخول إلى المنصة حتى تقوم بإعادة تفعيله.
            يحدث هذا تلقائياً عند انتهاء تاريخ الاشتراك.
          </p>
        )}
      </div>

      {/* Renewal Form (expandable) */}
      <AnimatePresence>
        {showRenewal && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-[#0f0e0d] border border-[#E8520D]/20 rounded-2xl p-4 sm:p-5 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[#E8520D] flex items-center gap-2"><Plus size={15} />تجديد الاشتراك</h4>
              <button onClick={() => setShowRenewal(false)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition"><X size={14} /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/50 block mb-1.5">نوع الباقة</label>
                <select value={renewPackage} onChange={(e) => setRenewPackage(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-[#E8520D]/60 transition">
                  <option value="اقتصادية" className="bg-[#0f0e0d]">اقتصادية</option>
                  <option value="VIP" className="bg-[#0f0e0d]">VIP</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/50 block mb-1.5">المدة</label>
                <select value={renewDuration} onChange={(e) => setRenewDuration(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-[#E8520D]/60 transition">
                  <option value="1" className="bg-[#0f0e0d]">شهر واحد</option>
                  <option value="3" className="bg-[#0f0e0d]">3 شهور</option>
                  <option value="6" className="bg-[#0f0e0d]">6 شهور</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleRenewSubscription}
              disabled={renewing}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#E8520D] to-[#FF7700] hover:from-[#C9440A] hover:to-[#FF8830] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl text-sm transition shadow-[0_4px_15px_rgba(232, 82, 13, 0.25)] active:scale-[0.98]"
            >
              {renewing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              {renewing ? 'جاري التجديد...' : 'تأكيد التجديد وإعادة التفعيل'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Force logout */}
      <div className="bg-[#0f0e0d] border border-white/5 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-400 flex items-center justify-center">
            <LogOut size={18} />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">تسجيل الخروج الإجباري</p>
            <p className="text-xs text-white/40">إنهاء جميع جلسات العميل على كل الأجهزة فوراً</p>
          </div>
          <button
            onClick={handleRevokeTokens}
            disabled={revoking || !targetUid}
            className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 font-bold px-4 py-2 rounded-xl text-sm transition disabled:opacity-50"
          >
            {revoking ? <Loader2 size={15} className="animate-spin" /> : <LogOut size={15} />}
            تسجيل خروج
          </button>
        </div>
      </div>

      {/* Change email / password */}
      <div className="bg-[#0f0e0d] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#E8520D]/15 text-[#E8520D] flex items-center justify-center">
            <KeyRound size={18} />
          </div>
          <div>
            <p className="font-bold text-sm">تغيير بريد / كلمة مرور العميل</p>
            <p className="text-xs text-white/40">بعد التغيير سيتم تسجيل خروجه من جميع الأجهزة تلقائياً</p>
          </div>
        </div>

        {!targetUid ? (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            لم يتم ربط هذا العميل بحساب Firebase Auth بعد.
          </p>
        ) : (
          <form onSubmit={handleUpdateAuth} className="space-y-4">
            <div>
              <label className="text-xs text-white/50 block mb-1.5">البريد الإلكتروني الجديد (اختياري)</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={client.email}
                autoComplete="off"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#E8520D]/60 transition"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 block mb-1.5">كلمة المرور الجديدة (اختياري)</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="6 أحرف على الأقل..."
                  autoComplete="new-password"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pl-12 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#E8520D]/60 transition"
                />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={updatingAuth || (!newEmail && !newPassword)}
              className="w-full flex items-center justify-center gap-2 bg-[#E8520D] hover:bg-[#C9440A] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition"
            >
              {updatingAuth ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {updatingAuth ? 'جاري التحديث...' : 'حفظ وتسجيل الخروج الإجباري'}
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
}

// ─── Check-ins Viewer ───────────────────────────────────────────────────────
function CheckInsViewer({ clientId }: { clientId: string }) {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [sendingReply, setSendingReply] = useState<string | null>(null);

  useEffect(() => {
    getCheckIns(clientId).then(data => {
      setCheckIns(data.sort((a, b) => b.date.localeCompare(a.date)));
      setLoading(false);
    });
  }, [clientId]);

  const handleReply = async (checkInId: string) => {
    const txt = replyText[checkInId]?.trim();
    if (!txt) return;
    setSendingReply(checkInId);
    try {
      await addCoachReplyToCheckIn(checkInId, txt);
      // Update local state immediately so the UI reflects the confirmed reply
      setCheckIns(prev => prev.map(c =>
        c.id === checkInId ? { ...c, coachReply: txt, coachReviewed: true } : c
      ));
      // Clear the reply textarea for this check-in
      setReplyText(prev => { const next = { ...prev }; delete next[checkInId]; return next; });
    } finally {
      setSendingReply(null);
    }
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#E8520D]" /></div>;
  if (checkIns.length === 0) return <div className="text-center py-16 text-white/40">لم يرسل العميل أي تقارير بعد.</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      {checkIns.map(ci => (
        <div key={ci.id} className="bg-[#0f0e0d] border border-white/5 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="bg-[#E8520D]/10 text-[#E8520D] font-bold text-xs px-2.5 py-1 rounded-lg">{ci.date}</span>
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              طاقة: {[1,2,3,4,5].map(n => <Star key={n} size={10} className={ci.energyLevel >= n ? 'fill-yellow-400 text-yellow-400' : 'text-white/10'} />)}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white/5 rounded-xl p-3">
              <span className="text-white/40 text-xs block mb-1">الوزن</span>
              <span className="font-bold">{ci.weight} kg</span>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <span className="text-white/40 text-xs block mb-1">ساعات النوم</span>
              <span className="font-bold">{ci.sleepHours} ساعات</span>
            </div>
          </div>
          
          {ci.notes && (
            <div className="bg-white/2 border border-white/5 rounded-xl p-4 text-sm text-white/80 leading-relaxed">
              <span className="text-white/30 text-xs font-bold uppercase block mb-1">ملاحظات العميل</span>
              {ci.notes}
            </div>
          )}

          <div className="border-t border-white/5 pt-4 mt-2">
            {ci.coachReviewed ? (
              <div className="bg-[#E8520D]/10 border border-[#E8520D]/20 rounded-xl p-4">
                <span className="text-[#E8520D] text-xs font-bold uppercase block mb-1">ردك السابق</span>
                <p className="text-white/90 text-sm leading-relaxed">{ci.coachReply}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea 
                  value={replyText[ci.id] || ''}
                  onChange={e => setReplyText({ ...replyText, [ci.id]: e.target.value })}
                  placeholder="اكتب ردك على التقرير..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#E8520D]/50 resize-none"
                  rows={2}
                />
                <button 
                  onClick={() => handleReply(ci.id)}
                  disabled={!replyText[ci.id] || sendingReply === ci.id}
                  className="bg-[#E8520D] hover:bg-[#C9440A] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  {sendingReply === ci.id ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  إرسال الرد
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

// ─── Stats Editor ───────────────────────────────────────────────────────────
function StatsEditor({ client, saving, setSaving, onSaved }: {
  client: Client; saving: boolean; setSaving: (v: boolean) => void; onSaved: (c: Client) => void;
}) {
  const [goal, setGoal] = useState(client.goal || '');
  const [coachNotes, setCoachNotes] = useState(client.coachNotes || '');
  const [subPlan, setSubPlan] = useState(client.subscriptionPlan || '');
  const [endDate, setEndDate] = useState(client.endDate || '');
  const [newWeight, setNewWeight] = useState('');
  const [newBodyFat, setNewBodyFat] = useState('');
  const [newStatNotes, setNewStatNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);

  async function saveProfile() {
    setSaving(true);
    const updated: Client = { ...client, goal, coachNotes, subscriptionPlan: subPlan, endDate };
    await saveClient(updated);
    onSaved(updated);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function addStat() {
    if (!newWeight) return;
    const stat: BodyStat = {
      date: new Date().toISOString().slice(0, 10),
      weight: parseFloat(newWeight),
      bodyFat: newBodyFat ? parseFloat(newBodyFat) : undefined,
      notes: newStatNotes || undefined,
    };
    await addBodyStat(client.id, stat);
    const updated = await getClient(client.id);
    if (updated) onSaved(updated);
    setNewWeight(''); setNewBodyFat(''); setNewStatNotes('');
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    // FIXED: Validate file size before base64 conversion.
    // Firestore documents have a 1MB limit. Each base64 image adds ~33% overhead.
    // We cap each file at 300KB to stay safely under the limit with 5 photos.
    const MAX_FILE_SIZE = 300 * 1024; // 300KB
    const oversized = files.filter(f => f.size > MAX_FILE_SIZE);
    if (oversized.length > 0) {
      alert(`بعض الصور أكبر من الحد المسموح (300KB).\nالصور الكبيرة: ${oversized.map(f => f.name).join(', ')}`);
      e.target.value = '';
      return;
    }

    setPhotoSaving(true);
    const existing = client.progressPhotos || [];
    const remaining = 5 - existing.length;
    const toProcess = files.slice(0, remaining);
    const newBase64s = await Promise.all(
      toProcess.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          })
      )
    );
    const updated: Client = { ...client, progressPhotos: [...existing, ...newBase64s] };
    await saveClient(updated);
    onSaved(updated);
    setPhotoSaving(false);
    e.target.value = '';
  }


  async function deletePhoto(idx: number) {
    const photos = (client.progressPhotos || []).filter((_, i) => i !== idx);
    const updated: Client = { ...client, progressPhotos: photos };
    await saveClient(updated);
    onSaved(updated);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
      <div className="bg-[#0f0e0d] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">بيانات العميل</h3>
          <SaveBtn saving={saving} onClick={saveProfile} />
        </div>
        <Textarea label="الهدف" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="هدف العميل..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="الباقة (مثال: VIP - 3 شهور)" value={subPlan} onChange={(e) => setSubPlan(e.target.value)} placeholder="اسم الباقة" />
          <div>
            <label className="text-xs text-white/50 block mb-1.5">تاريخ الانتهاء</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#E8520D]/60 transition" />
          </div>
        </div>
        <Textarea label="ملاحظات المدرب" value={coachNotes} onChange={(e) => setCoachNotes(e.target.value)} placeholder="ملاحظات خاصة..." />
        {saved && <p className="text-green-400 text-xs">✓ تم الحفظ</p>}
      </div>

      <div className="bg-[#0f0e0d] border border-white/5 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm">إضافة قياس جديد</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="الوزن (kg) *" type="number" step="0.1" value={newWeight} onChange={(e) => setNewWeight(e.target.value)} placeholder="82.5" />
          <Input label="نسبة الدهون (%)" type="number" step="0.1" value={newBodyFat} onChange={(e) => setNewBodyFat(e.target.value)} placeholder="اختياري" />
        </div>
        <Input label="ملاحظة" value={newStatNotes} onChange={(e) => setNewStatNotes(e.target.value)} placeholder="اختياري" />
        <button onClick={addStat} disabled={!newWeight}
          className="flex items-center gap-2 bg-white/8 hover:bg-white/12 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition">
          <Plus size={15} />إضافة القياس
        </button>
      </div>

      <div className="bg-[#0f0e0d] border border-white/5 rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4">سجل القياسات</h3>
        {!client.bodyStats?.length ? (
          <p className="text-white/30 text-sm">لا توجد قياسات بعد</p>
        ) : (
          <div className="space-y-2">
            {[...client.bodyStats].reverse().map((s) => (
              <div key={s.date} className="flex items-center gap-4 border border-white/5 rounded-xl px-4 py-2.5">
                <span className="text-white/30 text-xs w-24">{s.date}</span>
                <span className="font-bold text-sm">{s.weight} kg</span>
                {s.bodyFat && <span className="text-white/40 text-sm">{s.bodyFat}% دهون</span>}
                {s.notes && <span className="text-white/30 text-xs flex-1 truncate">{s.notes}</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Progress Photos ── */}
      <div className="bg-[#0f0e0d] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image size={16} className="text-[#E8520D]" />
            <h3 className="font-bold text-sm">صور التقدم</h3>
          </div>
          <span className="text-white/30 text-xs">{(client.progressPhotos || []).length} / 5</span>
        </div>

        {(client.progressPhotos || []).length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {(client.progressPhotos || []).map((src, idx) => (
              <div key={idx} className="relative group">
                <img src={src} alt={`progress-${idx + 1}`}
                  className="w-20 h-20 object-cover rounded-xl border border-white/10" />
                <button onClick={() => deletePhoto(idx)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-xs shadow-lg">
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>
        )}

        {(client.progressPhotos || []).length < 5 && (
          <label className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/8 border border-dashed border-white/15 hover:border-[#E8520D]/40 rounded-xl px-4 py-3 text-sm text-white/50 hover:text-white transition w-fit">
            {photoSaving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {photoSaving ? 'جاري الرفع...' : 'رفع صور'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} disabled={photoSaving} />
          </label>
        )}
        <p className="text-white/25 text-xs">الحد الأقصى 5 صور – مرئية للعميل في لوحة التحكم</p>
      </div>
    </motion.div>
  );
}

function AdminDayCard({ day, updateDay, deleteDay, addExercise, updateExercise, deleteExercise }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  function pickExercise(name: string) {
    const ex = { id: uid(), name, sets: 3, reps: '10', muscleGroup: '', notes: '', videoUrl: '' };
    addExercise(day.id, ex);
  }

  return (
    <div className="bg-[#0f0e0d] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
      <div className="border-b border-white/5 px-5 py-3 flex items-center gap-3 bg-white/2">
        <GripVertical size={16} className="text-white/20 flex-shrink-0" />
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 text-white/40 hover:text-[#E8520D] hover:bg-[#E8520D]/10 rounded-lg transition">
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <input value={day.dayName} onChange={(e) => updateDay(day.id, 'dayName', e.target.value)}
          className="flex-1 bg-transparent font-bold text-sm outline-none placeholder:text-white/25" placeholder="اسم اليوم..." />
        <button onClick={() => deleteDay(day.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition">
          <Trash2 size={15} />
        </button>
      </div>

      {isOpen && (
        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-4 space-y-3">
          {day.exercises.map((ex: any) => (
            <ExerciseCard
              key={ex.id}
              ex={ex}
              dayId={day.id}
              updateExercise={updateExercise}
              deleteExercise={deleteExercise}
            />
          ))}

          {/* Add buttons row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center justify-center gap-1.5 border border-[#E8520D]/30 hover:border-[#E8520D]/60 bg-[#E8520D]/5 hover:bg-[#E8520D]/10 text-[#E8520D]/80 hover:text-[#E8520D] py-2.5 rounded-xl text-xs font-medium transition"
            >
              <Dumbbell size={13} />من القائمة
            </button>
            <button
              onClick={() => addExercise(day.id)}
              className="flex items-center justify-center gap-1.5 border border-dashed border-white/10 hover:border-white/25 text-white/30 hover:text-white/60 py-2.5 rounded-xl text-xs font-medium transition"
            >
              <Plus size={13} />يدوي
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showPicker && (
          <ExercisePicker onPick={pickExercise} onClose={() => setShowPicker(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Single Exercise Card ────────────────────────────────────────────────────
function ExerciseCard({ ex, dayId, updateExercise, deleteExercise }: any) {
  // Use a string for sets so user can freely clear the field (fixes Arabic input bug)
  const [setsStr, setSetsStr] = useState(String(ex.sets ?? 3));

  function handleSetsChange(val: string) {
    setSetsStr(val);
    const num = parseInt(val);
    if (!isNaN(num) && num > 0) {
      updateExercise(dayId, ex.id, 'sets', num);
    }
  }

  // Keep setsStr in sync if external update changes ex.sets
  const exSetsStr = String(ex.sets ?? 3);
  if (setsStr !== exSetsStr && document.activeElement?.getAttribute('data-setsid') !== ex.id) {
    // only sync when field not focused
  }

  return (
    <div className="bg-white/3 border border-white/5 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <input
          value={ex.name}
          onChange={(e) => updateExercise(dayId, ex.id, 'name', e.target.value)}
          placeholder="اسم التمرين..."
          className="flex-1 bg-transparent font-semibold text-sm outline-none placeholder:text-white/25 border-b border-white/10 pb-1"
        />
        <button
          onClick={() => deleteExercise(dayId, ex.id)}
          className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition flex-shrink-0"
        >
          <X size={14} />
        </button>
      </div>

      {/* Sets & Reps */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-white/40 block mb-1.5">الجولات (Sets)</span>
          <input
            data-setsid={ex.id}
            inputMode="numeric"
            value={setsStr}
            onChange={(e) => handleSetsChange(e.target.value)}
            onFocus={(e) => e.target.select()}
            placeholder="3"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#E8520D]/50 transition text-center"
          />
        </div>
        <div>
          <span className="text-white/40 block mb-1.5">التكرارات (Reps)</span>
          <input
            value={ex.reps}
            onChange={(e) => updateExercise(dayId, ex.id, 'reps', e.target.value)}
            placeholder="مثال: 8-12"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#E8520D]/50 transition"
          />
        </div>
      </div>

      {/* Notes & Video */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        {([['ملاحظات', 'notes', 'ملاحظة...'], ['رابط فيديو', 'videoUrl', 'https://youtube.com/...']] as [string, string, string][]).map(
          ([lbl, field, ph]) => (
            <div key={field}>
              <span className="text-white/40 block mb-1.5">{lbl}</span>
              <input
                value={String((ex as Record<string, unknown>)[field] || '')}
                onChange={(e) => updateExercise(dayId, ex.id, field, e.target.value)}
                placeholder={ph}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-[#E8520D]/50 transition"
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─── Workout Editor ──────────────────────────────────────────────────────────
function WorkoutEditor({ clientId, clientName, saving, setSaving }: { clientId: string; clientName: string; saving: boolean; setSaving: (v: boolean) => void }) {
  const [plan, setPlan] = useState<WorkoutPlan | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getWorkoutPlan(clientId).then((p) => {
      setPlan(p || { clientId, planName: '', days: [], coachNotes: '', updatedAt: new Date().toISOString() });
      setLoading(false);
    });
  }, [clientId]);

  const updatePlan = useCallback((updater: (p: WorkoutPlan) => WorkoutPlan) => {
    setPlan((prev) => prev ? updater(prev) : prev);
  }, []);

  async function save() {
    if (!plan) return;
    setSaving(true);
    const updated = { ...plan, updatedAt: new Date().toISOString() };
    await saveWorkoutPlan(updated);
    // FIXED: Look up the Firebase Auth UID from the clientId before notifying.
    // Previously passed clientId directly (Firestore document ID), but
    // notifications need the Firebase Auth UID as the userId recipient.
    const clientUid = await getUidByClientId(clientId);
    if (clientUid) {
      await notifyWorkoutAssigned(clientUid, clientName);
    } else {
      console.warn('Could not find Firebase UID for clientId:', clientId, '— notification not sent');
    }
    setPlan(updated);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const addDay = () => updatePlan((p) => ({ ...p, days: [...p.days, { id: uid(), dayName: `اليوم ${p.days.length + 1}`, exercises: [] }] }));
  const updateDay = (dayId: string, field: string, value: string) =>
    updatePlan((p) => ({ ...p, days: p.days.map((d) => d.id === dayId ? { ...d, [field]: value } : d) }));
  const deleteDay = (dayId: string) =>
    updatePlan((p) => ({ ...p, days: p.days.filter((d) => d.id !== dayId) }));
  const addExercise = (dayId: string, preset?: Exercise) => {
    const ex: Exercise = preset ?? { id: uid(), name: '', sets: 3, reps: '10', muscleGroup: '', notes: '', videoUrl: '' };
    updatePlan((p) => ({ ...p, days: p.days.map((d) => d.id === dayId ? { ...d, exercises: [...d.exercises, ex] } : d) }));
  };
  const updateExercise = (dayId: string, exId: string, field: string, value: string | number) =>
    updatePlan((p) => ({ ...p, days: p.days.map((d) => d.id === dayId ? { ...d, exercises: d.exercises.map((e) => e.id === exId ? { ...e, [field]: value } : e) } : d) }));
  const deleteExercise = (dayId: string, exId: string) =>
    updatePlan((p) => ({ ...p, days: p.days.map((d) => d.id === dayId ? { ...d, exercises: d.exercises.filter((e) => e.id !== exId) } : d) }));

  if (loading || !plan) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#E8520D]" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
      <div className="bg-[#0f0e0d] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">برنامج التمارين</h3>
          <div className="flex items-center gap-2">
            {saved && <span className="text-green-400 text-xs">✓ تم الحفظ</span>}
            <SaveBtn saving={saving} onClick={save} />
          </div>
        </div>
        <Input label="اسم البرنامج" value={plan.planName} onChange={(e) => updatePlan((p) => ({ ...p, planName: e.target.value }))} placeholder="مثال: برنامج بناء العضلات 4 أيام" />
        <Textarea label="ملاحظات المدرب" value={plan.coachNotes || ''} onChange={(e) => updatePlan((p) => ({ ...p, coachNotes: e.target.value }))} placeholder="تعليمات عامة..." />
        {/* Google Sheet link */}
        <div>
          <label className="text-xs text-white/50 block mb-1.5 flex items-center gap-1.5"><Link size={12} />رابط جدول Google Sheet (اختياري)</label>
          <input
            type="url"
            value={plan.googleSheetUrl || ''}
            onChange={(e) => updatePlan((p) => ({ ...p, googleSheetUrl: e.target.value }))}
            placeholder="https://docs.google.com/spreadsheets/..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#E8520D]/60 transition"
          />
        </div>
      </div>

      <div className="space-y-4">
        {plan.days.map((day) => (
          <AdminDayCard 
            key={day.id} 
            day={day} 
            updateDay={updateDay} 
            deleteDay={deleteDay} 
            addExercise={addExercise} 
            updateExercise={updateExercise} 
            deleteExercise={deleteExercise} 
          />
        ))}
      </div>

      <button onClick={addDay}
        className="w-full border border-dashed border-white/10 hover:border-[#E8520D]/40 text-white/30 hover:text-[#E8520D] py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
        <Plus size={16} />إضافة يوم تدريبي
      </button>
    </motion.div>
  );
}

// ─── Nutrition Editor ────────────────────────────────────────────────────────
function NutritionEditor({ clientId, clientName, saving, setSaving }: { clientId: string; clientName: string; saving: boolean; setSaving: (v: boolean) => void }) {
  const [plan, setPlan] = useState<NutritionPlan | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNutritionPlan(clientId).then((p) => {
      setPlan(p || { clientId, dailyCalories: 2000, proteinG: 150, carbsG: 200, fatG: 60, meals: [], coachNotes: '', updatedAt: new Date().toISOString() });
      setLoading(false);
    });
  }, [clientId]);

  function set<K extends keyof NutritionPlan>(field: K, value: NutritionPlan[K]) {
    setPlan((p) => p ? { ...p, [field]: value } : p);
  }

  async function save() {
    if (!plan) return;
    setSaving(true);
    const updated = { ...plan, updatedAt: new Date().toISOString() };
    await saveNutritionPlan(updated);
    // FIXED: Look up the Firebase Auth UID from the clientId before notifying.
    const clientUid = await getUidByClientId(clientId);
    if (clientUid) {
      await notifyNutritionUpdated(clientUid, clientName);
    } else {
      console.warn('Could not find Firebase UID for clientId:', clientId, '— notification not sent');
    }
    setPlan(updated);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const addMeal = () => set('meals', [...(plan?.meals || []), { id: uid(), name: '', foods: '', calories: 0 }]);
  const updateMeal = (id: string, field: keyof Meal, value: string | number) =>
    set('meals', (plan?.meals || []).map((m) => m.id === id ? { ...m, [field]: value } : m));
  const deleteMeal = (id: string) => set('meals', (plan?.meals || []).filter((m) => m.id !== id));

  if (loading || !plan) return <div className="flex justify-center py-16"><Loader2 size={24} className="animate-spin text-[#E8520D]" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
      <div className="bg-[#0f0e0d] border border-white/5 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">خطة التغذية</h3>
          <div className="flex items-center gap-2">
            {saved && <span className="text-green-400 text-xs">✓ تم الحفظ</span>}
            <SaveBtn saving={saving} onClick={save} />
          </div>
        </div>
        <Textarea label="ملاحظات المدرب" value={plan.coachNotes || ''} onChange={(e) => set('coachNotes', e.target.value)} placeholder="تعليمات تغذية..." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {([['سعرات يومية', 'dailyCalories', '#E8520D'], ['بروتين (g)', 'proteinG', '#3b82f6'], ['كربوهيدرات (g)', 'carbsG', '#f97316'], ['دهون (g)', 'fatG', '#eab308']] as [string, keyof NutritionPlan, string][]).map(([label, field, color]) => (
            <div key={String(field)}>
              <label className="text-xs text-white/50 block mb-1.5">{label}</label>
              <input type="number" value={plan[field] as number}
                onChange={(e) => set(field, parseFloat(e.target.value))}
                className="w-full bg-white/5 border rounded-xl px-4 py-3 text-sm outline-none transition font-bold"
                style={{ borderColor: `${color}30`, color }} />
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-sm">الوجبات</h3>
        {plan.meals.map((meal, i) => (
          <div key={meal.id} className="bg-[#0f0e0d] border border-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#E8520D]/10 text-[#E8520D] font-black text-xs flex items-center justify-center flex-shrink-0">{i + 1}</div>
              <input value={meal.name} onChange={(e) => updateMeal(meal.id, 'name', e.target.value)}
                placeholder="اسم الوجبة..." className="flex-1 bg-transparent font-semibold text-sm outline-none border-b border-white/10 pb-1 placeholder:text-white/25" />
              <button onClick={() => deleteMeal(meal.id)} className="p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition"><X size={14} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-xs text-white/40 block mb-1.5">المأكولات</label>
                <textarea value={meal.foods} onChange={(e) => updateMeal(meal.id, 'foods', e.target.value)}
                  placeholder="مثال:&#10;200 جرام أرز مسلوق&#10;3 بيض مسلوق"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8520D]/50 transition resize-y" />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1.5">السعرات</label>
                <input type="number" value={meal.calories} onChange={(e) => updateMeal(meal.id, 'calories', parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#E8520D]/50 transition" />
              </div>
            </div>
          </div>
        ))}
        <button onClick={addMeal}
          className="w-full border border-dashed border-white/10 hover:border-[#E8520D]/40 text-white/30 hover:text-[#E8520D] py-3 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2">
          <Plus size={16} />إضافة وجبة
        </button>
      </div>
    </motion.div>
  );
}

// ─── Shell ──────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  return (
    <PortalLayout title="لوحة تحكم المدرب">
      <Routes>
        <Route index element={<ClientList />} />
        <Route path="add" element={<AddClient />} />
        <Route path="client/:clientId" element={<ClientDetail />} />
        <Route path="notifications" element={<NotificationSettings />} />
      </Routes>
    </PortalLayout>
  );
}

