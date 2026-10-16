import { useEffect, useRef } from 'react';

/**
 * Custom hook to enable smooth mouse-wheel horizontal scrolling
 * for horizontally overflowing containers (e.g. category chips, tag bars).
 */
export function useHorizontalScroll<T extends HTMLElement = HTMLDivElement>() {
  const elRef = useRef<T | null>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // Only intercept if content is wider than container and vertical scrolling predominates
      if (el.scrollWidth > el.clientWidth && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const canScrollLeft = el.scrollLeft > 0;
        const canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;

        if ((e.deltaY > 0 && canScrollRight) || (e.deltaY < 0 && canScrollLeft)) {
          e.preventDefault();
          el.scrollBy({
            left: e.deltaY * 1.2,
            behavior: 'smooth',
          });
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return elRef;
}
