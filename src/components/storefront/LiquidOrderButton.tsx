import React from 'react';
import { ShoppingBag, Store, Truck } from 'lucide-react';

interface LiquidOrderButtonProps {
  totalItems: number;
  orderType: 'pickup' | 'delivery';
  onToggleOrderType?: (type: 'pickup' | 'delivery') => void;
  onClick: () => void;
}

export const LiquidOrderButton: React.FC<LiquidOrderButtonProps> = ({
  totalItems,
  orderType,
  onToggleOrderType,
  onClick,
}) => {
  if (totalItems <= 0) return null;

  return (
    <aside
      aria-label="Floating Order Summary"
      className="fixed bottom-5 sm:bottom-7 inset-x-0 mx-auto w-fit max-w-[94vw] z-40 animate-in slide-in-from-bottom-6 duration-300 pointer-events-auto"
    >
      {/* Liquid Glass Capsule / Pill */}
      <div
        id="floating-liquid-order-button"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        className="group relative select-none cursor-pointer flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-full backdrop-blur-2xl bg-gradient-to-r from-emerald-900/90 via-slate-950/92 to-emerald-950/90 text-white border border-emerald-400/40 shadow-[0_12px_32px_-4px_rgba(5,150,105,0.45),0_4px_12px_rgba(0,0,0,0.4)] ring-1 ring-white/20 active:scale-95 transition-all duration-200 overflow-hidden"
        style={{
          boxShadow: 'inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.4), 0 14px 30px -5px rgba(4, 120, 87, 0.45)',
        }}
      >
        {/* Liquid Glass Reflection Highlight along top half */}
        <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/25 via-white/5 to-transparent rounded-t-full pointer-events-none" />

        {/* Subtle Fluid Wave / Glow Ambient Effect */}
        <div className="absolute -left-4 -top-4 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl pointer-events-none animate-pulse" />
        <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-teal-400/20 rounded-full blur-xl pointer-events-none animate-pulse" />

        {/* 1. Item Count Element (Only Items) */}
        <div className="relative flex items-center space-x-2 py-0.5">
          <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-slate-950 flex items-center justify-center font-black shadow-inner shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
            <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black rounded-full px-1 shadow-xs leading-tight">
              {totalItems}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-black tracking-tight text-white whitespace-nowrap">
            {totalItems} {totalItems === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {/* Glowing Liquid Glass Divider */}
        <div className="w-[1px] h-5 bg-gradient-to-b from-transparent via-emerald-400/50 to-transparent" />

        {/* 2. Order Type Element (Only Order Type) */}
        <div
          onClick={(e) => {
            if (onToggleOrderType) {
              e.stopPropagation();
              onToggleOrderType(orderType === 'pickup' ? 'delivery' : 'pickup');
            }
          }}
          className="relative flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-sm transition-colors cursor-pointer"
          title="Click to toggle order type"
        >
          {orderType === 'pickup' ? (
            <>
              <Store className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-xs font-black text-emerald-200 whitespace-nowrap">
                Market Pickup
              </span>
            </>
          ) : (
            <>
              <Truck className="w-3.5 h-3.5 text-teal-300" />
              <span className="text-xs font-black text-teal-200 whitespace-nowrap">
                Home Delivery
              </span>
            </>
          )}
        </div>

        {/* Subtle Next Pulse Arrow */}
        <div className="text-emerald-400 group-hover:translate-x-0.5 transition-transform text-xs font-bold pl-0.5">
          →
        </div>
      </div>
    </aside>
  );
};
