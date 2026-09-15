import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Check,
  X,
  KeyRound,
  Home,
  Scissors,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
  getBarberBookings,
  getMyServices,
  updateBookingStatus,
  verifyBookingOtp,
  BookingData,
} from '@/lib/api';

import { timeAgo, useTimeTick } from '@/lib/timeAgo';
import { supabase } from '@/lib/supabase';

const clayCard =
  'shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]';

const orangeClay =
  'bg-[#ff7417] text-white shadow-[6px_7px_14px_rgba(255,116,23,0.28),inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(190,70,0,0.25)]';

const statusConfig: Record<
  string,
  {
    icon: typeof AlertCircle;
    label: string;
    className: string;
  }
> = {
  pending: {
    icon: AlertCircle,
    label: 'Pending',
    className: 'text-amber-700 bg-amber-50 border-amber-100',
  },
  approved: {
    icon: CheckCircle,
    label: 'Approved',
    className: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed',
    className: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    className: 'text-blue-700 bg-blue-50 border-blue-100',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    className: 'text-red-700 bg-red-50 border-red-100',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    className: 'text-red-700 bg-red-50 border-red-100',
  },
};

type GroupedBooking = BookingData & {
  ids: string[];
};

type BookingCardProps = {
  booking: GroupedBooking;
  customerName: string;
  customerAvatar: string;
  acting: {
    id: string;
    action: 'approved' | 'rejected';
  } | null;
  onStatus: (
    e: React.MouseEvent,
    ids: string[],
    status: 'approved' | 'rejected'
  ) => void;
  otpValue: string;
  onOtpChange: (v: string) => void;
  onVerify: () => void;
  verifying: boolean;
};

function BookingCard({
  booking,
  customerName,
  customerAvatar,
  acting,
  onStatus,
  otpValue,
  onOtpChange,
  onVerify,
  verifying,
}: BookingCardProps) {
  const status = booking.status as keyof typeof statusConfig;
  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const isPending = booking.status === 'pending';
  const isThisActing = !!acting && booking.ids.includes(acting.id);
  const isRejecting = isThisActing && acting?.action === 'rejected';
  const isApproving = isThisActing && acting?.action === 'approved';
  const disableBoth = isThisActing;

  const serviceList = (
    booking.services_list && booking.services_list.length > 0
      ? booking.services_list
      : booking.services && booking.services.length > 0
        ? booking.services
        : [
            {
              id: booking.service_id,
              name: booking.service?.name || '',
              price: Number(booking.service?.price ?? 0),
              duration: booking.service?.duration,
            },
          ]
  ).filter((s) => !!s.name);

  const homeCharge = Number(
    booking.home_service_price ?? booking.home_service_charge ?? 0
  );

  const servicesTotal = serviceList.reduce(
    (sum, s) => sum + (Number(s.price) || 0),
    0
  );

  const grandTotal =
    servicesTotal + (booking.home_service ? homeCharge : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[30px] border border-slate-100 bg-white p-4 sm:p-5"
      style={{
        boxShadow:
          '7px 8px 17px rgba(0,0,0,0.10), -6px -6px 15px rgba(255,255,255,0.95)',
      }}
    >
      {/* Customer + Status */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {customerAvatar ? (
            <img
              src={customerAvatar}
              alt={
                customerName
                  ? `${customerName} profile photo`
                  : 'Customer profile photo'
              }
              loading="lazy"
              className="h-14 w-14 shrink-0 rounded-full border-4 border-white object-cover shadow-[3px_4px_9px_rgba(0,0,0,0.12)] ring-1 ring-orange-100 sm:h-16 sm:w-16"
            />
          ) : (
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#fff0e5] sm:h-16 sm:w-16"
              style={{
                boxShadow:
                  '3px 4px 9px rgba(0,0,0,0.10), -3px -3px 8px rgba(255,255,255,0.95)',
              }}
            >
              {customerName ? (
                <span className="text-lg font-extrabold text-orange-500">
                  {customerName.trim().charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="h-6 w-6 text-orange-500" />
              )}
            </div>
          )}

          <div className="min-w-0">
            <p className="truncate text-base font-extrabold text-slate-950 sm:text-xl">
              {customerName || `Booking #${booking.id.slice(0, 8)}`}
            </p>

            <p className="truncate text-xs text-slate-500 sm:text-sm">
              #{booking.id.slice(0, 8)}
              {booking.created_at
                ? ` · ${timeAgo(booking.created_at)}`
                : ''}
            </p>
          </div>
        </div>

        {/* Approved / Status */}
        <motion.span
          whileHover={{ y: -1, scale: 1.02 }}
          className={cn(
            'flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold sm:px-5 sm:py-3 sm:text-base',
            config.className
          )}
          style={{
            boxShadow:
              status === 'approved' || status === 'confirmed'
                ? '5px 6px 13px rgba(16,185,129,0.20), inset 2px 2px 4px rgba(255,255,255,0.90), inset -3px -3px 5px rgba(16,185,129,0.12)'
                : '4px 5px 11px rgba(0,0,0,0.08), inset 2px 2px 4px rgba(255,255,255,0.90)',
          }}
        >
          <span
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8',
              status === 'approved' || status === 'confirmed'
                ? 'bg-emerald-400 text-white'
                : 'bg-white/80'
            )}
          >
            <StatusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>

          {config.label}
        </motion.span>
      </div>

      {/* Date + Time */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div
          className="flex min-w-0 items-center gap-3 rounded-[24px] border border-slate-100 bg-[#f8faff] px-3 py-4 sm:px-5"
          style={{
            boxShadow:
              '5px 6px 13px rgba(0,0,0,0.08), inset 2px 2px 4px rgba(255,255,255,0.95), inset -2px -2px 4px rgba(120,140,170,0.06)',
          }}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-500 sm:h-12 sm:w-12">
            <Calendar className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
              Date
            </p>

            <p className="truncate text-base font-extrabold text-slate-950 sm:text-xl">
              {new Date(booking.date).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>

        <div
          className="flex min-w-0 items-center gap-3 rounded-[24px] border border-orange-100 bg-[#fff8ef] px-3 py-4 sm:px-5"
          style={{
            boxShadow:
              '5px 6px 13px rgba(0,0,0,0.08), inset 2px 2px 4px rgba(255,255,255,0.95), inset -2px -2px 4px rgba(255,116,23,0.08)',
          }}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#fff0df] text-orange-500 sm:h-12 sm:w-12">
            <Clock className="h-6 w-6" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 sm:text-xs">
              Time
            </p>

            <p className="truncate text-base font-extrabold text-slate-950 sm:text-xl">
              {booking.time_slot}
            </p>
          </div>
        </div>
      </div>

      {/* Services */}
      <div
        className="mb-4 rounded-[26px] border border-slate-100 bg-[#fbfcff] p-3 sm:p-4"
        style={{
          boxShadow:
            '5px 6px 14px rgba(0,0,0,0.07), inset 2px 2px 5px rgba(255,255,255,0.95)',
        }}
      >
        <div className="mb-3 flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff0e5] text-orange-500">
              <Scissors className="h-5 w-5" />
            </div>

            <span className="text-sm font-extrabold uppercase tracking-wide text-slate-800 sm:text-base">
              Services
            </span>
          </div>

          <span
            className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700"
            style={{
              boxShadow:
                '3px 4px 8px rgba(0,0,0,0.07), -2px -2px 6px rgba(255,255,255,0.95)',
            }}
          >
            {serviceList.length} items
          </span>
        </div>

        <div className="space-y-2">
          {serviceList.map((s, i) => (
            <div
              key={s.id || `${s.name}-${i}`}
              className="flex items-center justify-between gap-3 rounded-[20px] border border-slate-100 bg-white px-4 py-3 sm:px-5 sm:py-4"
              style={{
                boxShadow:
                  '4px 5px 11px rgba(0,0,0,0.07), -3px -3px 9px rgba(255,255,255,0.95)',
              }}
            >
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-slate-950 sm:text-lg">
                  {s.name}
                </p>

                {s.duration ? (
                  <p className="text-xs font-medium text-slate-500 sm:text-sm">
                    {s.duration} min
                  </p>
                ) : null}
              </div>

              <span
                className="shrink-0 rounded-full bg-[#fafbfe] px-4 py-2 text-sm font-extrabold text-slate-950 sm:text-base"
                style={{
                  boxShadow:
                    '3px 4px 8px rgba(0,0,0,0.07), -2px -2px 6px rgba(255,255,255,0.95)',
                }}
              >
                ₹{Number(s.price ?? 0)}
              </span>
            </div>
          ))}
        </div>

        {booking.home_service && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded-[20px] bg-white px-4 py-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              <Home className="h-4 w-4" />
              Home Service
            </span>

            <span className="text-sm font-extrabold text-slate-800">
              {homeCharge > 0 ? `₹${homeCharge}` : 'Included'}
            </span>
          </div>
        )}
      </div>

      {/* Grand Total */}
      <div
        className="mb-4 rounded-[26px] border border-slate-100 bg-white px-5 py-4 sm:px-6 sm:py-5"
        style={{
          boxShadow:
            '6px 7px 15px rgba(0,0,0,0.08), -4px -4px 11px rgba(255,255,255,0.95)',
        }}
      >
        <p className="text-xs font-extrabold uppercase tracking-wider text-slate-600 sm:text-sm">
          Grand Total
        </p>

        <p className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
          ₹{grandTotal}
        </p>
      </div>

      {/* Pending Actions */}
      {isPending && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Button
            type="button"
            disabled={disableBoth}
            onClick={(e) =>
              onStatus(e, booking.ids, 'rejected')
            }
            className="h-11 rounded-[18px] bg-red-500 px-3 text-sm font-extrabold text-white shadow-[5px_6px_12px_rgba(239,68,68,0.20),inset_2px_2px_4px_rgba(255,255,255,0.25),inset_-3px_-3px_5px_rgba(180,0,0,0.18)] hover:bg-red-600"
          >
            {isRejecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Reject
              </>
            )}
          </Button>

          <Button
            type="button"
            disabled={disableBoth}
            onClick={(e) =>
              onStatus(e, booking.ids, 'approved')
            }
            className="h-11 rounded-[18px] bg-emerald-500 px-3 text-sm font-extrabold text-white shadow-[5px_6px_12px_rgba(16,185,129,0.20),inset_2px_2px_4px_rgba(255,255,255,0.28),inset_-3px_-3px_5px_rgba(0,120,70,0.18)] hover:bg-emerald-600"
          >
            {isApproving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Accept
              </>
            )}
          </Button>
        </div>
      )}

      {/* OTP */}
      {booking.status === 'approved' && (
        <div
          className="rounded-[26px] border border-orange-100 bg-[#fffaf5] p-4 sm:p-5"
          style={{
            boxShadow:
              '6px 7px 15px rgba(0,0,0,0.08), -4px -4px 11px rgba(255,255,255,0.95)',
          }}
        >
          <label className="mb-3 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-slate-800 sm:text-sm">
            <KeyRound className="h-5 w-5 text-slate-900" />
            Verify Customer OTP
          </label>

          <div className="flex items-center gap-3">
            <Input
              inputMode="numeric"
              placeholder="Enter OTP"
              value={otpValue}
              onChange={(e) =>
                onOtpChange(
                  e.target.value.replace(/\D/g, '').slice(0, 8)
                )
              }
              className="h-12 rounded-[20px] border-slate-200 bg-white text-center text-base font-mono tracking-[0.25em] text-slate-800 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.95)] focus-visible:ring-orange-400 sm:h-14 sm:text-lg"
              disabled={verifying}
            />

            <Button
              type="button"
              onClick={onVerify}
              disabled={verifying}
              className={`h-12 rounded-[20px] px-6 text-sm font-extrabold transition-all duration-200 active:translate-y-[2px] active:scale-[0.97] sm:h-14 sm:px-8 sm:text-base ${orangeClay}`}
            >
              {verifying ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Verify'
              )}
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function BarberBookings() {
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState('upcoming');

  const [acting, setActing] = useState<{
    id: string;
    action: 'approved' | 'rejected';
  } | null>(null);

  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, string>
  >({});

  useTimeTick(60000);

  const {
    data: rawBookings = [],
    isLoading: loading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['barberBookings'],
    queryFn: async () => {
      const res = await getBarberBookings();

      if (!res.success) {
        throw new Error(
          res.error || 'Failed to fetch bookings'
        );
      }

      return res.data || [];
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const { data: myServices = [] } = useQuery({
    queryKey: ['myServicesForBookings'],
    queryFn: async () => {
      const res = await getMyServices();

      return res.success && res.data ? res.data : [];
    },
    staleTime: 60_000,
  });

  const bookings = rawBookings.map((b) => {
    const s = myServices.find((x) => x.id === b.service_id);

    const enriched = s
      ? {
          ...b,
          service: {
            name: s.name,
            price: s.price,
            duration: s.duration,
            ...(b.service || {}),
          },
        }
      : {
          ...b,
        };

    const list =
      b.services_list && b.services_list.length > 0
        ? b.services_list
        : null;

    if (list) {
      enriched.services_list = list.map((item, i) => {
        const found = myServices.find(
          (x) => x.id === item.id
        );

        return {
          id: item.id ?? `svc-${i}`,
          name: item.name || found?.name || '',
          price: Number(
            item.price ?? found?.price ?? 0
          ),
          duration:
            item.duration ?? found?.duration,
        };
      });
    } else {
      const ids =
        b.service_ids && b.service_ids.length > 0
          ? b.service_ids
          : null;

      if (!enriched.services && ids) {
        enriched.services = ids.map((id) => {
          const found = myServices.find(
            (x) => x.id === id
          );

          return {
            id,
            name: found?.name || '',
            price: Number(found?.price ?? 0),
            duration: found?.duration,
          };
        });
      }
    }

    enriched.status =
      statusOverrides[b.id] || b.status;

    return enriched;
  });

  const groupedBookings: GroupedBooking[] = (() => {
    const map = new Map<string, GroupedBooking>();

    for (const b of bookings) {
      const uid =
        b.user_id || b.customer_id || 'unknown';

      const key = `${uid}|${b.date}|${b.time_slot}|${b.status}`;

      const items =
        b.services_list &&
        b.services_list.length > 0
          ? b.services_list
          : b.services &&
              b.services.length > 0
            ? b.services
            : [
                {
                  id: b.service_id,
                  name: b.service?.name || '',
                  price: Number(
                    b.service?.price ?? 0
                  ),
                  duration: b.service?.duration,
                },
              ];

      const existing = map.get(key);

      if (existing) {
        existing.ids.push(b.id);

        existing.services_list = [
          ...(existing.services_list || []),
          ...items,
        ];

        existing.home_service =
          existing.home_service ||
          b.home_service;

        if (!existing.otp && b.otp) {
          existing.otp = b.otp;
        }
      } else {
        map.set(key, {
          ...b,
          ids: [b.id],
          services_list: items,
        });
      }
    }

    return Array.from(map.values());
  })();

  const userIds = Array.from(
    new Set(
      bookings
        .map((b) => b.user_id || b.customer_id)
        .filter(
          (v): v is string => !!v
        )
    )
  );

  const userIdsKey = userIds
    .slice()
    .sort()
    .join(',');

  const { data: profileMap = {} } = useQuery({
    queryKey: [
      'bookingCustomerProfiles',
      userIdsKey,
    ],
    queryFn: async () => {
      if (userIds.length === 0) {
        return {};
      }

      const map: Record<
        string,
        {
          name: string;
          avatar_url: string;
        }
      > = {};

      const full = await supabase
        .from('profiles')
        .select(
          'id, full_name, name, email, avatar_url'
        )
        .in('id', userIds);

      const rows = full.error
        ? (
            await supabase
              .from('profiles')
              .select(
                'id, name, email, avatar_url'
              )
              .in('id', userIds)
          ).data
        : full.data;

      for (const row of rows || []) {
        const r = row as {
          id?: string;
          full_name?: string;
          name?: string;
          email?: string;
          avatar_url?: string;
        };

        if (r?.id) {
          map[r.id] = {
            name:
              r.full_name ||
              r.name ||
              r.email ||
              '',
            avatar_url:
              r.avatar_url || '',
          };
        }
      }

      return map;
    },
    enabled: userIds.length > 0,
    staleTime: 60_000,
  });

  const nameFor = (b: BookingData) => {
    const uid =
      b.user_id || b.customer_id;

    return (
      b.user?.full_name ||
      b.user?.name ||
      (uid
        ? profileMap[uid]?.name
        : '') ||
      b.user?.email ||
      ''
    );
  };

  const avatarFor = (b: BookingData) => {
    const uid =
      b.user_id || b.customer_id;

    return (
      (uid
        ? profileMap[uid]?.avatar_url
        : '') || ''
    );
  };

  const handleVerifyOtp = async (
    bookingId: string
  ) => {
    const otp =
      (otpInputs[bookingId] || '').trim();

    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    setVerifyingId(bookingId);

    try {
      const res = await verifyBookingOtp(
        bookingId,
        otp
      );

      if (res.success) {
        toast.success('Service Completed');

        setOtpInputs((p) => ({
          ...p,
          [bookingId]: '',
        }));

        setStatusOverrides((p) => ({
          ...p,
          [bookingId]: 'completed',
        }));

        qc.invalidateQueries({
          queryKey: ['barberBookings'],
        });

        qc.invalidateQueries({
          queryKey: ['myBookings'],
        });

        qc.invalidateQueries({
          queryKey: ['bookedSlots'],
        });
      } else {
        toast.error(
          res.error || 'Invalid OTP'
        );
      }
    } finally {
      setVerifyingId(null);
    }
  };

  const handleStatus = (
    e: React.MouseEvent,
    ids: string[],
    status: 'approved' | 'rejected'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (acting) return;

    setStatusOverrides((p) => {
      const next = { ...p };

      for (const id of ids) {
        next[id] = status;
      }

      return next;
    });

    toast.success(
      status === 'approved'
        ? 'Booking accepted'
        : 'Booking rejected'
    );

    void (async () => {
      const results = await Promise.all(
        ids.map((id) =>
          updateBookingStatus(id, status)
        )
      );

      const failed = results.some(
        (r) => !r.success
      );

      if (failed) {
        toast.error(
          results.find((r) => !r.success)?.error ||
            'Action failed, reverted'
        );

        setStatusOverrides((p) => {
          const next = { ...p };

          for (const id of ids) {
            delete next[id];
          }

          return next;
        });
      }

      qc.invalidateQueries({
        queryKey: ['barberBookings'],
      });

      qc.invalidateQueries({
        queryKey: ['myBookings'],
      });

      qc.invalidateQueries({
        queryKey: ['bookedSlots'],
      });
    })();
  };

  const pendingBookings =
    groupedBookings.filter(
      (b) => b.status === 'pending'
    );

  const upcomingBookings =
    groupedBookings.filter(
      (b) =>
        b.status === 'pending' ||
        b.status === 'confirmed' ||
        b.status === 'approved'
    );

  const pastBookings =
    groupedBookings.filter(
      (b) =>
        b.status === 'completed' ||
        b.status === 'cancelled' ||
        b.status === 'rejected'
    );

  const renderBookingCard = (
    booking: GroupedBooking
  ) => (
    <BookingCard
      key={booking.ids.join('-')}
      booking={booking}
      customerName={nameFor(booking)}
      customerAvatar={avatarFor(booking)}
      acting={acting}
      onStatus={handleStatus}
      otpValue={
        otpInputs[booking.ids[0]] || ''
      }
      onOtpChange={(v) =>
        setOtpInputs((p) => ({
          ...p,
          [booking.ids[0]]: v,
        }))
      }
      onVerify={() =>
        handleVerifyOtp(booking.ids[0])
      }
      verifying={
        verifyingId === booking.ids[0]
      }
    />
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-white">
        <Loader2 className="h-9 w-9 animate-spin text-orange-500" />

        <p className="mt-4 text-sm font-medium text-slate-500">
          Loading bookings...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-full overflow-hidden bg-white px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-5">
          <div className="flex items-center justify-between gap-4">
            <h1 className="min-w-0 whitespace-nowrap text-[30px] font-black leading-none tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-6xl">
              Customer{' '}
              <span className="text-[#ff7417] drop-shadow-[2px_3px_1px_rgba(255,116,23,0.22)]">
                Bookings
              </span>

              {pendingBookings.length > 0 && (
                <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-2 align-middle text-[10px] font-bold text-white shadow-sm sm:h-8 sm:min-w-[30px] sm:text-xs">
                  {pendingBookings.length}
                </span>
              )}
            </h1>
          </div>

          <p className="mt-2 whitespace-nowrap text-sm font-semibold text-slate-500 sm:text-lg">
            Manage your customer appointments
          </p>

          {/* Full Width Refresh */}
          <motion.div
            whileHover={{
              y: -1,
              scale: 1.01,
            }}
            whileTap={{
              y: 2,
              scale: 0.985,
            }}
            onClick={() => {
              if (!isFetching) {
                void refetch();
              }
            }}
            className={cn(
              'mt-5 flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-[22px] text-base font-extrabold transition-all duration-200 sm:h-16 sm:text-xl',
              orangeClay,
              isFetching &&
                'cursor-not-allowed opacity-80'
            )}
          >
            <RefreshCw
              className={cn(
                'h-6 w-6 sm:h-7 sm:w-7',
                isFetching && 'animate-spin'
              )}
            />

            {isFetching
              ? 'Refreshing...'
              : 'Refresh'}
          </motion.div>
        </div>

        {/* Upcoming / Past */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList
            className="mb-5 grid h-auto w-full grid-cols-2 gap-3 rounded-[26px] border-0 bg-white p-2"
            style={{
              boxShadow:
                '6px 7px 16px rgba(0,0,0,0.09), -5px -5px 13px rgba(255,255,255,0.95)',
            }}
          >
            <TabsTrigger
              value="upcoming"
              className="h-12 rounded-[20px] px-3 text-sm font-extrabold text-slate-600 transition-all duration-200 data-[state=active]:bg-[#ff7417] data-[state=active]:text-white data-[state=active]:shadow-[5px_6px_12px_rgba(255,116,23,0.28),inset_2px_2px_4px_rgba(255,255,255,0.28),inset_-3px_-3px_5px_rgba(190,70,0,0.22)] sm:h-14 sm:text-lg"
            >
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>

            <TabsTrigger
              value="past"
              className="h-12 rounded-[20px] px-3 text-sm font-extrabold text-slate-500 transition-all duration-200 data-[state=active]:bg-[#ff7417] data-[state=active]:text-white data-[state=active]:shadow-[5px_6px_12px_rgba(255,116,23,0.28),inset_2px_2px_4px_rgba(255,255,255,0.28),inset_-3px_-3px_5px_rgba(190,70,0,0.22)] sm:h-14 sm:text-lg"
            >
              Past ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Upcoming */}
          <TabsContent value="upcoming">
            {upcomingBookings.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {upcomingBookings.map((booking) =>
                  renderBookingCard(booking)
                )}
              </div>
            ) : (
              <div
                className="rounded-[30px] bg-white py-14 text-center"
                style={{
                  boxShadow:
                    '7px 8px 17px rgba(0,0,0,0.08), -6px -6px 15px rgba(255,255,255,0.95)',
                }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0e5]">
                  <Calendar className="h-7 w-7 text-orange-400" />
                </div>

                <p className="text-base font-extrabold text-slate-800">
                  No upcoming bookings
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  New customer appointments will appear here.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Past */}
          <TabsContent value="past">
            {pastBookings.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {pastBookings.map((booking) =>
                  renderBookingCard(booking)
                )}
              </div>
            ) : (
              <div
                className="rounded-[30px] bg-white py-14 text-center"
                style={{
                  boxShadow:
                    '7px 8px 17px rgba(0,0,0,0.08), -6px -6px 15px rgba(255,255,255,0.95)',
                }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#fff0e5]">
                  <Calendar className="h-7 w-7 text-orange-400" />
                </div>

                <p className="text-base font-extrabold text-slate-800">
                  No past bookings
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  Completed or cancelled bookings will appear here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}