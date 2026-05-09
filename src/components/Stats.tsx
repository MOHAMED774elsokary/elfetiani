import { Users, Award, Heart } from 'lucide-react';
import type { Language } from '../App';

interface StatsProps {
  lang: Language;
}

export default function Stats({ lang }: StatsProps) {
  const stats = [
    {
      id: 1,
      icon: <Award className="w-8 h-8 text-primary" />,
      value: '5+',
      label: { ar: 'سنوات خبرة', en: 'Years Experience' }
    },
    {
      id: 2,
      icon: <Users className="w-8 h-8 text-primary" />,
      value: '1,000+',
      label: { ar: 'متدرب حقق هدفه', en: 'Clients Transformed' }
    },
    {
      id: 3,
      icon: <Heart className="w-8 h-8 text-primary" />,
      value: '50,000+',
      label: { ar: 'متابع', en: 'Followers' }
    }
  ];

  return (
    <section className="py-12 relative z-20 -mt-10 md:-mt-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="glass-card rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse border-white/10">
            {stats.map((stat) => (
              <div key={stat.id} className="flex gap-6 items-center justify-center p-4">
                <div className="p-4 bg-primary/10 rounded-2xl">
                  {stat.icon}
                </div>
                <div>
                  <h3 className="text-4xl font-black text-white">{stat.value}</h3>
                  <p className="text-gray-400 font-medium">{stat.label[lang]}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
