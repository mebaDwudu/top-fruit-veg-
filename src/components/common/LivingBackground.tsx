import React from 'react';

/**
 * LivingBackground
 * An Aceternity/Linear-inspired ambient living background layer:
 * - 3 subtle floating luminous orbs (5% warm gold, 5% fresh emerald, 5% tropical rose)
 * - Ultra-crisp subtle dot-matrix grid with soft radial mask
 * - Ultra-lightweight, 100% GPU-accelerated CSS animations with zero JS execution overhead
 * - Respects prefers-reduced-motion automatically
 */
export const LivingBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* 1. Aceternity-style Subtle Dot Matrix Grid with Radial Fade */}
      <div className="absolute inset-0 bg-grid-dots mask-radial-faded opacity-35" />

      {/* 2. Floating Luminous Ambient Orbs */}
      {/* Warm Sunrise Gold Orb (Top Left) */}
      <div
        className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-amber-200/25 blur-3xl animate-float-1"
        style={{ transformOrigin: 'top left' }}
      />

      {/* Fresh Brixton Emerald Orb (Top Right / Center) */}
      <div
        className="absolute top-12 -right-24 w-[30rem] h-[30rem] rounded-full bg-emerald-200/25 blur-3xl animate-float-2"
        style={{ transformOrigin: 'center right' }}
      />

      {/* Soft Tropical Blossom Pink Orb (Bottom Center / Right) */}
      <div
        className="absolute -bottom-32 left-1/3 w-[28rem] h-[28rem] rounded-full bg-pink-200/20 blur-3xl animate-float-3"
        style={{ transformOrigin: 'bottom center' }}
      />

      {/* 3. Subtle Dawn Sunlight Aurora Line */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/25 to-transparent" />
    </div>
  );
};
