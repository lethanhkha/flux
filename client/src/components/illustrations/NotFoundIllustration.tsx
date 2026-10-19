import React from 'react';

interface IllustrationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const NotFoundIllustration: React.FC<IllustrationProps> = ({
  className = '',
  width = 180,
  height = 140,
}) => {
  return (
    <svg
      viewBox="0 0 220 160"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`mx-auto ${className}`}
    >
      <defs>
        <linearGradient id="nf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>

        <filter id="nf-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#6366F1" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Planet Ground Ellipse */}
      <ellipse cx="110" cy="144" rx="85" ry="12" fill="#6366F1" opacity="0.1" />

      {/* Glowing 404 in modern tech typography */}
      <g filter="url(#nf-shadow)" opacity="0.95">
        <text
          x="110"
          y="78"
          fill="url(#nf-grad)"
          fontSize="56"
          fontWeight="900"
          textAnchor="middle"
          letterSpacing="4"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          404
        </text>
      </g>

      {/* Orbit Ring */}
      <ellipse
        cx="110"
        cy="75"
        rx="95"
        ry="24"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
        transform="rotate(-12 110 75)"
      />

      {/* Floating Satellite / Little Space Orb */}
      <circle cx="180" cy="52" r="6" fill="#38BDF8" />
      <circle cx="180" cy="52" r="10" stroke="#38BDF8" strokeWidth="1" opacity="0.4" />

      <circle cx="45" cy="98" r="4" fill="#34D399" />

      {/* Stars */}
      <circle cx="35" cy="40" r="1.5" fill="#FFFFFF" opacity="0.7" />
      <circle cx="70" cy="25" r="2" fill="#FFFFFF" opacity="0.8" />
      <circle cx="150" cy="28" r="1.5" fill="#FFFFFF" opacity="0.6" />
      <circle cx="185" cy="95" r="2" fill="#F43F5E" opacity="0.7" />
    </svg>
  );
};
