import React from 'react';
import {
  HeartPulse,
  Baby,
  Users,
  Wind,
  ShieldAlert,
  ShieldCheck,
  Home,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  Smile,
} from 'lucide-react';

export default function HealthAdvisory({ category, aqi }) {
  const isGood = aqi <= 50;
  const isModerate = aqi > 50 && aqi <= 100;
  const isSensitive = aqi > 100 && aqi <= 150;
  const isUnhealthy = aqi > 150 && aqi <= 200;
  const isSevere = aqi > 200;

  const vulnerableGroups = [
    {
      id: 'children',
      icon: Baby,
      title: 'Infants & Children',
      risk: isSevere ? 'Critical Risk' : isUnhealthy ? 'High Risk' : isSensitive ? 'Moderate' : 'Low',
      riskColor: isSevere
        ? 'text-red-700 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20'
        : isUnhealthy
        ? 'text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/20'
        : 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
      action: isSevere
        ? 'Avoid all outdoor playground activities. Maintain indoor purified air.'
        : isUnhealthy
        ? 'Limit outdoor recess and sports activities to under 20 minutes.'
        : isSensitive
        ? 'Monitor children with mild allergies during extended outdoor play.'
        : 'Perfect conditions for school sports, outdoor parks, and play.',
    },
    {
      id: 'elderly',
      icon: Users,
      title: 'Elderly Citizens (65+)',
      risk: isSevere ? 'Severe Risk' : isUnhealthy ? 'Elevated' : isSensitive ? 'Moderate' : 'Safe',
      riskColor: isSevere
        ? 'text-red-700 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20'
        : isUnhealthy
        ? 'text-orange-700 bg-orange-100 border-orange-200 dark:text-orange-400 dark:bg-orange-500/10 dark:border-orange-500/20'
        : 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
      action: isSevere
        ? 'Stay strictly indoors. High fine particulate triggers cardiovascular stress.'
        : isUnhealthy
        ? 'Replace morning outdoor walks with indoor stretching or treadmill.'
        : isSensitive
        ? 'Take frequent rest intervals during outdoor gardening or walks.'
        : 'Safe for morning walks, gardening, and outdoor community events.',
    },
    {
      id: 'asthma',
      icon: HeartPulse,
      title: 'Asthma & Respiratory Patients',
      risk: isSevere ? 'Emergency Alert' : isUnhealthy ? 'High Trigger' : isSensitive ? 'Elevated Risk' : 'Low Trigger',
      riskColor: isSevere
        ? 'text-rose-700 bg-rose-100 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20'
        : isUnhealthy
        ? 'text-red-700 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20'
        : isSensitive
        ? 'text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20'
        : 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
      action: isSevere
        ? 'Keep rescue inhalers accessible at all times. Run HEPA filtration 24/7.'
        : isUnhealthy
        ? 'Wear certified N95 particulate mask if stepping outdoors. Avoid dusty roads.'
        : isSensitive
        ? 'Keep prescribed preventive medications handy; expect mild airway irritation.'
        : 'Airways clear. Normal outdoor respiration with zero environmental triggers.',
    },
    {
      id: 'athletes',
      icon: Activity,
      title: 'Athletes & Outdoor Workers',
      risk: isSevere ? 'Avoid Exertion' : isUnhealthy ? 'Reduce Intensity' : isSensitive ? 'Moderate' : 'Optimal',
      riskColor: isSevere
        ? 'text-red-700 bg-red-100 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20'
        : isUnhealthy
        ? 'text-amber-700 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20'
        : 'text-emerald-700 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20',
      action: isSevere
        ? 'High ventilation rate causes heavy particulate deposition. Shift training indoors.'
        : isUnhealthy
        ? 'Shift cardio and marathons to gym facilities or indoor sports arenas.'
        : isSensitive
        ? 'Opt for moderate pace workouts; avoid peak rush-hour highways.'
        : 'Ideal atmospheric conditions for marathon training, cycling, and soccer.',
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            <span>Health Recommendations & Precautions</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
            Personalized medical guidance and protective measures categorized by vulnerability tier.
          </p>
        </div>
      </div>

      {/* 4 Vulnerable Group Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {vulnerableGroups.map((group) => {
          const Icon = group.icon;
          return (
            <div
              key={group.id}
              className="p-5 rounded-2xl glass-card relative overflow-hidden group hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${group.riskColor}`}>
                    {group.risk}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5">
                  {group.title}
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {group.action}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/90 dark:border-white/[0.04] flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>Verified Health Guideline</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Protective Action Matrix */}
      <div className="p-5 sm:p-6 rounded-2xl glass-card border border-slate-200/90 dark:border-white/[0.08] grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Indoor Air Quality</h4>
            <p className="text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              {category.purifierNeeded
                ? 'High particulate load detected. Keep HEPA filtration units active at medium-to-high CADR.'
                : 'Indoor particulate levels are well within safe thresholds. Minimal filtration required.'}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Home className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Natural Ventilation</h4>
            <p className="text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              {category.ventilation}. Avoid opening windows facing busy highway corridors during peak traffic.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm">
          <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Personal Protective Gear</h4>
            <p className="text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              {category.maskNeeded
                ? 'N95 / FFP2 mask recommended for sensitive and healthy individuals during outdoor transit.'
                : 'No protective mask required. Ambient air is safe for unassisted outdoor breathing.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
