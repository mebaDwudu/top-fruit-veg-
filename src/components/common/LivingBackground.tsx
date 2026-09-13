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
      {/* 1. Subtle Dot Matrix Grid with Radial Fade */}
      <div className="absolute inset-0 bg-grid-dots mask-radial-faded opacity-25" />

      {/* 2. Floating Luminous Ambient Orbs (Warm Gold, Fresh Emerald, Soft Rose) */}
      {/* Warm Sunlight/Gold Orb (Top Left) */}
      <div
        className="absolute -top-24 -left-20 w-96 h-96 rounded-full blur-3xl animate-float-1"
        style={{ backgroundColor: 'rgba(254, 240, 138, 0.22)', transformOrigin: 'top left' }}
      />

      {/* Fresh Emerald Orb (Top Right / Center) */}
      <div
        className="absolute top-12 -right-24 w-[30rem] h-[30rem] rounded-full blur-3xl animate-float-2"
        style={{ backgroundColor: 'rgba(167, 243, 208, 0.22)', transformOrigin: 'center right' }}
      />

      {/* Soft Rose / Tropical Guava Orb (Bottom Center / Right) */}
      <div
        className="absolute -bottom-32 left-1/3 w-[28rem] h-[28rem] rounded-full blur-3xl animate-float-3"
        style={{ backgroundColor: 'rgba(251, 207, 232, 0.18)', transformOrigin: 'bottom center' }}
      />

      {/* 3. Subtle Emerald Aurora Horizon Line */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{
          background: 'linear-gradient(to right, transparent, rgba(16, 185, 129, 0.25), transparent)',
        }}
      />
    </div>
  );
};
