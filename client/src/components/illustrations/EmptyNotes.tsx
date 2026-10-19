import React from 'react';

interface IllustrationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const EmptyNotes: React.FC<IllustrationProps> = ({
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
        <linearGradient id="en-book" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E1B4B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        <linearGradient id="en-page" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#E2E8F0" />
        </linearGradient>

        <linearGradient id="en-bulb" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        <filter id="en-shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#8B5CF6" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Ambient Ground */}
      <ellipse cx="100" cy="144" rx="72" ry="10" fill="#A855F7" opacity="0.08" />

      {/* Open Journal Book Cover */}
      <g filter="url(#en-shadow)">
        <path
          d="M40 70 C40 64 45 60 52 60 H98 V128 H52 C45 128 40 124 40 118 Z"
          fill="url(#en-book)"
        />
        <path
          d="M160 70 C160 64 155 60 148 60 H102 V128 H148 C155 128 160 124 160 118 Z"
          fill="url(#en-book)"
        />

        {/* Left Page */}
        <path
          d="M44 68 C44 64 48 62 54 62 H96 V124 H54 C48 124 44 121 44 117 Z"
          fill="url(#en-page)"
        />
        {/* Right Page */}
        <path
          d="M156 68 C156 64 152 62 146 62 H104 V124 H146 C152 124 156 121 156 117 Z"
          fill="url(#en-page)"
        />

        {/* Page Lines */}
        <line x1="52" y1="74" x2="88" y2="74" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="52" y1="84" x2="80" y2="84" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <line x1="52" y1="94" x2="84" y2="94" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />

        <line x1="112" y1="74" x2="148" y2="74" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="112" y1="84" x2="140" y2="84" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <line x1="112" y1="94" x2="144" y2="94" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />

        {/* Book Spine Ridge */}
        <line x1="100" y1="60" x2="100" y2="128" stroke="#6366F1" strokeWidth="2.5" />
      </g>

      {/* Floating Idea Lightbulb */}
      <g filter="url(#en-shadow)">
        <circle cx="100" cy="38" r="20" fill="#FBBF24" opacity="0.15" />
        <path
          d="M92 42 C90 39 88 35 88 30 C88 23.37 93.37 18 100 18 C106.63 18 112 23.37 112 30 C112 35 110 39 108 42 L106 46 H94 Z"
          fill="url(#en-bulb)"
        />
        <rect x="95" y="47" width="10" height="3" rx="1.5" fill="#94A3B8" />
        <rect x="96" y="51" width="8" height="2" rx="1" fill="#64748B" />
        <path d="M96 28 L100 24 L104 28" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Floating Sparkles */}
      <path
        d="M72 32 L74 36 L78 38 L74 40 L72 44 L70 40 L66 38 L70 36 Z"
        fill="#A855F7"
        opacity="0.9"
      />
      <circle cx="132" cy="34" r="2.5" fill="#38BDF8" opacity="0.8" />
      <circle cx="148" cy="46" r="2" fill="#FBBF24" opacity="0.9" />
    </svg>
  );
};
