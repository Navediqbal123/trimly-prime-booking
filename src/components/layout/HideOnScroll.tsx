import { motion } from 'framer-motion';
import { useHideOnScroll } from '@/hooks/useHideOnScroll';
import { cn } from '@/lib/utils';

interface HideOnScrollProps {
  children: React.ReactNode;
  className?: string;
}

/** Slides children up out of view on scroll-down, back in on scroll-up. */
export function HideOnScroll({ children, className }: HideOnScrollProps) {
  const visible = useHideOnScroll();
  return (
    <motion.div
      initial={false}
      animate={{ y: visible ? 0 : -140, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
}
