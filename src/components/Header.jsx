import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  MapPin,
  Compass,
  Moon,
  Sun,
  RefreshCw,
  Clock,
  Sparkles,
  Sliders,
  Download,
  CheckCircle2,
  X,
} from 'lucide-react';
import { searchLocations } from '../services/aqiService';
import { POPULAR_CITIES } from '../data/mockCities';

export default function Header({
  currentCity,
  standard,
  onSelectCity,
  onToggleStandard,
  darkMode,
  onToggleDarkMode,
  onRefresh,
  isRefreshing,
  onOpenSimulator,
  onOpenExport,
  lastUpdated,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchContainerRef = useRef(null);

  // Live real-time clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsOpenDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search query handler
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(POPULAR_CITIES.slice(0, 6));
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocations(searchQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Search query failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Handle GPS location button
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          // Attempt reverse geocoding
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          const data = await res.json();
          const detectedCity = data.city || data.locality || data.principalSubdivision || 'My Location';
          const detectedCountry = data.countryName || '';

          onSelectCity({
            name: detectedCity,
            country: detectedCountry,
            lat: latitude,
            lon: longitude,
            state: data.principalSubdivision || '',
          });
        } catch (err) {
          onSelectCity({
            name: 'Local Station',
            country: 'GPS Detected',
            lat: latitude,
            lon: longitude,
          });
        } finally {
          setIsLocating(false);
          setIsOpenDropdown(false);
        }
      },
      (err) => {
        console.warn('Geolocation failed or permission denied:', err);
        setIsLocating(false);
        alert('Could not access GPS location. Please choose a city from the search bar.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSelectCityItem = (city) => {
    onSelectCity(city);
    setSearchQuery('');
    setIsOpenDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-white/[0.08] bg-white/85 dark:bg-background-dark/80 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer group shrink-0" onClick={() => onSelectCity(POPULAR_CITIES[0])}>
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 group-hover:border-emerald-400/60 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all">
              <Sparkles className="w-5 h-5 text-emerald-500 dark:text-emerald-400 group-hover:rotate-12 transition-transform duration-300" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent font-['Plus_Jakarta_Sans']">
                  AeroPulse
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 tracking-wide uppercase">
                  AI SaaS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Predictive AQI & Climate Intelligence</p>
            </div>
          </div>

          {/* Search Bar with Autocomplete */}
          <div className="relative flex-1 max-w-xl hidden md:block" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setIsOpenDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsOpenDropdown(true);
                }}
                placeholder="Search city, metro, or coordinates (e.g. Delhi, London, New York)..."
                className="w-full pl-10 pr-24 py-2.5 rounded-xl text-sm bg-slate-100 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-12 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                title="Use Current Location (GPS)"
                className="absolute right-2 p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 border border-emerald-500/20 transition-all flex items-center gap-1 text-xs font-semibold"
              >
                <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
                <span className="hidden lg:inline text-[11px]">GPS</span>
              </button>
            </div>

            {/* Dropdown Suggestions */}
            {isOpenDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/95 glass-card z-50 shadow-2xl border border-slate-200 dark:border-white/[0.1] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between border-b border-slate-200 dark:border-white/[0.05] pb-2">
                  <span>{searchQuery ? 'Matching Locations' : 'Popular Metros'}</span>
                  {isSearching && <span className="text-emerald-600 dark:text-emerald-400 animate-pulse">Searching global API...</span>}
                </div>

                <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-100 dark:divide-white/[0.03]">
                  {searchResults.length > 0 ? (
                    searchResults.map((city, idx) => (
                      <button
                        key={`${city.name}-${city.lat}-${idx}`}
                        onClick={() => handleSelectCityItem(city)}
                        className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-left transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-base">{city.flag || '📍'}</span>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                              {city.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {[city.state, city.country].filter(Boolean).join(', ')}
                            </p>
                          </div>
                        </div>
                        {city.baselineAqi && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-white/[0.05] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent font-medium">
                            ~{city.baselineAqi} AQI
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                      No locations found. Press enter or try searching another city name.
                    </div>
                  )}
                </div>

                {/* Quick select chips */}
                <div className="px-3 pt-2 border-t border-slate-200 dark:border-white/[0.05] flex flex-wrap gap-1.5">
                  {['Delhi', 'Mumbai', 'New York', 'London', 'Tokyo', 'Ahmedabad'].map((cName) => (
                    <button
                      key={cName}
                      onClick={() => {
                        const target = POPULAR_CITIES.find((c) => c.name === cName);
                        if (target) handleSelectCityItem(target);
                      }}
                      className="px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-transparent text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                    >
                      {cName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Standard Switcher: US EPA vs Indian CPCB */}
            <div className="flex items-center p-1 rounded-xl glass-panel border border-slate-200/90 dark:border-white/[0.08] text-xs font-semibold shadow-sm">
              <button
                onClick={() => standard !== 'US' && onToggleStandard('US')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  standard === 'US'
                    ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="US EPA AQI Standard (0-500)"
              >
                US EPA
              </button>
              <button
                onClick={() => standard !== 'INDIA' && onToggleStandard('INDIA')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  standard === 'INDIA'
                    ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
                title="Indian CPCB National Air Quality Index (0-500)"
              >
                CPCB (IN)
              </button>
            </div>

            {/* AI Simulator Trigger Button */}
            <button
              onClick={onOpenSimulator}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-600 dark:hover:bg-indigo-500 border border-indigo-200 dark:border-indigo-500 text-indigo-800 hover:text-indigo-900 dark:text-white text-xs font-bold transition-all shadow-sm dark:shadow-[0_0_15px_rgba(99,102,241,0.35)]"
              title="Open AI 'What-If' Simulation Studio"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-700 dark:text-white" />
              <span className="hidden sm:inline">AI Studio</span>
            </button>

            {/* Export Report Trigger */}
            <button
              onClick={onOpenExport}
              className="p-2 rounded-xl glass-panel hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all border border-slate-200/90 dark:border-white/[0.08] shadow-sm"
              title="Export AQI Report"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Live Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-xl glass-panel hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all border border-slate-200/90 dark:border-white/[0.08] shadow-sm"
              title="Refresh Live Data"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-500 dark:text-emerald-400' : ''}`} />
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={onToggleDarkMode}
              className="p-2 rounded-xl glass-panel hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-all border border-slate-200/90 dark:border-white/[0.08] shadow-sm"
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>
          </div>

        </div>

        {/* Mobile Search Bar Row */}
        <div className="pb-3 md:hidden">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpenDropdown(true);
              }}
              onFocus={() => setIsOpenDropdown(true)}
              placeholder="Search any city or metro..."
              className="w-full pl-10 pr-12 py-2 rounded-xl text-sm bg-slate-100 dark:bg-white/[0.04] border border-slate-300 dark:border-white/[0.08] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 font-medium"
            />
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="absolute right-2 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            >
              <Compass className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
