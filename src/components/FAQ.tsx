import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Language } from '../App';

interface FAQProps {
  lang: Language;
}

export default function FAQ({ lang }: FAQProps) {
  const [openId, setOpenId] = useState<number | null>(0);

  const content = {
    ar: {
      title: 'الاسئلة المتكررة',
      questions: [
        {
          id: 0,
          q: 'مين يقدر ينضم للبرنامج؟',
          a: 'أى حد يقدر ينضم، سواء كنت مبتدئ أو متقدم، احنا بنصمم البرامج لتناسب مستوى كل شخص وهدفه.'
        },
        {
          id: 1,
          q: 'ازاى اشترك؟',
          a: 'تقدر تشترك عن طريق اختيار الباقة المناسبة ليك من قسم باقات التدريب و الدفع عن طريق وسائل الدفع المتاحة.'
        },
        {
          id: 2,
          q: 'هل بتمرن بنات؟',
          a: 'أيوة، بنوفر برامج تدريب وتغذية مخصصة للبنات حسب أهدافهم.'
        },
        {
          id: 3,
          q: 'بستلم البرنامج فى قد اية؟',
          a: 'من يوم الى ٣ ايام كحد اقصى'
        },
        {
          id: 4,
          q: 'إيه سياسة الاسترجاع؟',
          a: 'لا يوجد سياسة استرجاع بعد استلام برامج التدريب نظراً لطبيعة الخدمة الرقمية.'
        },
        {
          id: 5,
          q: 'هل يوجد متابعة و فحوصات؟',
          a: 'أكيد، المتابعة بتختلف حسب الباقة اللى اخترتها، و بتوصل لمتابعة يومية فى الباقات المتقدمة.'
        },
        {
          id: 6,
          q: 'الاشتراك بيبدأ امتى؟',
          a: 'الاشتراك بيبدأ من تاريخ استلامك للبرامج مش من تاريخ الدفع.'
        },
        {
          id: 7,
          q: 'هل لازم أنشر تحول العميل؟',
          a: 'لا أبداً، الخصوصية تامة، نشر التحولات بيكون بموافقة شخصية منك فقط.'
        }
      ]
    },
    en: {
      title: 'Frequently Asked',
      questions: [
        {
          id: 0,
          q: 'Who can join the program?',
          a: 'Anyone can join. Whether a beginner or advanced, we tailor the programs to fit your level and goals.'
        },
        {
          id: 1,
          q: 'How do I subscribe?',
          a: 'You can subscribe by choosing the appropriate package from the Training Packages section and paying via the available methods.'
        },
        {
          id: 2,
          q: 'Do you train females?',
          a: 'Yes, we provide custom training and nutrition programs for females based on their goals.'
        },
        {
          id: 3,
          q: 'How long to receive the program?',
          a: 'From 1 to 3 days maximum.'
        },
        {
          id: 4,
          q: 'What is the refund policy?',
          a: 'There is no refund policy after receiving the training programs due to the nature of the digital service.'
        },
        {
          id: 5,
          q: 'Is there follow-up and check-ins?',
          a: 'Yes, the follow-up varies depending on your package, up to daily check-ins for advanced packages.'
        },
        {
          id: 6,
          q: 'When does the subscription start?',
          a: 'The subscription starts from the date you receive your programs, not the payment date.'
        },
        {
          id: 7,
          q: 'Must you publish my transformation?',
          a: 'Not at all. Absolute privacy is guaranteed, transformations are published only with your consent.'
        }
      ]
    }
  };

  const t = content[lang];

  return (
    <section className="py-24 relative bg-[#050505] min-h-screen flex items-center">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-6xl font-black mb-12 text-white text-glow">
            {t.title}
          </h2>
        </motion.div>

        <div className="space-y-6">
          {t.questions.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <motion.div 
                key={faq.id} 
                className="border-none w-full flex flex-col items-end"
                initial={false}
              >
                <button 
                  className="w-full text-end flex flex-row-reverse items-center justify-between focus:outline-none mb-2 group"
                  onClick={() => setOpenId(isOpen ? null : faq.id)}
                >
                  <span className="text-lg md:text-2xl font-bold text-white transition-colors group-hover:text-primary">
                    {faq.q}
                  </span>
                  <div className="text-white text-2xl w-8 h-8 flex items-center justify-center shrink-0 group-hover:text-primary transition-colors">
                    {isOpen ? '−' : '+'}
                  </div>
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div 
                      key="content"
                      initial="collapsed"
                      animate="open"
                      exit="collapsed"
                      variants={{
                        open: { opacity: 1, height: "auto", marginTop: 8 },
                        collapsed: { opacity: 0, height: 0, marginTop: 0 }
                      }}
                      transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
                      className="overflow-hidden w-full text-end"
                    >
                      <p className="text-primary font-bold text-base md:text-lg mb-4 mr-10 leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
