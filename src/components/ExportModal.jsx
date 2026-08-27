import React, { useState } from 'react';
import {
  Download,
  Printer,
  Copy,
  Check,
  X,
  FileText,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

export default function ExportModal({ data, standard, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !data) return null;

  const { cityName, currentAQI, category, dominantPollutant, pollutants, weather, timestamp, mlPrediction } = data;

  const handleCopySummary = () => {
    const summaryText = `🌍 AeroPulse AI Report for ${cityName}
📅 Generated: ${new Date(timestamp).toLocaleString()}
📊 Air Quality Index: ${currentAQI} (${category.level} - ${standard === 'INDIA' ? 'CPCB Standard' : 'US EPA'})
🛡️ Health Impact: ${category.badge}
💨 Dominant Pollutant: ${dominantPollutant.toUpperCase()} (${pollutants[dominantPollutant]} µg/m³)
🌡️ Meteorological Context: ${weather.temperature}°C, ${weather.humidity}% Humidity, ${weather.windSpeed} km/h Wind
🔬 ML AI Predicted AQI: ${mlPrediction?.predictedAQI} (${mlPrediction?.confidence}% Model Confidence)
💡 Recommendation: ${category.advisory}`;

    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `AeroPulse_${cityName.replace(/\s+/g, '_')}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl my-8 rounded-3xl bg-white dark:bg-slate-900 glass-card p-6 sm:p-8 border border-slate-200 dark:border-white/[0.15] shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200/90 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans']">
                Export Environmental Health Audit
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Official atmospheric intelligence summary report for {cityName}.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Report Preview Body */}
        <div className="my-6 p-5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-4 text-xs">
          
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/[0.06] pb-3">
            <div>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">{cityName}</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">Time: {new Date(timestamp).toLocaleString()}</p>
            </div>
            <div className="text-right">
              <span
                className="px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm"
                style={{ backgroundColor: `${category.color}20`, color: category.color }}
              >
                {currentAQI} AQI • {category.level}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/5 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">PM2.5</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{pollutants.pm25} µg/m³</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/5 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">PM10</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{pollutants.pm10} µg/m³</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/5 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">NO2</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{pollutants.no2} µg/m³</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/5 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">CO</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{pollutants.co} mg/m³</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/5 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">SO2</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{pollutants.so2} µg/m³</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200/80 dark:border-white/5 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-semibold">O3</span>
              <span className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">{pollutants.o3} µg/m³</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-300 font-medium">
            <b className="font-bold">Health Recommendation:</b> {category.advisory}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleCopySummary}
            className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-white/[0.08] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-600 dark:text-slate-300" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Summary'}</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-white/[0.08] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            <span>Download JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
}
