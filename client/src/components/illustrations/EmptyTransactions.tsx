import React from 'react';

interface IllustrationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const EmptyTransactions: React.FC<IllustrationProps> = ({
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
        <linearGradient id="et-wallet" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="60%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4F46E5" />
        </linearGradient>

        <linearGradient id="et-coin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <linearGradient id="et-card" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>

        <filter id="et-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#4F46E5" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Ambient Ground Ellipse */}
      <ellipse cx="100" cy="142" rx="70" ry="10" fill="#38BDF8" opacity="0.08" />

      {/* Back Card Peeking Out */}
      <rect
        x="65"
        y="42"
        width="70"
        height="45"
        rx="8"
        transform="rotate(-8 65 42)"
        fill="url(#et-card)"
        opacity="0.75"
      />
      <rect
        x="72"
        y="50"
        width="10"
        height="8"
        rx="2"
        transform="rotate(-8 72 50)"
        fill="#FEF08A"
        opacity="0.9"
      />

      {/* Main Wallet Body */}
      <g filter="url(#et-shadow)">
        <rect x="45" y="60" width="110" height="72" rx="16" fill="url(#et-wallet)" />
        <rect
          x="46"
          y="61"
          width="108"
          height="70"
          rx="15"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
        />

        {/* Wallet Flap & Clasp */}
        <path
          d="M125 84 H155 C158 84 160 86.5 160 90 V102 C160 105.5 158 108 155 108 H125 Z"
          fill="#1E1B4B"
          opacity="0.6"
        />
        <circle cx="145" cy="96" r="4.5" fill="#34D399" />
        <circle cx="145" cy="96" r="2" fill="#FFFFFF" />
      </g>

      {/* Floating Mint Emerald Coin 1 */}
      <g filter="url(#et-shadow)">
        <circle cx="52" cy="46" r="14" fill="url(#et-coin)" />
        <circle cx="52" cy="46" r="12" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
        <text
          x="52"
          y="51"
          fill="#FFFFFF"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="sans-serif"
        >
          ₫
        </text>
      </g>

      {/* Floating Small Coin 2 */}
      <circle cx="150" cy="48" r="8" fill="url(#et-coin)" opacity="0.85" />
      <text
        x="150"
        y="52"
        fill="#FFFFFF"
        fontSize="9"
        fontWeight="bold"
        textAnchor="middle"
        fontFamily="sans-serif"
      >
        +
      </text>

      {/* Sparkle stars */}
      <path
        d="M98 22 L100 27 L105 29 L100 31 L98 36 L96 31 L91 29 L96 27 Z"
        fill="#38BDF8"
        opacity="0.9"
      />
      <circle cx="122" cy="28" r="2" fill="#34D399" />
      <circle cx="36" cy="74" r="1.5" fill="#818CF8" />
    </svg>
  );
};
