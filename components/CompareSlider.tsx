import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronsLeftRight, Download, Sparkles } from 'lucide-react';

interface CompareSliderProps {
  beforeImage: string;
  afterImage: string;
}

export const CompareSlider: React.FC<CompareSliderProps> = ({ beforeImage, afterImage }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  }, []);

  const onMouseDown = () => setIsDragging(true);
  const onTouchStart = () => setIsDragging(true);

  const onMouseUp = useCallback(() => setIsDragging(false), []);
  const onTouchEnd = useCallback(() => setIsDragging(false), []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging) handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, onMouseMove, onMouseUp, onTouchMove, onTouchEnd]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = afterImage;
    link.download = 'cleaned_image.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full select-none">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-indigo-400 w-5 h-5" />
            Result Comparison
            </h3>
            <p className="text-sm text-slate-400 mt-1">Drag slider to see the magic</p>
        </div>
        <button 
          onClick={handleDownload}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 text-sm font-medium active:scale-95"
        >
          <Download className="w-4 h-4" />
          Save Image
        </button>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full aspect-video bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl border border-white/10 group cursor-col-resize ring-1 ring-white/5"
      >
        {/* After Image (Background) */}
        <img 
          src={afterImage} 
          alt="Cleaned" 
          className="absolute inset-0 w-full h-full object-contain bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-100" 
        />

        {/* Before Image (Foreground with clip-path) */}
        <div 
          className="absolute inset-0 w-full h-full"
          style={{ 
            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)` 
          }}
        >
          <img 
            src={beforeImage} 
            alt="Original" 
            className="absolute inset-0 w-full h-full object-contain" 
          />
          <div className="absolute top-6 left-6 bg-black/50 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
            ORIGINAL
          </div>
        </div>
        
        <div className="absolute top-6 right-6 bg-indigo-600/80 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg">
            CLEANED
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white cursor-col-resize shadow-[0_0_20px_rgba(255,255,255,0.5)] z-10"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-transform hover:scale-110 active:scale-95">
            <ChevronsLeftRight className="w-5 h-5 text-indigo-950" />
          </div>
        </div>
      </div>
    </div>
  );
};