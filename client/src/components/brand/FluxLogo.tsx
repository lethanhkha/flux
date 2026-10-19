import React from 'react';

export interface FluxLogoProps {
  /**
   * 'mark': Biểu tượng chữ F dòng chảy
   * 'full': Biểu tượng + Chữ "Flux" + Subtitle
   * 'compact': Biểu tượng + Chữ "Flux"
   */
  variant?: 'mark' | 'full' | 'compact';
  /**
   * Kích thước định sẵn hoặc số pixel
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  textClassName?: string;
  subtitle?: string;
  showSubtitle?: boolean;
}

const sizeMap = {
  xs: { box: 24, font: 'text-base', sub: 'text-[9px]' },
  sm: { box: 32, font: 'text-lg', sub: 'text-[10px]' },
  md: { box: 40, font: 'text-xl', sub: 'text-[11px]' },
  lg: { box: 48, font: 'text-2xl', sub: 'text-xs' },
  xl: { box: 64, font: 'text-3xl', sub: 'text-sm' },
};

export const FluxLogo: React.FC<FluxLogoProps> = ({
  variant = 'compact',
  size = 'md',
  className = '',
  textClassName = '',
  subtitle = 'Workspace',
  showSubtitle = false,
}) => {
  const pixelSize = typeof size === 'number' ? size : sizeMap[size]?.box || 40;
  const fontStyle = typeof size === 'string' ? sizeMap[size]?.font : 'text-xl';
  const subStyle = typeof size === 'string' ? sizeMap[size]?.sub : 'text-[11px]';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Dynamic F-Ribbon SVG Mark */}
      <div
        className="relative flex-shrink-0 transition-transform duration-200 hover:scale-105"
        style={{ width: pixelSize, height: pixelSize }}
      >
        <svg
          viewBox="0 0 100 100"
          width="100%"
          height="100%"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <defs>
            <linearGradient id="flux-react-top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="60%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>

            <linearGradient id="flux-react-mid" x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#6366F1" />
              <stop offset="55%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#34D399" />
            </linearGradient>

            <linearGradient id="flux-react-stem" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="45%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>

            <linearGradient id="flux-react-bg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E293B" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>

          {/* Squircle Base Frame */}
          <rect
            width="100"
            height="100"
            rx="26"
            fill="url(#flux-react-bg)"
            stroke="rgba(255, 255, 255, 0.16)"
            strokeWidth="2"
          />

          {/* Ambient Glow Flare */}
          <circle cx="50" cy="30" r="30" fill="#38BDF8" opacity="0.12" filter="blur(10px)" />

          {/* Stem (Vertical Backbone) */}
          <path
            d="M26 18 C26 14.686 28.686 12 32 12 H42 C45.314 12 48 14.686 48 18 V76 C48 81.523 43.523 86 38 86 C32.477 86 26 81.523 26 76 Z"
            fill="url(#flux-react-stem)"
          />

          {/* Top Dynamic Velocity Arm */}
          <path
            d="M38 12 H76 C83.732 12 90 18.268 90 26 C90 32.627 84.627 38 78 38 H48 V22 C48 16.477 43.523 12 38 12 Z"
            fill="url(#flux-react-top)"
          />

          {/* Specular Light Reflection */}
          <path
            d="M44 14 H76 C82 14 86 18 88 24 C86 17 80 13.5 72 13.5 H44 Z"
            fill="#FFFFFF"
            opacity="0.45"
          />

          {/* Mid Dynamic Liquidity Arm */}
          <path
            d="M42 44 H68 C73.523 44 78 48.477 78 54 C78 59.523 73.523 64 68 64 H48 V50 C48 46.686 45.314 44 42 44 Z"
            fill="url(#flux-react-mid)"
          />

          {/* Kinetic Energy Nodes */}
          <circle cx="76" cy="26" r="3" fill="#FFFFFF" opacity="0.9" />
          <circle cx="68" cy="54" r="2.5" fill="#FFFFFF" opacity="0.9" />
          <circle cx="38" cy="76" r="2.5" fill="#34D399" opacity="0.9" />
        </svg>
      </div>

      {/* Brand Text Lockup */}
      {variant !== 'mark' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-brand to-indigo-600 dark:from-white dark:via-sky-400 dark:to-indigo-400 bg-clip-text text-transparent ${fontStyle} ${textClassName}`}
            >
              Flux
            </span>
          </div>
          {(variant === 'full' || showSubtitle) && (
            <span
              className={`font-semibold text-slate-400 dark:text-slate-400 tracking-wider uppercase mt-0.5 ${subStyle}`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
