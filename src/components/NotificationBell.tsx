import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Loader2, X, Inbox } from 'lucide-react';
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
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  const openPanel = async () => {
    setOpen(true);
    await load();
    if (unread > 0) {
      await markNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <>
      <button
        onClick={openPanel}
        aria-label="Notifications"
        className={cn(
          'relative h-11 w-11 rounded-full flex items-center justify-center hover:bg-secondary/60 transition-colors',
          className,
        )}
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
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
            />
            <motion.aside
              key="panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
              className="fixed inset-0 h-full w-full bg-background z-[61] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div>
                  <h2 className="text-xl font-display font-bold">Notifications</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {items.length} total{unread > 0 ? ` · ${unread} new` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close notifications"
                  className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-secondary/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-4">
                      <Inbox className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="font-medium text-foreground">You're all caught up</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  items.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.25 }}
                      className={cn(
                        'rounded-2xl p-4 border transition-colors',
                        !n.read
                          ? 'bg-primary/5 border-primary/30'
                          : 'bg-card border-border',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {!n.read && (
                          <span className="mt-1.5 w-2 h-2 rounded-full bg-primary shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground leading-relaxed">
                            {n.message}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-2">
                            {timeAgo(n.created_at)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
