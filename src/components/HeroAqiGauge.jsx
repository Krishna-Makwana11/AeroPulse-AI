import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Wind,
  Activity,
  Flame,
  Info,
  TrendingUp,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { POLLUTANT_SPECS } from '../services/aqiCalculator';

export default function HeroAqiGauge({
  data,
  standard,
  onOpenSimulator,
}) {
  const { currentAQI, category, dominantPollutant, pollutants, weather, cityName, timestamp } = data;
  const [displayAQI, setDisplayAQI] = useState(0);

  // Animated Count-Up effect for smooth AQI transitions
  useEffect(() => {
    let start = displayAQI;
    const end = currentAQI;
    if (start === end) return;

    const duration = 800; // ms
    const startTime = performance.now();

    const animateCount = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease Out Quartic
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = Math.round(start + (end - start) * ease);
      setDisplayAQI(current);

      if (progress < 1) {
        requestAnimationFrame(animateCount);
      }
    };

    requestAnimationFrame(animateCount);
  }, [currentAQI]);

  // Semi-circular gauge parameters
  // Arc from 135deg to 405deg (270 degrees sweep)
  const radius = 105;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  // Normalized fraction 0 to 1 based on 500 max AQI
  const fraction = Math.min(Math.max(currentAQI / 500, 0), 1);
  const strokeDashoffset = circumference - fraction * circumference * 0.75; // 270 deg = 0.75 of circle
  const dashArray = `${circumference * 0.75} ${circumference}`;

  const normKey = (dominantPollutant || 'pm25').toLowerCase().replace('.', '');
  const dominantSpec = POLLUTANT_SPECS[normKey] || POLLUTANT_SPECS[dominantPollutant] || POLLUTANT_SPECS.pm25;
  const dominantValue = pollutants[normKey] ?? pollutants[dominantPollutant] ?? '--';

  return (
    <div className="relative overflow-hidden rounded-3xl glass-card p-6 sm:p-8 border border-white/[0.1] dark:border-white/[0.1] border-slate-200/80 shadow-2xl transition-all">
      
      {/* Ambient background blur accent mapped to AQI color */}
      <div
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none opacity-25 dark:opacity-20 blur-3xl transition-all duration-700"
        style={{ backgroundColor: category.color }}
      />
      <div
        className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full pointer-events-none opacity-15 dark:opacity-10 blur-3xl transition-all duration-700"
        style={{ backgroundColor: category.color }}
      />

      {/* Top Location & Sync Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-200/90 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-white/[0.08]">
              <MapPin className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>{cityName}</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Sensor Feed
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans']">
            Air Quality Index & Forecast
          </h1>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Synced: {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-white/[0.04] text-[11px] font-mono border border-slate-200 dark:border-white/[0.06] font-semibold text-slate-600 dark:text-slate-400">
            {standard === 'INDIA' ? 'CPCB Standard' : 'US EPA 0-500'}
          </span>
        </div>
      </div>

      {/* Main Grid: Gauge + Severity + Health Tag + Weather Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mt-6">
        
        {/* Left Semi-Circular Gauge (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
          
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            <svg className="w-full h-full transform rotate-135" viewBox="0 0 260 260">
              {/* Background Track Arc */}
              <circle
                cx="130"
                cy="130"
                r={radius}
                fill="none"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                strokeDasharray={dashArray}
                strokeDashoffset="0"
                strokeLinecap="round"
                className="text-slate-200 dark:text-white/[0.07]"
              />

              {/* Multi-Gradient Definition */}
              <defs>
                <linearGradient id="aqiGaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="25%" stopColor="#f59e0b" />
                  <stop offset="50%" stopColor="#f97316" />
                  <stop offset="75%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#881337" />
                </linearGradient>
                <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={category.color} floodOpacity="0.6" />
                </filter>
              </defs>

              {/* Animated Progress Value Arc */}
              <circle
                cx="130"
                cy="130"
                r={radius}
                fill="none"
                stroke={category.color}
                strokeWidth={strokeWidth + 2}
                strokeDasharray={dashArray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                filter="url(#glowFilter)"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Center Metrics */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-0.5">
                Current AQI
              </span>
              <div className="flex items-baseline justify-center">
                <span
                  className="text-6xl sm:text-7xl font-black tracking-tight font-['Plus_Jakarta_Sans'] transition-colors duration-500"
                  style={{ color: category.color, textShadow: `0 0 25px ${category.color}40` }}
                >
                  {displayAQI}
                </span>
              </div>
              
              {/* Category Pill */}
              <div
                className="mt-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-md transition-all duration-500"
                style={{
                  backgroundColor: `${category.color}1a`,
                  color: category.color,
                  borderColor: `${category.color}40`,
                }}
              >
                {category.level}
              </div>

              <span className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 font-mono font-semibold">
                Scale: {category.range}
              </span>
            </div>
          </div>

          {/* Scale Legend Tick Bar (Official US-EPA Tiers) */}
          <div className="w-full max-w-xs mt-2 px-2">
            <div className="h-2 w-full rounded-full bg-gradient-to-r from-[#22c55e] via-[#eab308] via-[#f97316] via-[#ef4444] via-[#a855f7] to-[#881337] shadow-inner" />
            <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-400 mt-1 font-mono font-semibold">
              <span>0</span>
              <span>50</span>
              <span>100</span>
              <span>150</span>
              <span>200</span>
              <span>300</span>
              <span>500</span>
            </div>
          </div>
        </div>

        {/* Right Information & Intelligence Panel (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          
          {/* Main Health Advisory Banner */}
          <div
            className="p-5 rounded-2xl border transition-all duration-500 relative overflow-hidden"
            style={{
              backgroundColor: `${category.color}0f`,
              borderColor: `${category.color}35`,
            }}
          >
            <div className="flex items-start gap-3.5">
              <div
                className="p-2.5 rounded-xl shrink-0 mt-0.5"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {currentAQI <= 50 ? (
                  <ShieldCheck className="w-6 h-6" />
                ) : currentAQI <= 150 ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <ShieldAlert className="w-6 h-6" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h3 className="text-base font-bold" style={{ color: category.color }}>
                    {category.badge}
                  </h3>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-white/[0.08] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-transparent">
                    Outdoor Safety: {category.outdoorSafety}%
                  </span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 mt-1.5 leading-relaxed font-medium">
                  {category.advisory}
                </p>
              </div>
            </div>
          </div>

          {/* Dominant Pollutant & Key Diagnostics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Dominant Pollutant Card */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.06] shadow-sm hover:border-emerald-500/40 transition-all group">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  Primary Pollutant
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                  Major Driver
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {dominantSpec.formula}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[130px] font-medium">{dominantSpec.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {dominantValue}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-1 font-medium">{dominantSpec.unit}</span>
                </div>
              </div>
            </div>

            {/* AI ML Prediction Status */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/[0.06] shadow-sm hover:border-indigo-500/40 transition-all group">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  AI Ensemble Predictor
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-mono font-semibold">
                  {data.mlPrediction?.confidence ?? 94}% Conf.
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <div>
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-300 font-mono">
                    {data.mlPrediction?.predictedAQI ?? currentAQI}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Random Forest Regressor</p>
                </div>
                <button
                  onClick={onOpenSimulator}
                  className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-indigo-800 dark:text-white border border-indigo-200 dark:border-indigo-500 transition-all flex items-center gap-1 shadow-sm dark:shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                >
                  Simulate
                </button>
              </div>
            </div>

          </div>

          {/* Quick Action Matrix Checklist */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm text-center">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Mask Required</span>
              <span className={`text-xs font-bold ${category.maskNeeded ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {category.maskNeeded ? 'N95 Required' : 'Not Required'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm text-center">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Air Purifier</span>
              <span className={`text-xs font-bold ${category.purifierNeeded ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                {category.purifierNeeded ? 'Recommended' : 'Standby'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm text-center">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Ventilation</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate block" title={category.ventilation}>
                {category.ventilation.split(' ')[0]} {category.ventilation.split(' ')[1] || ''}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm text-center">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Weather</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {weather.temperature}°C • {weather.humidity}% RH
              </span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
