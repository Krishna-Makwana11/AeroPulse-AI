import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Calendar,
  Clock,
  Layers,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  CloudSun,
} from 'lucide-react';
import { getAQICategory } from '../services/aqiCalculator';

export default function TrendCharts({ hourlyData = [], dailyData = [], standard = 'US' }) {
  const [viewMode, setViewMode] = useState('24h'); // '24h' or '7d'
  const [showPollutants, setShowPollutants] = useState(false);

  // Custom Glassmorphic Tooltip for 24-Hour Forecast
  const CustomHourlyTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const category = getAQICategory(point.aqi, standard);

      return (
        <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 glass-card border border-slate-200 dark:border-white/[0.15] shadow-2xl space-y-2 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-1.5">
            <span className="text-xs font-bold text-slate-900 dark:text-slate-200">{point.time}</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${category.color}20`, color: category.color }}
            >
              {category.level}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Predicted AQI:</span>
            <span className="text-xl font-black font-mono" style={{ color: category.color }}>
              {point.aqi}
            </span>
          </div>

          {/* Meteorological synchronization indicators */}
          <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] grid grid-cols-3 gap-2 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
            <div className="flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-amber-500" />
              <span>{point.temp}°C</span>
            </div>
            <div className="flex items-center gap-1">
              <Droplets className="w-3 h-3 text-cyan-500" />
              <span>{point.humidity}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-3 h-3 text-emerald-500" />
              <span>{point.windSpeed} km/h</span>
            </div>
          </div>

          {showPollutants && (
            <div className="pt-1.5 border-t border-slate-200 dark:border-white/[0.06] space-y-1 text-[10px] font-mono">
              <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                <span>PM2.5:</span> <b>{point.pm25} µg/m³</b>
              </div>
              <div className="flex justify-between text-cyan-600 dark:text-cyan-400">
                <span>PM10:</span> <b>{point.pm10} µg/m³</b>
              </div>
              <div className="flex justify-between text-amber-600 dark:text-amber-400">
                <span>NO₂:</span> <b>{point.no2} µg/m³</b>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom Tooltip for 7-Day Outlook
  const CustomDailyTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      const category = getAQICategory(d.aqi, standard);

      return (
        <div className="p-3.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 glass-card border border-slate-200 dark:border-white/[0.15] shadow-2xl space-y-2 min-w-[190px]">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] pb-1.5">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-200">{d.day}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{d.date}</p>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${category.color}20`, color: category.color }}
            >
              {d.category}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Forecast AQI:</span>
            <span className="text-xl font-black font-mono" style={{ color: category.color }}>
              {d.aqi}
            </span>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300">
            <span>Temp Range:</span>
            <span className="font-mono">{d.minTemp}°C - {d.maxTemp}°C</span>
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
            🌤️ {d.weatherDesc}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section className="p-6 sm:p-7 rounded-3xl glass-card border border-slate-200/90 dark:border-white/[0.1] shadow-2xl">
      {/* Chart Header & Mode Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/90 dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans']">
              Prediction & Meteorological Trends
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Continuous spline interpolation correlating AQI trends with ambient humidity, temperature, and wind.
          </p>
        </div>

        {/* View Switchers */}
        <div className="flex items-center gap-2 flex-wrap">
          {viewMode === '24h' && (
            <button
              onClick={() => setShowPollutants(!showPollutants)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                showPollutants
                  ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/40 shadow-sm'
                  : 'bg-slate-100 dark:bg-white/[0.03] text-slate-700 dark:text-slate-400 border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pollutants Overlay</span>
            </button>
          )}

          <div className="flex items-center p-1 rounded-xl glass-panel border border-slate-200/90 dark:border-white/[0.08] text-xs font-semibold shadow-sm">
            <button
              onClick={() => setViewMode('24h')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === '24h'
                  ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>24-Hour</span>
            </button>
            <button
              onClick={() => setViewMode('7d')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === '7d'
                  ? 'bg-emerald-500 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>7-Day Outlook</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="h-72 sm:h-80 w-full mt-6">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === '24h' ? (
            <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="pm25Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="no2Grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              
              <XAxis
                dataKey="time"
                stroke="#6e7681"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              
              <YAxis
                stroke="#6e7681"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 'auto']}
              />

              <Tooltip content={<CustomHourlyTooltip />} />

              <Area
                type="monotone"
                dataKey="aqi"
                name="AQI Score"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#aqiAreaGrad)"
                activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
              />

              {showPollutants && (
                <>
                  <Area
                    type="monotone"
                    dataKey="pm25"
                    name="PM2.5 (µg/m³)"
                    stroke="#06b6d4"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#pm25Grad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="no2"
                    name="NO2 (µg/m³)"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#no2Grad)"
                  />
                </>
              )}
            </AreaChart>
          ) : (
            <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              
              <XAxis
                dataKey="day"
                stroke="#6e7681"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              
              <YAxis
                stroke="#6e7681"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                domain={[0, 'auto']}
              />

              <Tooltip content={<CustomDailyTooltip />} />

              <Bar
                dataKey="aqi"
                name="Forecast AQI"
                radius={[8, 8, 0, 0]}
                fill="#10b981"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Synchronized Micro-Climate Factor Legend */}
      <div className="mt-4 pt-4 border-t border-slate-200/90 dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-4 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-slate-700 dark:text-slate-300">Predicted AQI Curve</span>
          </span>
          {showPollutants && (
            <>
              <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
                <span>PM2.5</span>
              </span>
              <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>NO₂</span>
              </span>
            </>
          )}
        </div>

        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          Hover over data points to inspect temperature, humidity & wind factors
        </span>
      </div>
    </section>
  );
}
