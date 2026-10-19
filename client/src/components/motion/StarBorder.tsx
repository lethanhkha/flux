import React from 'react';
import { motion } from 'motion/react';
import { buttonPressProps } from '../../lib/motionTokens';

interface StarBorderProps {
  as?: React.ElementType;
  className?: string;
  color?: string;
  speed?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

/**
 * StarBorder Recipe (inspired by nexu-io/motion-anything)
 * A luminous light particle that smoothly circles around the container border.
 */
export const StarBorder: React.FC<StarBorderProps> = ({
  as: Component = 'div',
  className = '',
  color = '#38BDF8',
  speed = '4s',
  children,
  onClick,
  disabled = false,
  type = 'button',
}) => {
  return (
    <motion.div
      {...buttonPressProps}
      className={`relative inline-block overflow-hidden rounded-2xl p-[1.5px] focus-within:ring-2 focus-within:ring-brand ${className}`}
      onClick={onClick}
    >
      {/* Rotating Conic Light Beam */}
      <div
        className="absolute inset-[-150%] animate-[spin_4s_linear_infinite]"
        style={{
          background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, transparent 310deg, ${color} 345deg, #FFFFFF 360deg)`,
          animationDuration: speed,
        }}
      />

      {/* Inner Content Slot */}
      <Component
        type={Component === 'button' ? type : undefined}
        disabled={disabled}
        className="relative z-10 w-full h-full rounded-[15px] flex items-center justify-center transition-all"
      >
        {children}
      </Component>
    </motion.div>
  );
};
