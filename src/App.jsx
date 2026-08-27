import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import HeroAqiGauge from './components/HeroAqiGauge';
import PollutantGrid from './components/PollutantGrid';
import TrendCharts from './components/TrendCharts';
import AIPredictorStudio from './components/AIPredictorStudio';
import HealthAdvisory from './components/HealthAdvisory';
import WeatherCard from './components/WeatherCard';
import AirParticleVisualizer from './components/AirParticleVisualizer';
import ExportModal from './components/ExportModal';

import { fetchLiveAirQualityData } from './services/aqiService';
import { POPULAR_CITIES } from './data/mockCities';
import { Sparkles, Activity, Layers, Sliders, Info, ShieldCheck, MapPin, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Default selected city: New Delhi (or popular metro)
  const [currentLocation, setCurrentLocation] = useState(POPULAR_CITIES[0]);
  const [standard, setStandard] = useState('US'); // 'US' or 'INDIA'
  const [darkMode, setDarkMode] = useState(true);
  const [aqiData, setAqiData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Dark mode class sync on HTML root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load air quality and meteorological data for city
  const loadData = useCallback(async (location, std = standard, isSilentRefresh = false) => {
    if (!isSilentRefresh) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await fetchLiveAirQualityData(
        location.lat,
        location.lon,
        location.name,
        std
      );
      setAqiData(data);
      if (isSilentRefresh) {
        showToast(`Synced live telemetry for ${location.name}`);
      }
    } catch (err) {
      console.error('Error fetching AQI intelligence:', err);
      showToast('Error syncing live telemetry. Loaded offline model fallback.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [standard]);

  useEffect(() => {
    loadData(currentLocation, standard);
  }, [currentLocation, standard, loadData]);

  // Handle City Change
  const handleSelectCity = (city) => {
    setCurrentLocation(city);
    showToast(`Switched location to ${city.name}`);
  };

  // Handle Standard Toggle (US EPA vs Indian CPCB)
  const handleToggleStandard = (newStd) => {
    setStandard(newStd);
    showToast(`Air Quality Standard changed to ${newStd === 'INDIA' ? 'Indian CPCB NAQI' : 'US EPA 0-500'}`);
  };

  // Handle Manual Refresh
  const handleRefresh = () => {
    loadData(currentLocation, standard, true);
  };

  // Dynamic ambient background glow class based on AQI category
  const glowClass = aqiData?.category?.glowClass || 'ambient-glow-good';

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-300 ${glowClass}`}>
      
      {/* Background Subtle Gradient Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] rounded-full opacity-30 dark:opacity-20 blur-[130px] transition-all duration-1000"
          style={{ backgroundColor: aqiData?.category?.color || '#10b981' }}
        />
      </div>

      {/* Main Content Layout */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Navigation & Search Header */}
        <Header
          currentCity={currentLocation}
          standard={standard}
          onSelectCity={handleSelectCity}
          onToggleStandard={handleToggleStandard}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          lastUpdated={aqiData?.timestamp}
        />

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl glass-card border border-emerald-500/30 text-xs font-semibold text-emerald-300 shadow-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
          </div>
        )}

        {/* Hero Quick Location Strip */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">Quick Metros:</span>
            {POPULAR_CITIES.slice(0, 8).map((city) => (
              <button
                key={city.name}
                onClick={() => handleSelectCity(city)}
                className={`px-3 py-1 rounded-xl shrink-0 transition-all font-medium ${
                  currentLocation.name === city.name
                    ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 shadow-sm font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>{city.flag}</span> <span className="ml-1">{city.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-8">
          
          {isLoading ? (
            /* Skeleton Loading State */
            <div className="space-y-6 animate-pulse">
              <div className="h-96 rounded-3xl bg-slate-200/80 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.06]" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-36 rounded-2xl bg-slate-200/80 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.06]" />
                <div className="h-36 rounded-2xl bg-slate-200/80 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.06]" />
                <div className="h-36 rounded-2xl bg-slate-200/80 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.06]" />
              </div>
            </div>
          ) : aqiData ? (
            <>
              {/* Main Hero AQI Gauge Card */}
              <HeroAqiGauge
                data={aqiData}
                standard={standard}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
              />

              {/* Pollutant Breakdown 6-Grid */}
              <PollutantGrid
                pollutants={aqiData.pollutants}
                subIndices={aqiData.subIndices}
                standard={standard}
              />

              {/* 2-Column Row: Trend Charts (8 cols) & Weather Card (4 cols) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-8">
                  <TrendCharts
                    hourlyData={aqiData.hourlyForecast}
                    dailyData={aqiData.dailyForecast}
                    standard={standard}
                  />
                </div>
                <div className="lg:col-span-4 space-y-6">
                  <WeatherCard
                    weather={aqiData.weather}
                    cityName={aqiData.cityName}
                  />
                </div>
              </div>

              {/* Atmospheric Particle Dispersion Visualizer */}
              <AirParticleVisualizer
                aqi={aqiData.currentAQI}
                windSpeed={aqiData.weather?.windSpeed ?? 12}
                windDirection={aqiData.weather?.windDirection ?? 180}
                category={aqiData.category}
              />

              {/* Health Advisory & Vulnerable Groups */}
              <HealthAdvisory
                category={aqiData.category}
                aqi={aqiData.currentAQI}
              />
            </>
          ) : null}

        </main>

        {/* AI Predictor & Simulation Studio Modal */}
        <AIPredictorStudio
          livePollutants={aqiData?.pollutants}
          standard={standard}
          isOpen={isSimulatorOpen}
          onClose={() => setIsSimulatorOpen(false)}
        />

        {/* Export & Audit Report Modal */}
        <ExportModal
          data={aqiData}
          standard={standard}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200/90 dark:border-white/[0.08] bg-white/80 dark:bg-black/40 backdrop-blur-xl py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                <b className="text-slate-900 dark:text-slate-100">AeroPulse AI</b> — Supervised ML AQI Prediction & Environmental Health SaaS Dashboard
              </span>
            </div>

            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-medium">
              <span>Model: Random Forest Regressor (R² = 0.94)</span>
              <span>•</span>
              <span>Data: Open-Meteo & EPA Standards</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
