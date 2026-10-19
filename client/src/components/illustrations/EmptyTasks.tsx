import React from 'react';

interface IllustrationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const EmptyTasks: React.FC<IllustrationProps> = ({
  className = '',
  width = 160,
  height = 130,
}) => {
  return (
    <svg
      viewBox="0 0 200 160"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`mx-auto ${className}`}
    >
      <defs>
        <linearGradient id="etasks-board" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        <linearGradient id="etasks-plane" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        <linearGradient id="etasks-check" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <filter id="etasks-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#6366F1" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Ambient Ground */}
      <ellipse cx="100" cy="144" rx="72" ry="10" fill="#6366F1" opacity="0.08" />

      {/* Floating Task Board Clipboard */}
      <g filter="url(#etasks-shadow)">
        <rect x="52" y="32" width="96" height="106" rx="14" fill="url(#etasks-board)" />
        <rect
          x="53"
          y="33"
          width="94"
          height="104"
          rx="13"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="1.5"
        />

        {/* Top Board Clip */}
        <rect x="80" y="24" width="40" height="16" rx="6" fill="#334155" />
        <rect x="88" y="28" width="24" height="6" rx="3" fill="#64748B" />

        {/* Mock Checklist Lines with Completed Checks */}
        <g opacity="0.8">
          {/* Item 1 */}
          <circle cx="70" cy="56" r="6" fill="url(#etasks-check)" />
          <path d="M68 56 L70 58 L73 54" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="82" y="53" width="50" height="6" rx="3" fill="#334155" />

          {/* Item 2 */}
          <circle cx="70" cy="74" r="6" fill="url(#etasks-check)" />
          <path d="M68 74 L70 76 L73 72" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="82" y="71" width="42" height="6" rx="3" fill="#334155" />

          {/* Item 3 */}
          <circle cx="70" cy="92" r="6" fill="url(#etasks-check)" />
          <path d="M68 92 L70 94 L73 90" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="82" y="89" width="46" height="6" rx="3" fill="#334155" />
        </g>
      </g>

      {/* Flying Paper Plane */}
      <g filter="url(#etasks-shadow)">
        <path
          d="M136 40 L168 18 L154 52 L142 46 Z"
          fill="url(#etasks-plane)"
        />
        <path
          d="M142 46 L154 52 L148 58 Z"
          fill="#4F46E5"
        />
        <path
          d="M118 64 C126 56 130 52 136 46"
          stroke="#38BDF8"
          strokeWidth="1.5"
          strokeDasharray="3 3"
          opacity="0.8"
        />
      </g>

      {/* Sparkles */}
      <circle cx="160" cy="78" r="2.5" fill="#38BDF8" opacity="0.8" />
      <circle cx="42" cy="70" r="2" fill="#34D399" opacity="0.7" />
    </svg>
  );
};
