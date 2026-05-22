import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../portal/AuthContext';
import PortalLayout from '../../portal/PortalLayout';
import NotificationSettings from '../../portal/NotificationSettings';
import { useNotifications } from '../../portal/NotificationContext';
import {
  getClient,
  getWorkoutPlan,
  getNutritionPlan,
  getCheckIns,
  saveCheckIn,
  getWorkoutLogs,
  saveWorkoutLog,
  updateClientPhotos,
  updateClientProfile,
} from '../../portal/firestore';
import type { Client, WorkoutPlan, NutritionPlan, CheckIn, WorkoutLog } from '../../portal/types';
import { motion } from 'framer-motion';
import {
  Scale, Flame, Dumbbell, TrendingDown, PlayCircle,
  CheckCircle2, Send, Star, Loader2, ChevronDown, ChevronUp,
  ExternalLink, Image, Download, Settings, Bell,
} from 'lucide-react';

// Helper: Get Monday of the current week (ISO format)
function getStartOfWeek() {
  const d = new Date();
  const day = d.getDay() || 7; 
  if (day !== 1) d.setHours(-24 * (day - 1));
  return d.toISOString().slice(0, 10);
}

// ─── Stat Card ──────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = '#FF5500' }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs text-white/40 font-medium">{label}</span>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="text-2xl font-black text-white">{value}</div>
      {sub && <div className="text-xs text-white/30 mt-1">{sub}</div>}
    </div>
  );
}

// ─── Weight Chart (SVG) ─────────────────────────────────────────────────────
function WeightChart({ data }: { data: { date: string; weight: number }[] }) {
  if (data.length === 0) return <div className="text-center text-white/30 text-sm py-8">لا توجد بيانات كافية</div>;
  const W = 500, H = 140, pad = 12;
  const weights = data.map((s) => s.weight);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;
  const range = maxW - minW || 1;
  const points = data.map((s, i) => ({
    x: pad + (data.length === 1 ? (W - pad * 2) / 2 : (i / (data.length - 1)) * (W - pad * 2)),
    y: H - pad - ((s.weight - minW) / range) * (H - pad * 2),
    ...s,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = `${pathD} L ${points.at(-1)!.x} ${H} L ${points[0].x} ${H} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="none">
      <defs>
        <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF5500" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#FF5500" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#wg)" />
      <path d={pathD} fill="none" stroke="#FF5500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={`${p.date}-${i}`}>
          <circle cx={p.x} cy={p.y} r="4" fill="#FF5500" />
          <text x={p.x} y={H - 2} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.35)">{p.date.slice(5)}</text>
          <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.7)" fontWeight="bold">{p.weight}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────
function OverviewTab({ client, nutritionPlan }: { client: Client; nutritionPlan: NutritionPlan | undefined }) {
  const [weightData, setWeightData] = useState<{ date: string; weight: number }[]>([]);
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { permissionStatus, requestPermission } = useNotifications();

  useEffect(() => {
    getCheckIns(client.id).then((cis) => {
      const sorted = cis
        .filter((c) => c.weight)
        .sort((a, b) => a.date.localeCompare(b.date));
      setWeightData(sorted.map((c) => ({ date: c.date, weight: c.weight })));
    });
    
    // Calculate streak
    getWorkoutLogs(client.id).then((logs) => {
      const weekOf = getStartOfWeek();
      const thisWeekLogs = logs.filter(l => l.weekOf === weekOf);
      const completedDays = thisWeekLogs.filter(l => Object.values(l.exercises).some(ex => ex.completed)).length;
      setWorkoutStreak(completedDays);
    });
  }, [client.id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if ((client.progressPhotos || []).length >= 5) {
      alert('الحد الأقصى 5 صور');
      return;
    }
    const file = files[0];
    if (file.size > 300 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 300 كيلوبايت.');
      return;
    }
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      const newPhotos = [...(client.progressPhotos || []), base64];
      await updateClientPhotos(client.id, newPhotos);
      window.location.reload(); // Refresh to show new photo
    };
    reader.readAsDataURL(file);
  };

  const latest = weightData.at(-1);
  const first = weightData[0];
  const lost = first && latest ? (first.weight - latest.weight).toFixed(1) : '-';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {permissionStatus === 'default' && (
        <div className="bg-gradient-to-r from-[#FF5500]/20 to-[#FF8800]/10 border border-[#FF5500]/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-right">
            <div className="w-10 h-10 rounded-xl bg-[#FF5500]/20 flex items-center justify-center text-[#FF5500] flex-shrink-0 animate-bounce">
              <Bell size={20} className="fill-[#FF5500]" />
            </div>
            <div>
              <h3 className="font-bold text-sm">فعّل الإشعارات لتتابع جديدك!</h3>
              <p className="text-xs text-white/50">احصل على إشعار فوري عند تعديل التمارين والتغذية من الكوتش.</p>
            </div>
          </div>
          <button 
            onClick={requestPermission} 
            className="bg-[#FF5500] hover:bg-[#FF6620] text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-[0_5px_15px_rgba(255,85,0,0.3)] active:scale-95 whitespace-nowrap"
          >
            تفعيل الآن 🔔
          </button>
        </div>
      )}

      <div className="bg-gradient-to-br from-[#FF5500]/15 to-[#FF5500]/5 border border-[#FF5500]/20 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FF5500] flex items-center justify-center text-white font-black text-lg flex-shrink-0">{client.avatarInitials}</div>
          <div>
            <h2 className="text-xl font-black">أهلاً، {client.name}!</h2>
            <p className="text-white/50 text-sm mt-0.5 mb-2">{client.goal}</p>
            {client.subscriptionPlan && (
              <span className="inline-block bg-[#FF5500]/10 text-[#FF5500] border border-[#FF5500]/20 px-3 py-1 rounded-lg text-xs font-bold mb-2">
                الباقة: {client.subscriptionPlan}
              </span>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <p className="text-white/40">في رحلتك منذ: <span className="font-bold text-white/80">{client.startDate}</span></p>
              {client.endDate && <p className="text-white/40">ينتهي الاشتراك: <span className="font-bold text-red-400">{client.endDate}</span></p>}
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Scale} label="الوزن الحالي" value={latest ? `${latest.weight} kg` : '-'} sub="آخر قياس" />
        <StatCard icon={TrendingDown} label="الخسارة الكلية" value={`${lost} kg`} sub="منذ البداية" color="#22c55e" />
        <StatCard icon={Flame} label="السعرات اليومية" value={nutritionPlan ? `${nutritionPlan.dailyCalories}` : '-'} sub="كيلوكالوري" color="#f97316" />
        <StatCard icon={CheckCircle2} label="تمارين الأسبوع" value={`${workoutStreak} أيام`} sub="أُنجزت" color="#8b5cf6" />
      </div>
      <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6">
        <h3 className="font-bold mb-4">مسار الوزن</h3>
        <WeightChart data={weightData} />
      </div>
      {client.coachNotes && (
        <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-5">
          <h3 className="font-bold mb-2 text-sm text-white/60">ملاحظات المدرب</h3>
          <p className="text-white/80 text-sm leading-relaxed">{client.coachNotes}</p>
        </div>
      )}

      {/* Progress Photos */}
      <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Image size={16} className="text-[#FF5500]" />
            <h3 className="font-bold text-sm">صور التقدم ({(client.progressPhotos || []).length}/5)</h3>
          </div>
          <label className={`bg-[#FF5500]/10 text-[#FF5500] hover:bg-[#FF5500]/20 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${uploadingPhoto ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploadingPhoto ? 'جاري الرفع...' : 'رفع صورة +'}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadingPhoto} />
          </label>
        </div>
        
        {(client.progressPhotos || []).length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {(client.progressPhotos || []).map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`progress-${idx + 1}`}
                className="w-32 h-32 object-cover rounded-2xl border border-white/10 flex-shrink-0"
              />
            ))}
          </div>
        ) : (
          <p className="text-white/30 text-xs text-center py-4">لم تقم برفع صور للتقدم بعد.</p>
        )}
      </div>
    </motion.div>
  );
}

function ClientDayCard({ day, clientId, weekOf, initialLog }: { day: WorkoutPlan['days'][0], clientId: string, weekOf: string, initialLog?: WorkoutLog }) {
  const [isOpen, setIsOpen] = useState(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  // per-set logging: { [exId]: { [setIdx]: { weight: string, reps: string } } }
  const [setLogs, setSetLogs] = useState<Record<string, { weight: string; reps: string }[]>>({});
  const [isReady, setIsReady] = useState(false);

  // Initialize state from firestore log once
  useEffect(() => {
    if (initialLog) {
      const comp: Record<string, boolean> = {};
      const sl: Record<string, { weight: string; reps: string }[]> = {};
      Object.keys(initialLog.exercises).forEach(exId => {
        comp[exId] = initialLog.exercises[exId].completed;
        sl[exId] = initialLog.exercises[exId].sets;
      });
      setCompleted(comp);
      setSetLogs(sl);
    }
    setIsReady(true);
  }, [initialLog]);

  // Debounced save
  useEffect(() => {
    if (!isReady) return;
    const t = setTimeout(() => {
      const logData: WorkoutLog = {
        id: `${clientId}_${day.id}_${weekOf}`,
        clientId,
        dayId: day.id,
        weekOf,
        savedAt: new Date().toISOString(),
        exercises: {}
      };
      day.exercises.forEach(ex => {
        logData.exercises[ex.id] = {
          completed: !!completed[ex.id],
          sets: setLogs[ex.id] || Array(ex.sets).fill({ weight: '', reps: '' })
        };
      });
      saveWorkoutLog(logData).catch(err => console.error('Failed to save log', err));
    }, 1500); // Wait 1.5s after last change before saving
    return () => clearTimeout(t);
  }, [completed, setLogs, isReady, clientId, day, weekOf]);

  const toggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCompleted(prev => ({ ...prev, [id]: !prev[id] }));
  };

  function updateSetLog(exId: string, setIdx: number, field: 'weight' | 'reps', value: string) {
    setSetLogs(prev => {
      const ex = prev[exId] || [];
      const updated = [...ex];
      if (!updated[setIdx]) updated[setIdx] = { weight: '', reps: '' };
      updated[setIdx] = { ...updated[setIdx], [field]: value };
      return { ...prev, [exId]: updated };
    });
  }

  return (
    <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between px-6 py-5 bg-white/2 hover:bg-white/5 transition active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isOpen ? 'bg-[#FF5500]' : 'bg-white/20'}`} />
          <span className="font-black text-base">{day.dayName}</span>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-[#FF5500]" /> : <ChevronDown size={20} className="text-white/40" />}
      </button>
      
      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }} 
          animate={{ height: 'auto', opacity: 1 }} 
          className="border-t border-white/5 divide-y divide-white/5"
        >
          {day.exercises.map((ex) => (
            <div 
              key={ex.id} 
              className={`px-6 py-5 flex flex-col gap-4 transition-colors ${completed[ex.id] ? 'bg-[#FF5500]/5' : ''}`}
              onClick={(e) => toggleComplete(ex.id, e as any)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${completed[ex.id] ? 'bg-[#FF5500] text-white' : 'bg-white/5 text-[#FF5500]'}`}>
                    {completed[ex.id] ? <CheckCircle2 size={20} /> : <Dumbbell size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className={`font-black text-base transition-colors ${completed[ex.id] ? 'text-white/40 line-through' : 'text-white'}`}>
                      {ex.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[#FF5500] font-bold text-sm bg-[#FF5500]/10 px-2 py-0.5 rounded-lg border border-[#FF5500]/20">
                        {ex.sets} جولات × {ex.reps}
                      </span>
                      {ex.muscleGroup && (
                        <span className="text-white/30 text-xs bg-white/5 px-2 py-0.5 rounded-lg">
                          {ex.muscleGroup}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={(e) => toggleComplete(ex.id, e)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all active:scale-90 ${
                    completed[ex.id] 
                      ? 'bg-[#FF5500] border-[#FF5500] text-white' 
                      : 'border-white/10 text-white/20'
                  }`}
                >
                  <CheckCircle2 size={24} />
                </button>
              </div>

              {(ex.notes || ex.videoUrl) && !completed[ex.id] && (
                <div className="space-y-3 pt-1">
                  {ex.notes && (
                    <p className="text-white/50 text-sm leading-relaxed bg-white/5 p-3 rounded-xl border border-white/5">
                      {ex.notes}
                    </p>
                  )}
                  {ex.videoUrl && (
                    (() => {
                      // FIXED: Block javascript: and data: URLs to prevent XSS
                      const safeUrl = ex.videoUrl.startsWith('http://') || ex.videoUrl.startsWith('https://')
                        ? ex.videoUrl
                        : '#';
                      return (
                        <a 
                          href={safeUrl} 
                          target="_blank" 
                          rel="noreferrer noopener" 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl py-4 text-sm font-black transition w-full active:scale-[0.98]"
                        >
                          <PlayCircle size={20} className="text-[#FF5500]" /> 
                          شاهد الفيديو التوضيحي
                        </a>
                      );
                    })()
                  )}
                </div>
              )}

              {/* Per-set logging */}
              {!completed[ex.id] && (
                <div className="pt-1 space-y-2" onClick={(e) => e.stopPropagation()}>
                  <p className="text-white/30 text-xs font-bold uppercase tracking-wide">تسجيل الجولات</p>
                  {Array.from({ length: ex.sets }).map((_, i) => {
                    const log = setLogs[ex.id]?.[i] || { weight: '', reps: '' };
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-[#FF5500]/10 text-[#FF5500] text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <input
                          type="number"
                          step="0.5"
                          value={log.weight}
                          onChange={(e) => updateSetLog(ex.id, i, 'weight', e.target.value)}
                          placeholder="kg"
                          className="w-20 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#FF5500]/50 transition placeholder:text-white/20"
                        />
                        <input
                          type="text"
                          value={log.reps}
                          onChange={(e) => updateSetLog(ex.id, i, 'reps', e.target.value)}
                          placeholder="تكرار"
                          className="w-20 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#FF5500]/50 transition placeholder:text-white/20"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}

// ─── Workout Tab ─────────────────────────────────────────────────────────────
function WorkoutTab({ plan, clientId }: { plan: WorkoutPlan | undefined, clientId: string }) {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const weekOf = getStartOfWeek();

  useEffect(() => {
    getWorkoutLogs(clientId).then(allLogs => {
      setLogs(allLogs.filter(l => l.weekOf === weekOf));
    });
  }, [clientId, weekOf]);

  if (!plan) return <div className="text-center text-white/30 py-16">لم يتم تعيين برنامج تمارين بعد.</div>;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-bold text-lg">{plan.planName}</h2>
          <span className="text-xs text-white/30">أسبوع: {weekOf}</span>
        </div>
        <button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2">
          <Download size={14} /> PDF
        </button>
      </div>
      {plan.coachNotes && <div className="bg-[#FF5500]/8 border border-[#FF5500]/15 rounded-xl p-4 text-sm text-[#FF5500]/90">{plan.coachNotes}</div>}

      {/* Google Sheet button */}
      {plan.googleSheetUrl && (
        <a
          href={plan.googleSheetUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 bg-[#0f9d58]/10 hover:bg-[#0f9d58]/20 border border-[#0f9d58]/30 hover:border-[#0f9d58]/60 text-[#0f9d58] font-bold py-3.5 rounded-xl transition text-sm w-full"
        >
          <ExternalLink size={16} />
          فتح جدول Google Sheet
        </a>
      )}

      <div className="space-y-4">
        {plan.days.map((day) => (
          <ClientDayCard 
            key={day.id} 
            day={day} 
            clientId={clientId} 
            weekOf={weekOf} 
            initialLog={logs.find(l => l.dayId === day.id)} 
          />
        ))}
      </div>
    </motion.div>
  );
}

function NutritionTab({ plan }: { plan: NutritionPlan | undefined }) {
  if (!plan) return <div className="text-center text-white/30 py-16">لم يتم تعيين خطة تغذية بعد.</div>;
  const macros = [
    { label: 'بروتين', value: plan.proteinG, unit: 'g', color: '#3b82f6', pct: Math.round((plan.proteinG * 4 / plan.dailyCalories) * 100) },
    { label: 'كربوهيدرات', value: plan.carbsG, unit: 'g', color: '#f97316', pct: Math.round((plan.carbsG * 4 / plan.dailyCalories) * 100) },
    { label: 'دهون', value: plan.fatG, unit: 'g', color: '#eab308', pct: Math.round((plan.fatG * 9 / plan.dailyCalories) * 100) },
  ];
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg">الخطة الغذائية</h2>
        <button onClick={() => window.print()} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2">
          <Download size={14} /> PDF
        </button>
      </div>
      <div className="bg-gradient-to-br from-[#FF5500]/15 to-transparent border border-[#FF5500]/20 rounded-2xl p-6 text-center">
        <div className="text-5xl font-black text-[#FF5500]">{plan.dailyCalories}</div>
        <div className="text-white/40 text-sm mt-1">كيلوكالوري يومياً</div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {macros.map((m) => (
          <div key={m.label} className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-5 text-center">
            <div className="text-2xl font-black" style={{ color: m.color }}>{m.value}<span className="text-base font-bold">{m.unit}</span></div>
            <div className="text-white/40 text-xs mt-1">{m.label}</div>
            <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${m.pct}%`, backgroundColor: m.color }} />
            </div>
            <div className="text-white/25 text-xs mt-1">{m.pct}%</div>
          </div>
        ))}
      </div>
      {plan.coachNotes && <div className="bg-[#FF5500]/8 border border-[#FF5500]/15 rounded-xl p-4 text-sm text-[#FF5500]/90">🥗 {plan.coachNotes}</div>}
      <div className="space-y-3">
        <h3 className="font-bold">الوجبات اليومية</h3>
        {plan.meals.map((meal, i) => (
          <div key={meal.id} className="bg-[#0e0e0e] border border-white/5 rounded-xl px-5 py-4 flex items-start gap-4">
            <div className="w-7 h-7 rounded-lg bg-[#FF5500]/10 text-[#FF5500] font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{meal.name}</div>
              <div className="text-white/50 text-xs mt-1 leading-relaxed whitespace-pre-wrap">{meal.foods}</div>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="text-orange-400 font-bold">{meal.calories}</div>
              <div className="text-white/25 text-xs">kcal</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Check-in Tab ────────────────────────────────────────────────────────────
function CheckInTab({ clientId }: { clientId: string }) {
  const [weight, setWeight] = useState('');
  const [energy, setEnergy] = useState(3);
  const [sleep, setSleep] = useState('');
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<CheckIn[]>([]);

  const loadHistory = () => getCheckIns(clientId).then((h) => setHistory(h.sort((a, b) => b.date.localeCompare(a.date))));
  useEffect(() => { loadHistory(); }, [clientId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // FIXED: Validate weight is a real number before saving
    const parsedWeight = parseFloat(weight);
    if (!weight || isNaN(parsedWeight) || parsedWeight <= 0) {
      return; // input[required] handles UI, but we guard against NaN explicitly
    }
    setSubmitting(true);
    const ci: CheckIn = {
      id: `ci-${Date.now()}`,
      clientId,
      date: new Date().toISOString().slice(0, 10),
      weight: parsedWeight,
      energyLevel: energy as 1 | 2 | 3 | 4 | 5,
      sleepHours: parseFloat(sleep) || 0,
      notes,
    };
    await saveCheckIn(ci);
    // Also sync weight to bodyStats so the overview chart updates
    const { addBodyStat } = await import('../../portal/firestore');
    await addBodyStat(clientId, { date: ci.date, weight: ci.weight });
    setWeight(''); setSleep(''); setNotes(''); setEnergy(3);
    await loadHistory();
    setSubmitting(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6 md:p-8">
        <h2 className="font-black text-xl mb-6">تسجيل أسبوعي</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider block ml-1">الوزن (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)} 
                required 
                placeholder="مثال: 82.5"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base font-bold outline-none focus:border-[#FF5500] focus:bg-[#FF5500]/5 transition-all" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider block ml-1">ساعات النوم</label>
              <input 
                type="number" 
                step="0.5" 
                value={sleep} 
                onChange={(e) => setSleep(e.target.value)} 
                required 
                placeholder="مثال: 7.5"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base font-bold outline-none focus:border-[#FF5500] focus:bg-[#FF5500]/5 transition-all" 
              />
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider block ml-1 text-center">مستوى الطاقة</label>
            <div className="flex justify-between gap-2 max-w-sm mx-auto">
              {[1,2,3,4,5].map((n) => (
                <button 
                  key={n} 
                  type="button" 
                  onClick={() => setEnergy(n)} 
                  className={`flex-1 aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-90 border ${
                    energy >= n 
                      ? 'bg-[#FF5500]/10 border-[#FF5500]/30 text-yellow-400' 
                      : 'bg-white/5 border-white/5 text-white/20'
                  }`}
                >
                  <Star size={28} className={energy >= n ? 'fill-yellow-400' : ''} />
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-white/30 px-2 font-bold uppercase tracking-tighter">
              <span>منخفض جداً</span>
              <span>ممتاز</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider block ml-1">ملاحظات الأسبوع</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              rows={4} 
              placeholder="كيف تشعر؟ هل التزمت بالدايت والتمارين؟"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-base outline-none focus:border-[#FF5500] focus:bg-[#FF5500]/5 transition-all resize-none" 
            />
          </div>
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full bg-[#FF5500] hover:bg-[#FF6620] disabled:opacity-60 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_10px_20px_rgba(255,85,0,0.2)] active:scale-[0.98]"
          >
            {submitting ? <Loader2 size={24} className="animate-spin" /> : saved ? <CheckCircle2 size={24} /> : <Send size={24} />}
            <span className="text-lg">{saved ? 'تم الإرسال بنجاح!' : 'إرسال التقرير الأسبوعي'}</span>
          </button>
        </form>
      </div>
      {history.length > 0 && (
        <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6">
          <h3 className="font-bold mb-4 text-sm">سجل التقارير</h3>
          <div className="space-y-2">
            {history.slice(0, 5).map((ci) => (
              <div key={ci.id} className="border border-white/5 bg-white/2 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="text-xs font-bold text-[#FF5500] bg-[#FF5500]/10 px-2 py-1 rounded">{ci.date}</div>
                  <div className="text-sm font-semibold">{ci.weight} kg</div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(n => <Star key={n} size={11} className={ci.energyLevel >= n ? 'fill-yellow-400 text-yellow-400' : 'text-white/15'} />)}
                  </div>
                </div>
                {ci.notes && <div className="text-sm text-white/70 leading-relaxed border-t border-white/5 pt-2">{ci.notes}</div>}
                {ci.coachReply && (
                  <div className="bg-[#FF5500]/10 border border-[#FF5500]/20 rounded-lg p-3 mt-2">
                    <div className="text-[#FF5500] text-xs font-bold mb-1 flex items-center gap-1">
                      <Star size={12} className="fill-[#FF5500]" /> رد المدرب
                    </div>
                    <div className="text-white/90 text-sm leading-relaxed">{ci.coachReply}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Settings Tab ────────────────────────────────────────────────────────────
function SettingsTab({ client }: { client: Client }) {
  const [name, setName] = useState(client.name);
  const [phone, setPhone] = useState(client.phone || '');
  const [goal, setGoal] = useState(client.goal || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await updateClientProfile(client.id, { name, phone, goal });
    setSaving(false);
    alert('تم حفظ الإعدادات بنجاح');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md space-y-6">
      <div className="bg-[#0e0e0e] border border-white/5 rounded-2xl p-6">
        <h2 className="font-bold mb-6 flex items-center gap-2">
          <Settings size={20} className="text-[#FF5500]" /> إعدادات الحساب
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs text-white/40 mb-1">الاسم</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF5500]/50 transition" />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">رقم الهاتف</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF5500]/50 transition text-left" dir="ltr" />
          </div>
          <div>
            <label className="block text-xs text-white/40 mb-1">هدفك</label>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FF5500]/50 transition resize-none" />
          </div>
          <button type="submit" disabled={saving} className="w-full bg-[#FF5500] hover:bg-[#FF6620] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2">
            {saving ? <Loader2 size={18} className="animate-spin" /> : 'حفظ التعديلات'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function ClientDashboard() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<WorkoutPlan | undefined>();
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.clientId) { navigate('/portal/login', { replace: true }); return; }
    Promise.all([
      getClient(currentUser.clientId),
      getWorkoutPlan(currentUser.clientId),
      getNutritionPlan(currentUser.clientId),
    ]).then(([c, w, n]) => {
      if (!c) { navigate('/portal/login', { replace: true }); return; }
      setClient(c); setWorkoutPlan(w); setNutritionPlan(n);
    }).finally(() => setLoading(false));
  }, [currentUser, navigate]);

  if (loading) return (
    <div className="min-h-screen bg-[#070707] flex items-center justify-center">
      <Loader2 size={32} className="animate-spin text-[#FF5500]" />
    </div>
  );
  if (!client) return null;

  const tabs = [
    { to: '/portal/dashboard', label: 'نظرة عامة', end: true },
    { to: '/portal/dashboard/workout', label: 'التمارين' },
    { to: '/portal/dashboard/nutrition', label: 'التغذية' },
    { to: '/portal/dashboard/checkin', label: 'تسجيل أسبوعي' },
    { to: '/portal/dashboard/settings', label: 'الإعدادات' },
    { to: '/portal/dashboard/notifications', label: 'الإشعارات' },
  ];

  return (
    <PortalLayout title={`مرحباً ${client.name}`}>


      <div className="flex gap-1 mb-6 bg-white/3 p-1 rounded-xl overflow-x-auto hide-scrollbar -mx-4 px-4 md:mx-0 md:px-1 md:w-fit">
        {tabs.map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${isActive ? 'bg-[#FF5500] text-white' : 'text-white/50 hover:text-white'}`
            }>
            {label}
          </NavLink>
        ))}
      </div>
      <Routes>
        <Route index element={<OverviewTab client={client} nutritionPlan={nutritionPlan} />} />
        <Route path="workout" element={<WorkoutTab plan={workoutPlan} clientId={client.id} />} />
        <Route path="nutrition" element={<NutritionTab plan={nutritionPlan} />} />
        <Route path="checkin" element={<CheckInTab clientId={client.id} />} />
        <Route path="settings" element={<SettingsTab client={client} />} />
        <Route path="notifications" element={<NotificationSettings />} />
      </Routes>
    </PortalLayout>
  );
}
