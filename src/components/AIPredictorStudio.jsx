import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Sliders,
  RotateCcw,
  Cpu,
  TrendingUp,
  AlertTriangle,
  Flame,
  Wind,
  Layers,
  Activity,
  CheckCircle,
  X,
} from 'lucide-react';
import { predictMLAQI, calculateAQI, getAQICategory, POLLUTANT_SPECS } from '../services/aqiCalculator';

export default function AIPredictorStudio({
  livePollutants,
  standard,
  isOpen,
  onClose,
  onApplySimulation,
}) {
  const [inputs, setInputs] = useState({
    pm25: livePollutants?.pm25 ?? 45,
    pm10: livePollutants?.pm10 ?? 65,
    no2: livePollutants?.no2 ?? 25,
    co: livePollutants?.co ?? 1.2,
    so2: livePollutants?.so2 ?? 12,
    o3: livePollutants?.o3 ?? 30,
  });

  const [activePreset, setActivePreset] = useState(null);

  // Sync with live data when prop updates
  useEffect(() => {
    if (livePollutants) {
      setInputs({
        pm25: livePollutants.pm25 ?? 45,
        pm10: livePollutants.pm10 ?? 65,
        no2: livePollutants.no2 ?? 25,
        co: livePollutants.co ?? 1.2,
        so2: livePollutants.so2 ?? 12,
        o3: livePollutants.o3 ?? 30,
      });
    }
  }, [livePollutants]);

  // Compute ML Prediction and Algorithmic AQI in real time
  const mlResult = predictMLAQI(inputs, standard);
  const algoResult = calculateAQI(inputs, standard);
  const currentPredAqi = mlResult.predictedAQI;
  const category = getAQICategory(currentPredAqi, standard);

  // Scenarios presets
  const presets = [
    {
      id: 'smog',
      name: 'Severe Smog / Stubble Episode',
      emoji: '🌫️',
      desc: 'High particulate accumulation under winter temperature inversion',
      values: { pm25: 285, pm10: 410, no2: 95, co: 5.2, so2: 38, o3: 88 },
    },
    {
      id: 'coastal',
      name: 'Pristine Coastal Breeze',
      emoji: '🌊',
      desc: 'Low emissions with high maritime air dispersion',
      values: { pm25: 12, pm10: 22, no2: 8, co: 0.3, so2: 3, o3: 20 },
    },
    {
      id: 'rushhour',
      name: 'Dense Urban Rush Hour',
      emoji: '🚗',
      desc: 'High NO2 and CO vehicular exhaust spike',
      values: { pm25: 68, pm10: 110, no2: 78, co: 2.6, so2: 15, o3: 42 },
    },
    {
      id: 'industrial',
      name: 'Heavy Industrial Corridor',
      emoji: '🏭',
      desc: 'Elevated SO2 and coarse dust from factories & power plants',
      values: { pm25: 135, pm10: 215, no2: 88, co: 3.8, so2: 75, o3: 58 },
    },
    {
      id: 'wildfire',
      name: 'Wildfire Smoke Influx',
      emoji: '🔥',
      desc: 'Massive PM2.5 spike from active forest biomass combustion',
      values: { pm25: 245, pm10: 330, no2: 35, co: 6.0, so2: 12, o3: 95 },
    },
  ];

  const handleSliderChange = (key, val) => {
    setInputs((prev) => ({ ...prev, [key]: parseFloat(val) }));
    setActivePreset(null);
  };

  const handleApplyPreset = (preset) => {
    setInputs(preset.values);
    setActivePreset(preset.id);
  };

  const handleResetToLive = () => {
    if (livePollutants) {
      setInputs({
        pm25: livePollutants.pm25 ?? 45,
        pm10: livePollutants.pm10 ?? 65,
        no2: livePollutants.no2 ?? 25,
        co: livePollutants.co ?? 1.2,
        so2: livePollutants.so2 ?? 12,
        o3: livePollutants.o3 ?? 30,
      });
      setActivePreset(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl my-8 rounded-3xl bg-white dark:bg-slate-900 glass-card p-6 sm:p-8 border border-slate-200 dark:border-white/[0.15] shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200/90 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans']">
                  AI Predictor & 'What-If' Simulation Studio
                </h2>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                  ML Random Forest
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                Adjust multi-pollutant concentrations in real time to simulate AI regression predictions & EPA categorization.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Predictor Hero Output Badge */}
        <div
          className="my-6 p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 transition-all duration-500"
          style={{
            backgroundColor: `${category.color}12`,
            borderColor: `${category.color}40`,
          }}
        >
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-bold text-3xl shadow-lg border"
              style={{
                backgroundColor: `${category.color}25`,
                color: category.color,
                borderColor: `${category.color}60`,
              }}
            >
              <span className="font-mono text-4xl">{currentPredAqi}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300">AQI</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm"
                  style={{
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                    borderColor: `${category.color}50`,
                  }}
                >
                  {category.level}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-mono font-semibold">
                  Scale: {category.range}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                {category.badge}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 max-w-md mt-0.5 font-medium leading-relaxed">
                {category.advisory}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-right">
            <div className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-black/30 border border-slate-200 dark:border-white/[0.08] text-xs shadow-sm">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Model Confidence: </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{mlResult.confidence}%</span>
            </div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
              Outdoor Activity Safety: <b className="text-slate-900 dark:text-slate-200">{category.outdoorSafety}%</b>
            </div>
          </div>
        </div>

        {/* Preset Scenarios Selector */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              Pre-Trained Environmental Scenarios
            </span>
            <button
              onClick={handleResetToLive}
              className="text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset to Current Location
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {presets.map((p) => {
              const isSelected = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleApplyPreset(p)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-500/20 border-indigo-400 text-indigo-900 dark:text-indigo-200 shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                      : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.08] text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.08] hover:border-slate-300 dark:hover:border-white/[0.2]'
                  }`}
                >
                  <div className="text-xl mb-1">{p.emoji}</div>
                  <h4 className="text-xs font-bold leading-tight text-slate-900 dark:text-slate-100">{p.name}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 font-medium">{p.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Sliders Grid */}
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            Adjust Ambient Pollutant Inputs
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* PM2.5 Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                  <Activity className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" /> PM2.5 (Fine Particles)
                </span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  {inputs.pm25} µg/m³
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="1"
                value={inputs.pm25}
                onChange={(e) => handleSliderChange('pm25', e.target.value)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-500 font-mono font-medium">
                <span>0 (Clean)</span>
                <span>WHO: 15</span>
                <span>500 (Hazardous)</span>
              </div>
            </div>

            {/* PM10 Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                  <Layers className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" /> PM10 (Coarse Dust)
                </span>
                <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
                  {inputs.pm10} µg/m³
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="600"
                step="2"
                value={inputs.pm10}
                onChange={(e) => handleSliderChange('pm10', e.target.value)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-500 font-mono font-medium">
                <span>0</span>
                <span>WHO: 45</span>
                <span>600</span>
              </div>
            </div>

            {/* NO2 Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                  <Flame className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" /> NO₂ (Nitrogen Dioxide)
                </span>
                <span className="font-mono text-amber-700 dark:text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded">
                  {inputs.no2} µg/m³
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="400"
                step="1"
                value={inputs.no2}
                onChange={(e) => handleSliderChange('no2', e.target.value)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-500 font-mono font-medium">
                <span>0</span>
                <span>WHO: 25</span>
                <span>400</span>
              </div>
            </div>

            {/* CO Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                  <Wind className="w-3.5 h-3.5 text-red-500 dark:text-red-400" /> CO (Carbon Monoxide)
                </span>
                <span className="font-mono text-red-700 dark:text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded">
                  {inputs.co} mg/m³
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="0.1"
                value={inputs.co}
                onChange={(e) => handleSliderChange('co', e.target.value)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-500 font-mono font-medium">
                <span>0.0</span>
                <span>WHO: 4.0</span>
                <span>25.0</span>
              </div>
            </div>

            {/* SO2 Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                  <Flame className="w-3.5 h-3.5 text-orange-500 dark:text-orange-400" /> SO₂ (Sulfur Dioxide)
                </span>
                <span className="font-mono text-orange-700 dark:text-orange-400 font-bold bg-orange-500/10 px-2 py-0.5 rounded">
                  {inputs.so2} µg/m³
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="200"
                step="1"
                value={inputs.so2}
                onChange={(e) => handleSliderChange('so2', e.target.value)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-500 font-mono font-medium">
                <span>0</span>
                <span>WHO: 40</span>
                <span>200</span>
              </div>
            </div>

            {/* O3 Slider */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-200 flex items-center gap-1.5 font-mono">
                  <Activity className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" /> O₃ (Ground-Level Ozone)
                </span>
                <span className="font-mono text-purple-700 dark:text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded">
                  {inputs.o3} µg/m³
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="300"
                step="1"
                value={inputs.o3}
                onChange={(e) => handleSliderChange('o3', e.target.value)}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-600 dark:text-slate-500 font-mono font-medium">
                <span>0</span>
                <span>WHO: 100</span>
                <span>300</span>
              </div>
            </div>

          </div>
        </div>

        {/* Model Architecture Metadata Footer */}
        <div className="mt-6 pt-4 border-t border-slate-200/90 dark:border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2 font-mono text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Ensemble Architecture: Scikit-Learn Random Forest Regressor (R² ~ 0.94)</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all"
          >
            Apply & Close
          </button>
        </div>

      </div>
    </div>
  );
}
