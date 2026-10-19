import React from 'react';

interface ShinyTextProps {
  children: React.ReactNode;
  className?: string;
  shimmerWidth?: number;
  speed?: number; // in seconds
  shimmerColor?: string;
}

/**
 * ShinyText Recipe (inspired by nexu-io/motion-anything)
 * A dynamic light sheen that continuously sweeps across the typography.
 */
export const ShinyText: React.FC<ShinyTextProps> = ({
  children,
  className = '',
  speed = 4,
}) => {
  return (
    <span
      className={`relative inline-block overflow-hidden bg-clip-text ${className}`}
      style={{
        backgroundImage:
          'linear-gradient(110deg, currentColor 0%, currentColor 38%, rgba(255, 255, 255, 0.95) 50%, currentColor 62%, currentColor 100%)',
        backgroundSize: '220% 100%',
        WebkitBackgroundClip: 'text',
        animation: `shiny-sweep ${speed}s linear infinite`,
      }}
    >
      <style>{`
        @keyframes shiny-sweep {
          0% { background-position: 120% 0; }
          100% { background-position: -120% 0; }
        }
      `}</style>
      {children}
    </span>
  );
};
