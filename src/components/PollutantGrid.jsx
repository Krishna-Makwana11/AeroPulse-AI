import React, { useState } from 'react';
import {
  Activity,
  Flame,
  Wind,
  Layers,
  Zap,
  HelpCircle,
  X,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { POLLUTANT_SPECS, calculateSubIndex, getAQICategory } from '../services/aqiCalculator';

export default function PollutantGrid({ pollutants, subIndices = {}, standard = 'US' }) {
  const [selectedPollutant, setSelectedPollutant] = useState(null);

  const pollutantList = [
    { key: 'pm25', icon: Activity, color: '#10b981' },
    { key: 'pm10', icon: Layers, color: '#06b6d4' },
    { key: 'no2', icon: Zap, color: '#f59e0b' },
    { key: 'so2', icon: Flame, color: '#f97316' },
    { key: 'co', icon: Wind, color: '#ef4444' },
    { key: 'o3', icon: Activity, color: '#8b5cf6' },
  ];

  return (
    <section className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans'] flex items-center gap-2">
            <span>Air Pollutant Breakdown</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent">
              6 Real-time Metrics
            </span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Real-time concentration monitoring against WHO guidelines and national air quality sub-indices.
          </p>
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 font-medium">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Safe
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span> Moderate
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500"></span> Hazardous
        </div>
      </div>

      {/* 6 Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pollutantList.map(({ key, icon: Icon }) => {
          const spec = POLLUTANT_SPECS[key];
          const val = pollutants[key] ?? 0;
          const subIndex = subIndices[key] ?? Math.round(val * 1.2);
          const category = getAQICategory(subIndex, standard);

          // Calculate percentage for progress bar based on max limit
          const percent = Math.min(Math.round((val / spec.maxGaugeLimit) * 100), 100);
          const whoRatio = Math.round((val / spec.whoSafeLimit) * 10) / 10;
          const isWhoExceeded = whoRatio > 1.0;

          return (
            <div
              key={key}
              onClick={() => setSelectedPollutant({ key, ...spec, val, subIndex, category, whoRatio })}
              className="p-5 rounded-2xl glass-card relative overflow-hidden group cursor-pointer hover:-translate-y-1 hover:border-emerald-500/40 transition-all duration-300"
            >
              {/* Top Row: Icon + Formula + SubIndex Pill */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors font-mono">
                      {spec.formula}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[130px] font-medium">{spec.name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className="text-xs font-mono font-bold px-2 py-0.5 rounded-full border shadow-sm"
                    style={{
                      backgroundColor: `${category.color}15`,
                      color: category.color,
                      borderColor: `${category.color}40`,
                    }}
                  >
                    AQI {subIndex}
                  </span>
                </div>
              </div>

              {/* Middle Row: Big Concentration Value */}
              <div className="mt-4 flex items-baseline justify-between">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight">
                    {val}
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{spec.unit}</span>
                </div>
                <div className="text-right">
                  <span
                    className={`text-[11px] font-bold flex items-center gap-1 ${
                      isWhoExceeded ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isWhoExceeded ? `${whoRatio}x WHO Limit` : 'WHO Safe'}
                  </span>
                </div>
              </div>

              {/* Progress Bar with Safe Band */}
              <div className="mt-3">
                <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-white/[0.06] overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: category.color,
                    }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 mt-1 font-mono font-semibold">
                  <span>0 {spec.unit}</span>
                  <span>WHO: {spec.whoSafeLimit}</span>
                  <span>Max: {spec.maxGaugeLimit}</span>
                </div>
              </div>

              {/* Click for detail cue */}
              <div className="mt-3 pt-2.5 border-t border-slate-200/90 dark:border-white/[0.04] flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 font-medium">
                <span className="flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-slate-500" />
                  Health Impact & Sources
                </span>
                <span className="text-[10px] font-mono uppercase text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-bold">
                  Inspect →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pollutant Detail Modal */}
      {selectedPollutant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 glass-card p-6 sm:p-7 border border-slate-200 dark:border-white/[0.15] shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => setSelectedPollutant(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div
                className="p-3 rounded-2xl border"
                style={{
                  backgroundColor: `${selectedPollutant.category.color}20`,
                  borderColor: `${selectedPollutant.category.color}40`,
                  color: selectedPollutant.category.color,
                }}
              >
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {selectedPollutant.formula} ({selectedPollutant.name})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Chemical Deep Dive & Exposure Profile</p>
              </div>
            </div>

            {/* Current Metrics Stats */}
            <div className="grid grid-cols-3 gap-3 my-5 p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] text-center">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">Concentration</span>
                <span className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono">
                  {selectedPollutant.val} {selectedPollutant.unit}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">Sub-Index</span>
                <span className="text-lg font-bold font-mono" style={{ color: selectedPollutant.category.color }}>
                  AQI {selectedPollutant.subIndex}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">WHO Guide</span>
                <span className="text-lg font-bold text-slate-700 dark:text-slate-300 font-mono">
                  {selectedPollutant.whoSafeLimit} {selectedPollutant.unit}
                </span>
              </div>
            </div>

            {/* Description & Sources */}
            <div className="space-y-3.5 text-sm">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 mb-1">
                  What is {selectedPollutant.formula}?
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                  {selectedPollutant.desc}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300 mb-1">
                  Primary Emission Sources
                </h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                  {selectedPollutant.sources}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500 dark:text-amber-400" />
                <p>
                  <b>Health Mitigation:</b> When {selectedPollutant.formula} exceeds WHO thresholds, minimize outdoor cardiovascular exercises and utilize certified HEPA air filters indoors.
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedPollutant(null)}
              className="mt-6 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 transition-all"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
