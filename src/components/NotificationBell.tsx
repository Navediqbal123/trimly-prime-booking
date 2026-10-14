import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Loader2, ArrowLeft, Inbox, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getNotifications,
  markNotificationsRead,
  NotificationData,
} from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { timeAgo, useTimeTick } from '@/lib/timeAgo';

type ProfileInfo = {
  name?: string | null;
  avatar_url?: string | null;
};

export function NotificationBell({
  className,
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationData[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileInfo>>({});
  const [loading, setLoading] = useState(false);

  useTimeTick(60000);

  const isUnread = (notification: NotificationData) => {
    if (typeof notification.read === 'boolean') {
      return !notification.read;
    }

    if (typeof notification.is_read === 'boolean') {
      return !notification.is_read;
    }

    if ('read_at' in notification) {
      return !notification.read_at;
    }

    return false;
  };

  const unread = items.filter(isUnread).length;

  const loadProfiles = async (list: NotificationData[]) => {
    const ids = Array.from(
      new Set(
        list
          .map((n) => n.actor_id || n.customer_id || n.user_id)
          .filter((id): id is string => !!id)
      )
    );

    if (ids.length === 0) return;

    const { data } = await supabase
      .from('profiles')
      .select('id, name, avatar_url')
      .in('id', ids);

    if (data) {
      setProfiles((prev) => {
        const next = { ...prev };

        for (const p of data as any[]) {
          next[p.id] = {
            name: p.name,
            avatar_url: p.avatar_url,
          };
        }

        return next;
      });
    }
  };

  const load = async (
    silent = false
  ): Promise<NotificationData[]> => {
    if (!silent) setLoading(true);

    const res = await getNotifications();

    if (res.success && Array.isArray(res.data)) {
      setItems(res.data);
      loadProfiles(res.data);

      if (!silent) setLoading(false);

      return res.data;
    }

    if (!silent) setLoading(false);

    return [];
  };

  useEffect(() => {
    load();

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

    const latestItems = await load();

    if (latestItems.some(isUnread)) {
      setItems((prev) =>
        prev.map((n) => ({
          ...n,
          read: true,
          is_read: true,
        }))
      );

      await markNotificationsRead();
    }
  };

  return (
    <>
      {/* Orange 3D Notification Button */}
      <button
        type="button"
        onClick={openPanel}
        aria-label={
          unread > 0
            ? `Notifications, ${unread} unread`
            : 'Notifications'
        }
        className={cn(
          `
            relative flex h-12 w-12 shrink-0 items-center justify-center
            rounded-full
            bg-gradient-to-b from-[#ff963f] to-[#ff7417]
            text-white
            shadow-[inset_0_2px_3px_rgba(255,255,255,0.35),inset_0_-3px_4px_rgba(190,65,0,0.18),0_5px_10px_rgba(255,116,23,0.20)]
            transition-transform duration-150
            active:scale-95
          `,
          className
        )}
      >
        <Bell
          className="h-6 w-6"
          strokeWidth={2.2}
        />

        {unread > 0 && (
          <span
            className="
              absolute -right-0.5 -top-0.5
              flex h-[19px] min-w-[19px] items-center justify-center
              rounded-full border-2 border-white
              bg-red-500 px-1
              text-[10px] font-bold text-white
            "
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
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
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                zIndex: 9998,
              }}
              className="bg-black/40"
            />

            <motion.aside
              key="panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                type: 'tween',
                ease: [0.22, 1, 0.36, 1],
                duration: 0.4,
              }}
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
              {/* Panel Header */}
              <div className="flex items-center gap-3 border-b border-black/10 px-4 py-4">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Back"
                  className="
                    flex h-10 w-10 shrink-0 items-center justify-center
                    rounded-full bg-white text-[#ff7417]
                    shadow-[3px_4px_8px_rgba(0,0,0,0.08)]
                    transition-transform active:scale-95
                  "
                >
                  <ArrowLeft className="h-6 w-6" />
                </button>

                <div className="min-w-0">
                  <h2 className="text-xl font-display font-bold text-black">
                    Notifications
                  </h2>

                  <p className="mt-0.5 text-xs text-black/60">
                    {items.length} total
                    {unread > 0 ? ` · ${unread} new` : ''}
                  </p>
                </div>
              </div>

              {/* Notification List */}
              <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-6 w-6 animate-spin text-[#ff7417]" />
                  </div>
                ) : items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff3e8]">
                      <Inbox className="h-8 w-8 text-[#ff7417]" />
                    </div>

                    <p className="font-medium text-black">
                      You're all caught up
                    </p>

                    <p className="mt-1 text-sm text-black/60">
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  items.map((n, i) => {
                    const pid =
                      n.actor_id || n.customer_id || n.user_id;

                    const prof = pid ? profiles[pid] : undefined;
                    const name = n.name || prof?.name || 'TrimlyHub';
                    const avatar = n.avatar_url || prof?.avatar_url || '';

                    const otp =
                      (n as any).otp ||
                      n.message?.match(
                        /otp[^0-9]{0,15}(\d{4,6})/i
                      )?.[1] ||
                      '';

                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: i * 0.03,
                          duration: 0.25,
                        }}
                        className={cn(
                          'rounded-2xl border bg-white p-4 transition-colors',
                          isUnread(n)
                            ? 'border-[#ff7417]/40 shadow-sm'
                            : 'border-black/10'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#fff3e8]">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-[#ff7417]" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-black">
                                {name}
                              </p>

                              {isUnread(n) && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-[#ff7417]" />
                              )}
                            </div>

                            <p className="mt-0.5 break-words text-sm leading-relaxed text-black/80">
                              {n.message}
                            </p>

                            {otp && (
                              <div className="mt-3 rounded-xl border-2 border-[#ff7417]/40 bg-[#fff3e8] px-4 py-3">
                                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-black/60">
                                  Verification OTP
                                </p>

                                <p className="text-3xl font-display font-bold tracking-[0.3em] text-black">
                                  {otp}
                                </p>
                              </div>
                            )}

                            <p className="mt-2 text-right text-[11px] text-black/50">
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