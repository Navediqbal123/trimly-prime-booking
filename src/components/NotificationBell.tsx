import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNotifications, markNotificationsRead, NotificationData } from '@/lib/api';

function timeAgo(iso: string) {
  const d = new Date(iso).getTime();
  if (isNaN(d)) return '';
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const day = Math.floor(h / 24);
  return `${day}d ago`;
}

export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationData[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = items.filter((n) => !n.read).length;

  const load = async () => {
    setLoading(true);
    const res = await getNotifications();
    if (res.success && Array.isArray(res.data)) setItems(res.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await markNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative h-11 w-11 rounded-full flex items-center justify-center hover:bg-secondary/60 transition-colors"
      >
        <Bell className="w-6 h-6 text-foreground" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-background">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-popover border border-border shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-display font-semibold text-sm">Notifications</span>
              {unread > 0 && (
                <span className="text-xs text-muted-foreground">{unread} new</span>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="text-center py-10 px-4 text-sm text-muted-foreground">
                  No notifications yet
                </div>
              ) : (
                items.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'px-4 py-3 border-b border-border/60 last:border-0 hover:bg-secondary/40 transition-colors',
                      !n.read && 'bg-primary/5',
                    )}
                  >
                    <p className="text-sm text-foreground leading-snug">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {timeAgo(n.created_at)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
