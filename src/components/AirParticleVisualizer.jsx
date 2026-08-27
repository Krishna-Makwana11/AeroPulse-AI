import React, { useEffect, useRef, useState } from 'react';
import { Wind, Play, Pause, RefreshCw, Eye, Sparkles } from 'lucide-react';

export default function AirParticleVisualizer({ aqi = 65, windSpeed = 12, windDirection = 180, category }) {
  const canvasRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas dimensions
    const updateSize = () => {
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight || 240;
    };
    updateSize();
    window.addEventListener('resize', updateSize);

    // Particle parameters based on AQI and Wind Speed
    const particleCount = Math.min(Math.max(Math.round((aqi / 500) * 160) + 30, 40), 200);
    const rad = ((windDirection - 90) * Math.PI) / 180;
    const speedFactor = Math.max((windSpeed / 10) * 0.8, 0.4);

    const particles = [];
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 1.2,
        speed: (Math.random() * 1.5 + 0.8) * speedFactor,
        vx: Math.cos(rad) * ((Math.random() * 1.5 + 0.8) * speedFactor),
        vy: Math.sin(rad) * ((Math.random() * 1.5 + 0.8) * speedFactor),
        alpha: Math.random() * 0.6 + 0.2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle background grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw particle trails
      particles.forEach((p) => {
        if (isPlaying) {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = canvas.width;
          if (p.x > canvas.width) p.x = 0;
          if (p.y < 0) p.y = canvas.height;
          if (p.y > canvas.height) p.y = 0;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = category.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = category.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', updateSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [aqi, windSpeed, windDirection, category, isPlaying]);

  return (
    <div className="p-6 sm:p-7 rounded-3xl glass-card border border-slate-200/90 dark:border-white/[0.1] shadow-2xl flex flex-col justify-between relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/90 dark:border-white/[0.06] z-10">
        <div className="flex items-center gap-2">
          <Wind className="w-5 h-5 text-teal-500 dark:text-teal-400" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 font-['Plus_Jakarta_Sans']">
            Atmospheric Particle Dispersion Simulation
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent transition-colors text-xs flex items-center gap-1 shadow-sm"
            title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full h-44 sm:h-52 my-3 rounded-2xl overflow-hidden bg-slate-900 dark:bg-black/40 border border-slate-300 dark:border-white/[0.04] flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full block" />
        
        {/* Overlay Overlay Info Overlay */}
        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/70 backdrop-blur-md border border-white/[0.1] flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }}></span>
            <span className="text-slate-200 font-mono">Vector: {windSpeed} km/h @ {windDirection}°</span>
          </div>
          <span className="text-slate-400">|</span>
          <span className="text-slate-200 font-mono">Aerosol Load: {category.level}</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1 font-medium">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          Real-time Lagrangian Particle Dispersion Physics
        </span>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">2.5µm - 10µm Micro-Aerosols</span>
      </div>
    </div>
  );
}
