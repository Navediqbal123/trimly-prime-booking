import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Loader2, ArrowLeft, Inbox, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNotifications, markNotificationsRead, NotificationData } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { timeAgo, useTimeTick } from '@/lib/timeAgo';

type ProfileInfo = { name?: string | null; avatar_url?: string | null };


export function NotificationBell({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationData[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({});
  const [loading, setLoading] = useState(false);
  // Re-render periodically so relative timestamps stay live.
  useTimeTick(60000);

  const unread = items.filter((n) => !n.read).length;

  const loadProfiles = async (list: NotificationData[]) => {
    const ids = Array.from(
      new Set(
        list
          .map((n) => n.actor_id || n.customer_id || n.user_id)
          .filter((id): id is string => !!id),
      ),
    );
    if (ids.length === 0) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', ids);
    if (data) {
      setProfiles((prev) => {
        const next = { ...prev };
        for (const p of data as any[]) next[p.id] = { name: p.name, avatar_url: p.avatar_url };
        return next;
      });
    }
  };

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await getNotifications();
    if (res.success && Array.isArray(res.data)) {
      setItems(res.data);
      loadProfiles(res.data);
    }
    if (!silent) setLoading(false);
  };


  useEffect(() => {
    load();
    // Refresh notifications + unread badge count every 30s in the background.
    const t = setInterval(() => load(true), 30000);
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
              style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9998 }}
              className="bg-black/40"
            />
            <motion.aside
              key="panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.4 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9999,
                backgroundColor: '#ffffff',
              }}
              className="flex flex-col shadow-2xl"
            >
              <div className="flex items-center gap-3 px-4 py-4 border-b border-black/10">
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Back"
                  className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-black/5 transition-colors shrink-0"
                >
                  <ArrowLeft className="w-6 h-6 text-black" />
                </button>
                <div className="min-w-0">
                  <h2 className="text-xl font-display font-bold text-black">Notifications</h2>
                  <p className="text-xs text-black/60 mt-0.5">
                    {items.length} total{unread > 0 ? ` · ${unread} new` : ''}
                  </p>
                </div>
              </div>


              <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 animate-spin text-black/40" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center mb-4">
                      <Inbox className="w-8 h-8 text-black/40" />
                    </div>
                    <p className="font-medium text-black">You're all caught up</p>
                    <p className="text-sm text-black/60 mt-1">No notifications yet</p>
                  </div>
                ) : (
                  items.map((n, i) => {
                    const pid = n.actor_id || n.customer_id || n.user_id;
                    const prof = pid ? profiles[pid] : undefined;
                    const name = n.name || prof?.name || 'Trimly';
                    const avatar = n.avatar_url || prof?.avatar_url || '';
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.25 }}
                        className={cn(
                          'rounded-2xl p-4 border transition-colors bg-white',
                          !n.read ? 'border-primary/40 shadow-sm' : 'border-black/10',
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-full overflow-hidden bg-black/5 flex items-center justify-center shrink-0">
                            {avatar ? (
                              <img src={avatar} alt={name} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-black/50" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-black truncate">{name}</p>
                              {!n.read && (
                                <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-black/80 leading-relaxed mt-0.5 break-words">
                              {n.message}
                            </p>
                            <p className="text-[11px] text-black/50 mt-2 text-right">
                              {timeAgo(n.created_at)}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
