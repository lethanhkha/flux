import React from 'react';

interface IllustrationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const EmptySearch: React.FC<IllustrationProps> = ({
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
        <linearGradient id="es-lens" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>

        <linearGradient id="es-doc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        <filter id="es-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#38BDF8" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Ambient Ground */}
      <ellipse cx="100" cy="144" rx="70" ry="10" fill="#38BDF8" opacity="0.08" />

      {/* Background Sheet */}
      <g filter="url(#es-shadow)">
        <rect x="55" y="38" width="90" height="100" rx="12" fill="url(#es-doc)" />
        <rect
          x="56"
          y="39"
          width="88"
          height="98"
          rx="11"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.5"
        />

        {/* Folded Corner */}
        <path d="M125 38 L145 58 H131 C127.5 58 125 55.5 125 52 V38 Z" fill="#334155" />

        {/* Mock Text Lines */}
        <rect x="70" y="66" width="60" height="5" rx="2.5" fill="#334155" opacity="0.6" />
        <rect x="70" y="78" width="50" height="5" rx="2.5" fill="#334155" opacity="0.6" />
        <rect x="70" y="90" width="55" height="5" rx="2.5" fill="#334155" opacity="0.6" />
      </g>

      {/* Magnifying Glass with Gradient Rim */}
      <g filter="url(#es-shadow)">
        <circle cx="114" cy="74" r="28" stroke="url(#es-lens)" strokeWidth="6" />
        <circle cx="114" cy="74" r="25" fill="#38BDF8" opacity="0.12" />
        <path
          d="M102 62 C108 56 120 56 126 62"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Handle */}
        <line
          x1="134"
          y1="94"
          x2="160"
          y2="120"
          stroke="url(#es-lens)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <line
          x1="138"
          y1="98"
          x2="156"
          y2="116"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.5"
        />
      </g>

      <circle cx="114" cy="74" r="3" fill="#38BDF8" />
      <circle cx="48" cy="62" r="2" fill="#6366F1" opacity="0.8" />
      <circle cx="140" cy="40" r="1.5" fill="#34D399" opacity="0.8" />
    </svg>
  );
};
