import { useEffect, useRef, useState } from 'react';

/** Returns true when the header should be visible; hides when scrolling down, shows when scrolling up. */
export function useHideOnScroll(threshold = 8) {
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (y < 40) {
          setVisible(true);
        } else if (Math.abs(delta) > threshold) {
          setVisible(delta < 0);
          lastY.current = y;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return visible;
}
