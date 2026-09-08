import React from 'react';

/**
 * LivingBackground
 * Linear-inspired ambient background layer:
 * - Smooth diagonal linear gradients blending soft light yellow and light sky blue
 * - Pure linear transitions with zero dots or circular radial spreads
 * - Zero pink tones
 * - 100% GPU-accelerated and responsive
 */
export const LivingBackground: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      aria-hidden="true"
    >
      {/* 1. Pure Clean White Top Area (Header & Navigation stays 100% clean) */}
      <div className="absolute top-0 inset-x-0 h-24 bg-white z-10" />

      {/* 2. Base Smooth Linear Gradient Wash starting cleanly below the top navigation */}
      <div
        className="absolute inset-x-0 bottom-0 top-24"
        style={{
          background:
            'linear-gradient(135deg, rgba(254, 249, 195, 0.40) 0%, rgba(255, 255, 255, 0.65) 28%, rgba(240, 249, 255, 0.50) 62%, rgba(224, 242, 254, 0.45) 100%)',
        }}
      />

      {/* 3. Secondary Diagonal Linear Gradient Band below top */}
      <div
        className="absolute inset-x-0 bottom-0 top-24 opacity-60"
        style={{
          background:
            'linear-gradient(165deg, rgba(254, 240, 138, 0.22) 0%, transparent 40%, rgba(186, 230, 253, 0.25) 70%, rgba(224, 242, 254, 0.35) 100%)',
        }}
      />
    </div>
  );
};

