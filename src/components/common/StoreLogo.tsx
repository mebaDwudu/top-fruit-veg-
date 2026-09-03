import React from 'react';
import { useStore } from '../../context/StoreContext';

interface StoreLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  textColor?: string;
  compactOnMobile?: boolean;
  onClick?: () => void;
}

export const StoreLogo: React.FC<StoreLogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
  textColor,
  compactOnMobile = false,
  onClick,
}) => {
  const { settings } = useStore();

  const sizeClasses = {
    sm: {
      badge: 'w-8 h-8 rounded-xl text-lg',
      title: 'text-xs font-black tracking-tight leading-tight',
      sub: 'text-[9px] font-bold leading-none',
    },
    md: {
      badge: 'w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-xl',
      title: 'text-xs sm:text-sm font-black tracking-tight leading-tight',
      sub: 'text-[10px] sm:text-[11px] font-bold leading-none',
    },
    lg: {
      badge: 'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-2xl',
      title: 'text-sm sm:text-base font-black tracking-tight leading-tight',
      sub: 'text-[11px] sm:text-xs font-bold leading-none',
    },
    xl: {
      badge: 'w-14 h-14 rounded-2xl text-3xl',
      title: 'text-base sm:text-lg font-black tracking-tight leading-tight',
      sub: 'text-xs font-bold leading-none',
    },
  }[size];

  return (
    <div
      onClick={onClick}
      className={`flex items-center space-x-2.5 select-none transition-all ${onClick ? 'cursor-pointer hover:opacity-90 active:scale-98' : ''} ${className}`}
      title={settings.storeName || 'Top Fruit and Veg'}
    >
      {/* Visual Logo Mark / Badge */}
      <div className={`relative shrink-0 flex items-center justify-center shadow-xs overflow-hidden ${sizeClasses.badge}`}>
        {settings.storeLogo ? (
          <img
            src={settings.storeLogo}
            alt={settings.storeName || 'Top Fruit and Veg'}
            className="w-full h-full object-contain rounded-xl"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
        ) : null}

        {/* Branded Vector Tropical Emblem (Default / Fallback) */}
        <div
          className={`w-full h-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white flex items-center justify-center font-bold ${
            settings.storeLogo ? 'hidden' : 'flex'
          }`}
        >
          <svg
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full p-1.5"
          >
            {/* Glossy background circle */}
            <circle cx="24" cy="24" r="21" fill="#047857" />
            <circle cx="24" cy="24" r="19" stroke="#10B981" strokeWidth="1.5" strokeOpacity="0.4" />
            
            {/* Stylized Tropical Mango & Leaf */}
            <path
              d="M24 10C24 10 27 6 31 8C35 10 33 15 31 16C29 17 25 15 24 10Z"
              fill="#34D399"
            />
            <path
              d="M22.5 13C16 14.5 13 20 13.5 28C14 36 21 39 27 38C33 37 36 30 35 23C34 16 27 12 22.5 13Z"
              fill="#F59E0B"
            />
            <path
              d="M23 15C29 17 33 22 32.5 27C32 32 28 36 23.5 35.5C21 35.2 17 32 16.5 27C16 22 19 16 23 15Z"
              fill="#EF4444"
              opacity="0.3"
            />
            <path
              d="M17 23C16.5 19 19 15 23 14"
              stroke="#FEF3C7"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.6"
            />
          </svg>
        </div>
      </div>

      {/* Brand Text */}
      <div className={`min-w-0 ${compactOnMobile ? 'hidden xs:block sm:block' : 'block'}`}>
        <h1 className={`${sizeClasses.title} ${textColor || 'text-slate-900'} truncate`}>
          {settings.storeName || 'Top Fruit and Veg'}
        </h1>
        {showSubtitle && (
          <p className={`${sizeClasses.sub} text-emerald-700 font-bold mt-0.5 flex items-center gap-1 truncate`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block shrink-0" />
            <span className="truncate">Pitch 18 Brixton Market</span>
          </p>
        )}
      </div>
    </div>
  );
};
