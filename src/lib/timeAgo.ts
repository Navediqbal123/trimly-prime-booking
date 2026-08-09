import { useEffect, useState } from 'react';

/** Human, real-time relative timestamp: "Just now", "2 min ago", "1 hour ago". */
export function timeAgo(iso?: string | null): string {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (isNaN(t)) return '';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'Just now';
  const m = Math.floor(s / 60);
  if (m < 60) return m === 1 ? '1 min ago' : `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return h === 1 ? '1 hour ago' : `${h} hours ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? '1 day ago' : `${d} days ago`;
}

/** Re-renders the component periodically so relative timestamps stay live. */
export function useTimeTick(intervalMs = 20000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((v) => v + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
