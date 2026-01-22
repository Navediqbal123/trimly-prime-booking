import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number;
  delay?: number;
  formatter?: (value: number) => string;
}

export function useCountUp(
  endValue: number,
  options: UseCountUpOptions = {}
): string {
  const { duration = 1000, delay = 0, formatter = (v) => v.toString() } = options;
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const startValue = 0;
    
    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current - delay;
      
      if (elapsed < 0) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const progress = Math.min(elapsed / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.floor(easeOutQuart * (endValue - startValue) + startValue);
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [endValue, duration, delay]);

  return formatter(displayValue);
}
