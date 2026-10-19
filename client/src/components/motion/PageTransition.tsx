import React from 'react';
import { motion } from 'motion/react';
import { pageVariants } from '../../lib/motionTokens';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
}) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`w-full min-h-full ${className}`}
    >
      {children}
    </motion.div>
  );
};
