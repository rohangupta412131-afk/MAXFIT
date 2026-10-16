import React, { useState, useRef, useCallback } from 'react';
import { Sparkles } from 'lucide-react';

export const BeforeAfterSlider = ({ beforeImage, afterImage, beforeLabel = 'Original Photo', afterLabel = 'AI Try-On Result' }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMove = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  }, []);

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/4] max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl select-none cursor-ew-resize border border-stone-200 bg-stone-100"
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
      onMouseMove={handleMouseMove}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
    >
      {/* After Image (Full width background) */}
      <img
        src={afterImage}
        alt={afterLabel}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute top-4 right-4 z-10 px-3 py-1 bg-neutral-900/80 backdrop-blur-md rounded-full text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg border border-white/20">
        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        {afterLabel}
      </div>

      {/* Before Image (Clipped overlay) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <img
          src={beforeImage}
          alt={beforeLabel}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%', maxWidth: 'none' }}
        />
        <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-stone-800/80 backdrop-blur-md rounded-full text-stone-200 text-xs font-semibold shadow-lg border border-white/10">
          {beforeLabel}
        </div>
      </div>

      {/* Slider Divider Line & Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-20 flex items-center justify-center pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-neutral-900 text-neutral-900 text-xs font-bold pointer-events-auto cursor-ew-resize">
          ↔
        </div>
      </div>
    </div>
  );
};
