import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Compass,
  Gauge,
  Sun,
  Eye,
  CloudRain,
} from 'lucide-react';

export default function WeatherCard({ weather = {}, cityName = '' }) {
  const {
    temperature = 24.5,
    feelsLike = 25.2,
    humidity = 55,
    windSpeed = 10.2,
    windDirection = 180,
    pressure = 1013,
    uvIndex = 4,
    weatherDesc = 'Mainly Clear',
  } = weather;

  // Convert wind degrees to cardinal direction
  const getCardinalDirection = (deg) => {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
    return directions[index];
  };

  const cardinal = getCardinalDirection(windDirection);

  return (
    <div className="p-6 sm:p-7 rounded-3xl glass-card border border-slate-200/90 dark:border-white/[0.1] shadow-2xl flex flex-col justify-between">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200/90 dark:border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans']">
            Meteorological Factors
          </h3>
        </div>
        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/[0.06] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent">
          {weatherDesc}
        </span>
      </div>

      {/* Hero Temperature + Compass */}
      <div className="grid grid-cols-2 gap-4 my-5 items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ambient Temp
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-slate-100 font-mono">
              {temperature}°
            </span>
            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">C</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Feels like {feelsLike}°C</p>
        </div>

        {/* Wind Vector Compass Widget */}
        <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06]">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-dashed border-emerald-500/40 animate-spin-slow"></div>
            {/* Needle */}
            <div
              className="w-8 h-8 flex items-center justify-center transition-transform duration-700"
              style={{ transform: `rotate(${windDirection}deg)` }}
            >
              <Compass className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
            </div>
          </div>
          <span className="text-xs font-bold text-slate-900 dark:text-slate-200 mt-1 font-mono">
            {windSpeed} km/h • {cardinal}
          </span>
        </div>
      </div>

      {/* 4 Micro Weather Factor Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm text-center">
          <div className="flex items-center justify-center text-cyan-500 dark:text-cyan-400 mb-1">
            <Droplets className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">Humidity</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{humidity}%</span>
        </div>

        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm text-center">
          <div className="flex items-center justify-center text-indigo-500 dark:text-indigo-400 mb-1">
            <Gauge className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">Pressure</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{pressure} hPa</span>
        </div>

        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm text-center">
          <div className="flex items-center justify-center text-amber-500 dark:text-amber-400 mb-1">
            <Sun className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">UV Index</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">{uvIndex} / 11</span>
        </div>

        <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 shadow-sm text-center">
          <div className="flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-1">
            <Eye className="w-4 h-4" />
          </div>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold block">Dispersion</span>
          <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {windSpeed > 15 ? 'High' : windSpeed > 7 ? 'Moderate' : 'Low/Stagnant'}
          </span>
        </div>
      </div>
    </div>
  );
}
