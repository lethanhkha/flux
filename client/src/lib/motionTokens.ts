import type { Transition, Variants } from 'motion/react';

/**
 * Standard physics-based spring transitions (Apple / Linear / Stripe guidelines)
 */
export const springs = {
  snappy: {
    type: 'spring',
    stiffness: 450,
    damping: 32,
    mass: 0.8,
  } as Transition,

  smooth: {
    type: 'spring',
    stiffness: 280,
    damping: 26,
    mass: 1,
  } as Transition,

  gentle: {
    type: 'spring',
    stiffness: 180,
    damping: 22,
    mass: 1.1,
  } as Transition,

  bouncy: {
    type: 'spring',
    stiffness: 350,
    damping: 18,
    mass: 0.9,
  } as Transition,
};

/**
 * Durations in seconds
 */
export const durations = {
  instant: 0.1,
  fast: 0.18,
  normal: 0.28,
  slow: 0.45,
};

/**
 * Navbar Tab Order & Directional Variants
 * Used for horizontal slide/float transitions when switching between workspace modules
 */
export const TAB_ORDER: Record<string, number> = {
  '/dashboard': 0,
  '/finance': 1,
  '/tasks': 2,
  '/reminders': 3,
  '/notes': 4,
  '/settings': 5,
};

export const tabDirectionVariants: Variants = {
  initial: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 32 : direction < 0 ? -32 : 0,
    y: direction === 0 ? 8 : 0,
    filter: 'blur(4px)',
  }),
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    filter: 'blur(0px)',
    transition: springs.smooth,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -32 : direction < 0 ? 32 : 0,
    y: direction === 0 ? -8 : 0,
    filter: 'blur(3px)',
    transition: {
      duration: 0.14,
      ease: [0.4, 0, 1, 1],
    },
  }),
};

/**
 * Shared Animation Variants
 */
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: durations.fast, ease: 'easeInOut' },
  },
};

export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: durations.fast } },
  exit: { opacity: 0, transition: { duration: durations.fast } },
};

export const modalDialogVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.94,
    y: 18,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springs.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 12,
    transition: { duration: durations.fast, ease: 'easeOut' },
  },
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: springs.snappy,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: durations.fast },
  },
};

export const cardHoverProps = {
  whileHover: { y: -3, transition: springs.snappy },
  whileTap: { scale: 0.98, transition: springs.snappy },
};

export const buttonPressProps = {
  whileHover: { scale: 1.02, transition: springs.snappy },
  whileTap: { scale: 0.96, transition: springs.snappy },
};
