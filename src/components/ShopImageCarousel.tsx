import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  images: string[];
  alt: string;
  interval?: number;
  className?: string;
  onImageChange?: (image: string) => void;
  fallback?: ReactNode;
}

/** Auto-sliding carousel with swipe/drag support. */
export function ShopImageCarousel({
  images,
  alt,
  interval = 3000,
  className,
  onImageChange,
  fallback,
}: Props) {
  const [index, setIndex] = useState(0);
  const paused = useRef(false);
  const [failedImages, setFailedImages] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const image = images[index];
    if (image) onImageChange?.(image);
  }, [images, index, onImageChange]);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => {
      if (!paused.current) setIndex((i) => (i + 1) % images.length);
    }, interval);
    return () => clearInterval(t);
  }, [images.length, interval]);

  if (images.length === 0) return null;

  return (
    <div
      className={className}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div className="relative w-full h-full overflow-hidden">
        <AnimatePresence initial={false} mode="popLayout">
          {failedImages.has(images[index]) && fallback ? (
            <motion.div
              key={`fallback-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              role="img"
              aria-label={`${alt} image unavailable`}
            >
              {fallback}
            </motion.div>
          ) : (
            <motion.img
              key={index}
              src={images[index]}
              alt={alt}
              drag={images.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) setIndex((i) => (i + 1) % images.length);
                else if (info.offset.x > 60) setIndex((i) => (i - 1 + images.length) % images.length);
              }}
              onError={() => {
                if (fallback) {
                  setFailedImages((current) => new Set(current).add(images[index]));
                }
              }}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
              draggable={false}
            />
          )}
        </AnimatePresence>
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                aria-label={`Slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
