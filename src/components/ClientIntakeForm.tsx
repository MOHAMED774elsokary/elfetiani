import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Activity, Target, CheckCircle, ChevronDown, Dumbbell, HeartPulse, Utensils, ChevronRight, ChevronLeft } from 'lucide-react';
import emailjs from '@emailjs/browser';
import type { Language } from '../App';

interface ClientIntakeFormProps { lang: Language; }

const EMAILJS_SERVICE_ID = 'service_g5ylivi';
const EMAILJS_TEMPLATE_ID = 'template_e8x3iee';
const EMAILJS_PUBLIC_KEY = 'WS5astKMXLJsVyRDV';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type Goal = 'lose' | 'maintain' | 'gain';
type Gender = 'male' | 'female';
type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';
type TrainingLocation = 'gym' | 'home' | 'both';

interface FormData {
  name: string; email: string; phone: string; age: string; gender: Gender;
  weight: string; height: string; activity: ActivityLevel; activityDetails: string; goal: Goal;
  fitnessLevel: FitnessLevel; trainingLocation: TrainingLocation; equipment: string[];
  trainingDays: number; injuries: string; dietary: string; notes: string;
}

function calcMacros(data: FormData) {
  const weight = parseFloat(data.weight);
  const height = parseFloat(data.height);
  const age = parseFloat(data.age);
  if (!weight || !height || !age) return null;
  const bmr = data.gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  const activityMap: Record<ActivityLevel, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  };
  const tdee = Math.round(bmr * activityMap[data.activity]);
  const bmi = +(weight / ((height / 100) ** 2)).toFixed(1);
  return { bmr: Math.round(bmr), tdee, bmi };
}

const inputClass = "w-full bg-[#0d0d0d] border border-white/10 rounded-xl px-4 py-3 text-white font-medium placeholder:text-white/20 focus:outline-none focus:border-[#FF5500]/60 focus:shadow-[0_0_0_3px_rgba(255,85,0,0.1)] transition-all duration-300";
const selectClass = `${inputClass} appearance-none cursor-pointer`;
const labelClass = "block text-white/60 text-sm font-bold mb-2";

const STEPS = ['personal', 'body', 'training'] as const;

export default function ClientIntakeForm({ lang }: ClientIntakeFormProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>({
    name: '', email: '', phone: '', age: '', gender: 'male',
    weight: '', height: '', activity: 'moderate', activityDetails: '', goal: 'lose',
    fitnessLevel: 'beginner', trainingLocation: 'gym', equipment: [],
    trainingDays: 3, injuries: '', dietary: '', notes: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [validationError, setValidationError] = useState('');

  const set = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (validationError) setValidationError('');
  };

  const toggleEquipment = (item: string) =>
    setForm(p => ({
      ...p,
      equipment: p.equipment.includes(item)
        ? p.equipment.filter(e => e !== item)
        : [...p.equipment, item],
    }));

  const macros = calcMacros(form);

  const validateStep = (currentStep: number) => {
    if (currentStep === 0) {
      if (!form.name.trim()) return lang === 'ar' ? 'عفواً، نسيت إدخال اسمك الكامل 👤' : 'Please enter your full name 👤';
      if (!form.age || parseFloat(form.age) < 10) return lang === 'ar' ? 'عفواً، نسيت إدخال عمرك أو أدخلت رقماً غير صحيح 🎂' : 'Please enter a valid age 🎂';
      if (!form.email.trim() || !form.email.includes('@')) return lang === 'ar' ? 'عفواً، نسيت إدخال بريد إلكتروني صحيح 📧' : 'Please enter a valid email address 📧';
      if (!form.phone.trim() || form.phone.length < 8) return lang === 'ar' ? 'عفواً، نسيت إدخال رقم الواتساب الخاص بك 📱' : 'Please enter your WhatsApp number 📱';
    } else if (currentStep === 1) {
      if (!form.weight || parseFloat(form.weight) < 20) return lang === 'ar' ? 'عفواً، نسيت إدخال وزنك للتمكن من حساب السعرات ⚖️' : 'Please enter a valid weight ⚖️';
      if (!form.height || parseFloat(form.height) < 100) return lang === 'ar' ? 'عفواً، نسيت إدخال طولك للتمكن من حساب السعرات 📏' : 'Please enter a valid height 📏';
    }
    return '';
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) {
      setValidationError(err);
      return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();
    const err = validateStep(step);
    if (err) {
      setValidationError(err);
      return;
    }
    if (!macros) {
      setValidationError(lang === 'ar' ? 'تأكد من إدخال الوزن والطول والعمر بشكل صحيح لحساب سعراتك.' : 'Ensure weight, height, and age are valid.');
      return;
    }
    setStatus('sending');
    const activityLabels: Record<ActivityLevel, string> = {
      sedentary: lang === 'ar' ? 'مستقر' : 'Sedentary',
      light: lang === 'ar' ? 'خفيف' : 'Lightly Active',
      moderate: lang === 'ar' ? 'متوسط' : 'Moderately Active',
      active: lang === 'ar' ? 'عالي' : 'Very Active',
      very_active: lang === 'ar' ? 'مكثف' : 'Extremely Active',
    };
    const goalLabels: Record<Goal, string> = {
      lose: lang === 'ar' ? 'خسارة وزن' : 'Lose Fat',
      maintain: lang === 'ar' ? 'ثبات' : 'Maintain',
      gain: lang === 'ar' ? 'بناء عضل' : 'Gain Muscle',
    };
    const templateParams = {
      to_email: 'elfetyaniabdo@gmail.com',
      client_name: form.name, client_email: form.email, client_phone: form.phone,
      client_age: form.age,
      client_gender: form.gender === 'male' ? (lang === 'ar' ? 'ذكر' : 'Male') : (lang === 'ar' ? 'أنثى' : 'Female'),
      client_weight: `${form.weight} kg`, client_height: `${form.height} cm`,
      client_bmi: macros.bmi,
      client_activity: activityLabels[form.activity],
      client_activity_details: form.activityDetails || (lang === 'ar' ? 'لا توجد تفاصيل' : 'No details'),
      client_goal: goalLabels[form.goal],
      client_fitness_level: ({ beginner: lang === 'ar' ? 'مبتدئ' : 'Beginner', intermediate: lang === 'ar' ? 'متوسط' : 'Intermediate', advanced: lang === 'ar' ? 'متقدم' : 'Advanced' })[form.fitnessLevel],
      client_training_location: ({ gym: lang === 'ar' ? 'صالة' : 'Gym', home: lang === 'ar' ? 'منزل' : 'Home', both: lang === 'ar' ? 'كلاهما' : 'Both' })[form.trainingLocation],
      client_equipment: form.equipment.length > 0 ? form.equipment.join(', ') : (lang === 'ar' ? 'لا يوجد' : 'None'),
      client_training_days: `${form.trainingDays} ${lang === 'ar' ? 'أيام/أسبوع' : 'days/week'}`,
      client_injuries: form.injuries || (lang === 'ar' ? 'لا توجد' : 'None'),
      client_dietary: form.dietary || (lang === 'ar' ? 'لا يوجد' : 'None'),
      client_notes: form.notes || (lang === 'ar' ? 'لا توجد' : 'None'),
      bmr: `${macros.bmr} kcal`, tdee: `${macros.tdee} kcal`,
    };
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
      setStatus('sent');
    } catch (err: any) {
      console.error("EMAILJS ERROR:", err);
      setStatus('error');
      setValidationError(
        typeof err === 'object' && err !== null && 'text' in err 
         ? `خطأ برمجي من EmailJS: ${err.text}` 
         : `حدث خطأ في الإرسال: تحقق من الإنترنت أو حاول لاحقاً`
      );
    }
  };

  const t = {
    ar: {
      title: 'استمارة بيانات العميل',
      subtitle: 'أدخل بياناتك وسيتواصل معك مدربك في أقرب وقت',
      steps: ['البيانات الشخصية', 'البيانات الجسمية', 'التدريب والصحة'],
      name: 'الاسم الكامل', namePh: 'محمد أحمد',
      email: 'البريد الإلكتروني', emailPh: 'example@mail.com',
      phone: 'رقم الواتساب', phonePh: '+201234567890',
      age: 'العمر', agePh: '25',
      gender: 'الجنس', male: 'ذكر', female: 'أنثى',
      weight: 'الوزن (كجم)', weightPh: '85',
      height: 'الطول (سم)', heightPh: '175',
      activity: 'مستوى النشاط',
      activityDetails: 'تفاصيل نشاطك اليومي', activityDetailsPh: 'مثال: أدرس، أعمل في مكتب طوال اليوم...',
      activities: ['مستقر', 'نشاط خفيف (1-3)', 'نشاط متوسط (3-5)', 'نشاط عالي (6-7)', 'مكثف جداً'],
      goal: 'الهدف', goals: ['خسارة دهون', 'ثبات', 'بناء عضل'],
      fitnessLevel: 'المستوى الرياضي', fitnessLevels: ['مبتدئ', 'متوسط', 'متقدم'],
      trainingLocation: 'مكان التدريب', trainingLocations: ['صالة رياضية', 'المنزل', 'كلاهما'],
      equipment: 'الأجهزة المتاحة',
      equipmentOptions: ['بار + أوزان', 'دمبلز', 'أجهزة الصالة', 'TRX', 'حبل قفز', 'لا يوجد أجهزة'],
      trainingDays: 'عدد أيام التدريب أسبوعياً',
      injuries: 'إصابات أو مشاكل صحية', injuriesPh: 'مثال: ألم في الركبة، ضغط دم...',
      dietary: 'تفضيلات غذائية أو ممنوعات', dietaryPh: 'مثال: لا لحمة، حساسية...',
      notes: 'ملاحظات إضافية', notesPh: 'أي معلومات للمدرب...',
      next: 'التالي', back: 'السابق', submit: 'أرسل البيانات للمدرب', sending: 'جاري الإرسال...',
      sentTitle: 'تم الإرسال بنجاح! ✅', sentMsg: 'تم إرسال بياناتك إلى مدربك. سيتواصل معك قريباً.',
      errorMsg: 'حدث خطأ. حاول مرة أخرى أو تواصل مع المدرب مباشرة.',
      bmiLabel: 'مؤشر كتلة الجسم', calories: 'السعرات', protein: 'بروتين', carbs: 'كارب', fat: 'دهون',
      livePreview: 'معاينة مباشرة', healthTitle: 'المشاكل الصحية والقيود',
    },
    en: {
      title: 'Client Intake Form',
      subtitle: 'Fill in your details and your coach will contact you shortly',
      steps: ['Personal Info', 'Body Data', 'Training & Health'],
      name: 'Full Name', namePh: 'John Smith',
      email: 'Email Address', emailPh: 'example@mail.com',
      phone: 'WhatsApp Number', phonePh: '+201234567890',
      age: 'Age', agePh: '25',
      gender: 'Gender', male: 'Male', female: 'Female',
      weight: 'Weight (kg)', weightPh: '85',
      height: 'Height (cm)', heightPh: '175',
      activity: 'Activity Level',
      activityDetails: 'Daily Activity Details', activityDetailsPh: 'e.g. studying, desk job, construction worker...',
      activities: ['Sedentary', 'Lightly Active (1-3)', 'Moderately Active (3-5)', 'Very Active (6-7)', 'Extremely Active'],
      goal: 'Goal', goals: ['Lose Fat', 'Maintain', 'Gain Muscle'],
      fitnessLevel: 'Fitness Level', fitnessLevels: ['Beginner', 'Intermediate', 'Advanced'],
      trainingLocation: 'Training Location', trainingLocations: ['Gym', 'Home', 'Both'],
      equipment: 'Available Equipment',
      equipmentOptions: ['Barbell + Plates', 'Dumbbells', 'Gym Machines', 'TRX', 'Jump Rope', 'No Equipment'],
      trainingDays: 'Training Days Per Week',
      injuries: 'Injuries / Health Issues', injuriesPh: 'e.g. knee pain, blood pressure...',
      dietary: 'Dietary Preferences / Restrictions', dietaryPh: 'e.g. vegetarian, no nuts...',
      notes: 'Additional Notes', notesPh: 'Any info for your coach...',
      next: 'Next', back: 'Back', submit: 'Send to Coach', sending: 'Sending...',
      sentTitle: 'Sent Successfully! ✅', sentMsg: 'Your details have been sent to your coach. They will reach out shortly.',
      errorMsg: 'Something went wrong. Please try again or contact your coach directly.',
      bmiLabel: 'BMI', calories: 'Calories', protein: 'Protein', carbs: 'Carbs', fat: 'Fat',
      livePreview: 'Live Preview', healthTitle: 'Health Issues & Restrictions',
    }
  };
  const c = t[lang];
  const isRtl = lang === 'ar';

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: lang === 'ar' ? 'نحيف' : 'Underweight', color: 'text-blue-400' };
    if (bmi < 25) return { label: lang === 'ar' ? 'طبيعي ✓' : 'Normal ✓', color: 'text-green-400' };
    if (bmi < 30) return { label: lang === 'ar' ? 'زيادة وزن' : 'Overweight', color: 'text-yellow-400' };
    return { label: lang === 'ar' ? 'سمنة' : 'Obese', color: 'text-red-400' };
  };

  if (status === 'sent') return (
    <section className="py-24 bg-[#050505]" id="intake-form">
      <div className="container mx-auto px-4 max-w-2xl">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20 px-8 bg-[#111] rounded-3xl border border-[#FF5500]/20">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}>
            <CheckCircle className="w-20 h-20 text-[#FF5500] mx-auto mb-6" />
          </motion.div>
          <h3 className="text-3xl font-black text-white mb-4">{c.sentTitle}</h3>
          <p className="text-gray-400 font-medium text-lg">{c.sentMsg}</p>
        </motion.div>
      </div>
    </section>
  );

  return (
    <section className="py-24 relative bg-[#050505] overflow-hidden" id="intake-form">
      <div className={`container mx-auto px-4 max-w-3xl relative z-10 ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="text-center mb-10">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">{c.title}</h2>
          <p className="text-gray-400 font-medium text-lg">{c.subtitle}</p>
        </motion.div>

        {/* Step progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {STEPS.map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-black text-sm border-2 transition-all duration-300 ${i < step ? 'bg-[#FF5500] border-[#FF5500] text-white' :
                  i === step ? 'border-[#FF5500] text-[#FF5500] bg-transparent' :
                    'border-white/20 text-white/30 bg-transparent'
                }`}>{i < step ? '✓' : i + 1}</div>
              <span className={`text-xs font-bold hidden sm:block transition-colors ${i === step ? 'text-white' : 'text-white/30'}`}>{c.steps[i]}</span>
              {i < STEPS.length - 1 && <div className={`w-8 h-[2px] rounded-full transition-colors ${i < step ? 'bg-[#FF5500]' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <AnimatePresence mode="wait">

            {/* ── Step 0: Personal ── */}
            {step === 0 && (
              <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}
                className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FF5500]/15 flex items-center justify-center"><User className="w-4 h-4 text-[#FF5500]" /></div>
                  <h3 className="text-white font-black text-lg">{c.steps[0]}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div><label className={labelClass}>{c.name}</label><input type="text" required placeholder={c.namePh} value={form.name} onChange={set('name')} className={inputClass} /></div>
                  <div><label className={labelClass}>{c.age}</label><input type="number" required min="10" max="80" placeholder={c.agePh} value={form.age} onChange={set('age')} className={inputClass} /></div>
                  <div><label className={labelClass}>{c.email}</label><input type="email" placeholder={c.emailPh} value={form.email} onChange={set('email')} className={inputClass} /></div>
                  <div><label className={labelClass}>{c.phone}</label><input type="tel" required placeholder={c.phonePh} value={form.phone} onChange={set('phone')} className={inputClass} /></div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>{c.gender}</label>
                    <div className="flex gap-4">
                      {(['male', 'female'] as const).map(g => (
                        <button type="button" key={g} onClick={() => setForm(p => ({ ...p, gender: g }))}
                          className={`flex-1 py-3 rounded-xl font-bold border transition-all duration-300 ${form.gender === g ? 'bg-[#FF5500] border-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.3)]' : 'bg-[#0d0d0d] border-white/10 text-white/50 hover:border-white/20'}`}>
                          {g === 'male' ? c.male : c.female}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Body ── */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}
                className="space-y-6">
                <div className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FF5500]/15 flex items-center justify-center"><Activity className="w-4 h-4 text-[#FF5500]" /></div>
                    <h3 className="text-white font-black text-lg">{c.steps[1]}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div><label className={labelClass}>{c.weight}</label><input type="number" required min="30" max="300" placeholder={c.weightPh} value={form.weight} onChange={set('weight')} className={inputClass} /></div>
                    <div><label className={labelClass}>{c.height}</label><input type="number" required min="100" max="250" placeholder={c.heightPh} value={form.height} onChange={set('height')} className={inputClass} /></div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>{c.activity}</label>
                      <div className="relative">
                        <select required value={form.activity} onChange={set('activity')} className={selectClass}>
                          {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as ActivityLevel[]).map((a, i) => (
                            <option key={a} value={a}>{c.activities[i]}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className={labelClass}>{c.activityDetails}</label>
                      <textarea required placeholder={c.activityDetailsPh} value={form.activityDetails} onChange={set('activityDetails')} rows={2} className={`${inputClass} resize-none`} />
                    </div>
                  </div>
                </div>

                {/* Goal */}
                <div className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 md:p-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FF5500]/15 flex items-center justify-center"><Target className="w-4 h-4 text-[#FF5500]" /></div>
                    <h3 className="text-white font-black text-lg">{c.goal}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {(['lose', 'maintain', 'gain'] as Goal[]).map((g, i) => (
                      <button type="button" key={g} onClick={() => setForm(p => ({ ...p, goal: g }))}
                        className={`py-3 px-2 rounded-xl font-bold text-sm border transition-all duration-300 ${form.goal === g ? 'bg-[#FF5500] border-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.3)]' : 'bg-[#111] border-white/10 text-white/50 hover:border-white/20'}`}>
                        {c.goals[i]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live BMI Preview */}
                {macros && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-[#0d0d0d] border border-[#FF5500]/20 rounded-3xl p-6 space-y-4">
                    <p className="text-[#FF5500] font-black text-sm uppercase tracking-widest">{c.livePreview}</p>
                    {/* BMI */}
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 font-bold text-sm">{c.bmiLabel}</span>
                      <span className={`font-black text-xl ${getBmiCategory(macros.bmi).color}`}>
                        {macros.bmi} <span className="text-sm font-bold">{getBmiCategory(macros.bmi).label}</span>
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Step 2: Training & Health ── */}
            {step === 2 && (
              <>
                <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}
                  className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FF5500]/15 flex items-center justify-center"><Dumbbell className="w-4 h-4 text-[#FF5500]" /></div>
                    <h3 className="text-white font-black text-lg">{c.steps[2]}</h3>
                  </div>

                  {/* Fitness Level */}
                  <div>
                    <label className={labelClass}>{c.fitnessLevel}</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['beginner', 'intermediate', 'advanced'] as FitnessLevel[]).map((lvl, i) => (
                        <button type="button" key={lvl} onClick={() => setForm(p => ({ ...p, fitnessLevel: lvl }))}
                          className={`py-3 rounded-xl font-bold text-sm border transition-all duration-300 ${form.fitnessLevel === lvl ? 'bg-[#FF5500] border-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.3)]' : 'bg-[#111] border-white/10 text-white/50 hover:border-white/20'}`}>
                          {c.fitnessLevels[i]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Training Location */}
                  <div>
                    <label className={labelClass}>{c.trainingLocation}</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['gym', 'home', 'both'] as TrainingLocation[]).map((loc, i) => (
                        <button type="button" key={loc} onClick={() => setForm(p => ({ ...p, trainingLocation: loc }))}
                          className={`py-3 rounded-xl font-bold text-sm border transition-all duration-300 ${form.trainingLocation === loc ? 'bg-[#FF5500] border-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.3)]' : 'bg-[#111] border-white/10 text-white/50 hover:border-white/20'}`}>
                          {c.trainingLocations[i]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Equipment */}
                  <div>
                    <label className={labelClass}>{c.equipment}</label>
                    <div className="flex flex-wrap gap-2">
                      {c.equipmentOptions.map((opt, i) => (
                        <button type="button" key={i} onClick={() => toggleEquipment(opt)}
                          className={`px-4 py-2 rounded-xl font-bold text-sm border transition-all duration-300 ${form.equipment.includes(opt) ? 'bg-[#FF5500] border-[#FF5500] text-white shadow-[0_0_10px_rgba(255,85,0,0.2)]' : 'bg-[#111] border-white/10 text-white/50 hover:border-white/20'}`}>
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Training Days */}
                  <div>
                    <label className={labelClass}>{c.trainingDays}</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5, 6, 7].map(d => (
                        <button type="button" key={d} onClick={() => setForm(p => ({ ...p, trainingDays: d }))}
                          className={`flex-1 py-3 rounded-xl font-black text-sm border transition-all duration-300 ${form.trainingDays === d ? 'bg-[#FF5500] border-[#FF5500] text-white shadow-[0_0_15px_rgba(255,85,0,0.3)]' : 'bg-[#111] border-white/10 text-white/50 hover:border-white/20'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className={labelClass}>{c.notes}</label>
                    <textarea placeholder={c.notesPh} value={form.notes} onChange={set('notes')} rows={3} className={`${inputClass} resize-none`} />
                  </div>
                </motion.div>

                {/* Health Issues Section */}
                <motion.div key="step2-health" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3, delay: 0.1 }}
                  className="bg-[#0d0d0d] border border-white/5 rounded-3xl p-6 md:p-8 space-y-6 mt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[#FF5500]/15 flex items-center justify-center"><HeartPulse className="w-4 h-4 text-[#FF5500]" /></div>
                    <h3 className="text-white font-black text-lg">{c.healthTitle}</h3>
                  </div>

                  {/* Injuries */}
                  <div>
                    <label className={labelClass}>{c.injuries}</label>
                    <textarea placeholder={c.injuriesPh} value={form.injuries} onChange={set('injuries')} rows={2} className={`${inputClass} resize-none`} />
                  </div>

                  {/* Dietary */}
                  <div>
                    <label className={labelClass}><Utensils className="inline w-4 h-4 mr-1 mb-1" />{c.dietary}</label>
                    <textarea placeholder={c.dietaryPh} value={form.dietary} onChange={set('dietary')} rows={2} className={`${inputClass} resize-none`} />
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex gap-4">
            {step > 0 && (
              <button type="button" onClick={() => setStep(s => s - 1)}
                className="flex-1 py-4 bg-white/5 border border-white/10 text-white font-black text-lg rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 hover:scale-[1.02] active:scale-95 transition-all">
                {isRtl ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
                {c.back}
              </button>
            )}

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={handleNext}
                className="flex-1 py-4 bg-[#FF5500] text-white font-black text-lg rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,85,0,0.2)] hover:shadow-[0_0_30px_rgba(255,85,0,0.35)] hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative">{c.next}</span>
                {isRtl ? <ChevronLeft className="w-5 h-5 relative" /> : <ChevronRight className="w-5 h-5 relative" />}
              </button>
            ) : (
              <button type="button" disabled={status === 'sending'} onClick={handleSubmit}
                className="flex-1 py-4 bg-[#FF5500] text-white font-black text-lg rounded-2xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,85,0,0.2)] hover:shadow-[0_0_30px_rgba(255,85,0,0.35)] hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group disabled:opacity-60 disabled:cursor-not-allowed">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <Send className="w-5 h-5 relative" />
                <span className="relative">{status === 'sending' ? c.sending : c.submit}</span>
              </button>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {validationError && (
              <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-red-500/10 border-2 border-red-500/50 p-4 rounded-xl text-center">
                <p className="text-red-400 font-bold text-lg">{validationError}</p>
              </motion.div>
            )}
            
            {status === 'error' && !validationError && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="text-red-400 text-sm font-bold text-center bg-red-500/10 border border-red-500/20 py-3 rounded-xl">
                {c.errorMsg}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
