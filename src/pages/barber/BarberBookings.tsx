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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    className: 'text-amber-600 bg-amber-50 border-amber-100',
  },
  approved: {
    icon: CheckCircle,
    label: 'Approved',
    className: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed',
    className: 'text-emerald-600 bg-emerald-50 border-emerald-100',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    className: 'text-blue-600 bg-blue-50 border-blue-100',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    className: 'text-red-600 bg-red-50 border-red-100',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    className: 'text-red-600 bg-red-50 border-red-100',
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
      className="group relative overflow-hidden rounded-2xl border border-orange-100/80 bg-white/75 p-3.5 shadow-[0_8px_28px_rgba(15,23,42,0.05)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(249,115,22,0.10)] sm:p-4"
    >
      {/* Soft orange glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-orange-200/25 blur-3xl transition-all group-hover:bg-orange-300/30" />

      <div className="relative">
        {/* Customer + Status */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            {customerAvatar ? (
              <img
                src={customerAvatar}
                alt={
                  customerName
                    ? `${customerName} profile photo`
                    : 'Customer profile photo'
                }
                loading="lazy"
                className="h-10 w-10 shrink-0 rounded-full border-2 border-white object-cover shadow-sm ring-1 ring-orange-100"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-100 bg-orange-50">
                {customerName ? (
                  <span className="text-sm font-bold text-orange-500">
                    {customerName.trim().charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="h-4 w-4 text-orange-500" />
                )}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-900">
                {customerName || `Booking #${booking.id.slice(0, 8)}`}
              </p>

              <p className="truncate text-[10px] text-slate-400">
                #{booking.id.slice(0, 8)}
                {booking.created_at
                  ? ` · ${timeAgo(booking.created_at)}`
                  : ''}
              </p>
            </div>
          </div>

          <span
            className={cn(
              'flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold',
              config.className
            )}
          >
            <StatusIcon className="h-3 w-3" />
            {config.label}
          </span>
        </div>

        {/* Date + Time compact row */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-2.5 py-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-orange-500" />

            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Date
              </p>

              <p className="truncate text-xs font-bold text-slate-700">
                {new Date(booking.date).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50/50 px-2.5 py-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-orange-500" />

            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Time
              </p>

              <p className="truncate text-xs font-bold text-slate-700">
                {booking.time_slot}
              </p>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="mb-3 overflow-hidden rounded-xl border border-orange-100/70 bg-white/60">
          <div className="flex items-center justify-between border-b border-orange-100/60 px-3 py-2">
            <div className="flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5 text-orange-500" />

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Services
              </span>
            </div>

            <span className="rounded-full bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold text-orange-600">
              {serviceList.length}
            </span>
          </div>

          {serviceList.map((s, i) => (
            <div
              key={s.id || `${s.name}-${i}`}
              className="flex items-center justify-between gap-2 border-b border-slate-100/80 px-3 py-2 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold text-slate-700">
                  {s.name}
                </p>

                {s.duration ? (
                  <p className="text-[9px] text-slate-400">
                    {s.duration} min
                  </p>
                ) : null}
              </div>

              <span className="shrink-0 text-xs font-bold text-slate-700">
                ₹{Number(s.price ?? 0)}
              </span>
            </div>
          ))}

          {booking.home_service && (
            <div className="flex items-center justify-between gap-2 border-t border-slate-100/80 px-3 py-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-600">
                <Home className="h-3 w-3" />
                Home Service
              </span>

              <span className="text-xs font-bold text-slate-700">
                {homeCharge > 0 ? `₹${homeCharge}` : 'Included'}
              </span>
            </div>
          )}
        </div>

        {/* Total + Actions */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Grand Total
            </p>

            <p className="text-lg font-extrabold text-slate-900">
              ₹{grandTotal}
            </p>
          </div>

          {isPending && (
            <div className="flex gap-1.5">
              <Button
                type="button"
                size="sm"
                disabled={disableBoth}
                onClick={(e) =>
                  onStatus(e, booking.ids, 'rejected')
                }
                className="h-8 rounded-lg bg-red-500 px-2.5 text-[11px] font-bold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {isRejecting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <X className="mr-1 h-3.5 w-3.5" />
                    Reject
                  </>
                )}
              </Button>

              <Button
                type="button"
                size="sm"
                disabled={disableBoth}
                onClick={(e) =>
                  onStatus(e, booking.ids, 'approved')
                }
                className="h-8 rounded-lg bg-emerald-500 px-2.5 text-[11px] font-bold text-white hover:bg-emerald-600 disabled:opacity-60"
              >
                {isApproving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Check className="mr-1 h-3.5 w-3.5" />
                    Accept
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* OTP */}
        {booking.status === 'approved' && (
          <div className="mt-3 rounded-xl border border-orange-100 bg-orange-50/40 p-2.5">
            <label className="mb-1.5 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">
              <KeyRound className="h-3 w-3" />
              Verify Customer OTP
            </label>

            <div className="flex items-center gap-1.5">
              <Input
                inputMode="numeric"
                placeholder="Enter OTP"
                value={otpValue}
                onChange={(e) =>
                  onOtpChange(
                    e.target.value.replace(/\D/g, '').slice(0, 8)
                  )
                }
                className="h-8 rounded-lg border-orange-100 bg-white text-center text-xs font-mono tracking-[0.25em] focus-visible:ring-orange-400"
                disabled={verifying}
              />

              <Button
                type="button"
                onClick={onVerify}
                disabled={verifying}
                className="h-8 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-3 text-[11px] font-bold text-white hover:from-orange-600 hover:to-amber-600"
              >
                {verifying ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Verify'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
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
          price: Number(item.price ?? found?.price ?? 0),
          duration: item.duration ?? found?.duration,
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
          : b.services && b.services.length > 0
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
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-orange-200/40 blur-xl" />

          <Loader2 className="relative h-9 w-9 animate-spin text-orange-500" />
        </div>

        <p className="mt-4 text-sm font-medium text-slate-500">
          Loading bookings...
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-full overflow-hidden bg-[#fffdfa] px-4 py-5 sm:px-6 lg:px-8">
      {/* Background glow */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl" />

      <div className="pointer-events-none absolute -left-32 top-80 h-64 w-64 rounded-full bg-orange-100/30 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-orange-100 bg-white/80 shadow-sm backdrop-blur-xl">
                <Calendar className="h-4 w-4 text-orange-500" />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-orange-500">
                Barber Hub
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Customer{' '}
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                Bookings
              </span>

              {pendingBookings.length > 0 && (
                <span className="ml-2 inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-2 align-middle text-[10px] font-bold text-white shadow-sm">
                  {pendingBookings.length}
                </span>
              )}
            </h1>

            <p className="mt-0.5 text-xs text-slate-500 sm:text-sm">
              Manage your customer appointments
            </p>
          </div>

          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 rounded-xl border-orange-100 bg-white/75 px-3 text-xs text-slate-700 shadow-sm backdrop-blur-xl hover:bg-orange-50 hover:text-orange-600"
          >
            <RefreshCw
              className={cn(
                'mr-1.5 h-3.5 w-3.5',
                isFetching && 'animate-spin'
              )}
            />
            <span className="hidden sm:inline">
              {isFetching
                ? 'Refreshing...'
                : 'Refresh'}
            </span>
            <span className="sm:hidden">
              Refresh
            </span>
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
        >
          <TabsList className="mb-4 h-10 w-full rounded-xl border border-orange-100 bg-white/70 p-1 shadow-sm backdrop-blur-xl sm:w-fit">
            <TabsTrigger
              value="upcoming"
              className="h-8 flex-1 rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm sm:flex-none"
            >
              Upcoming ({upcomingBookings.length})
            </TabsTrigger>

            <TabsTrigger
              value="past"
              className="h-8 flex-1 rounded-lg px-4 text-xs font-semibold data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-sm sm:flex-none"
            >
              Past ({pastBookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Upcoming */}
          <TabsContent value="upcoming">
            {upcomingBookings.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {upcomingBookings.map(
                  (booking) =>
                    renderBookingCard(booking)
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-orange-100/80 bg-white/70 py-12 text-center shadow-sm backdrop-blur-xl">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
                  <Calendar className="h-6 w-6 text-orange-400" />
                </div>

                <p className="text-sm font-semibold text-slate-700">
                  No upcoming bookings
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  New customer appointments will appear here.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Past */}
          <TabsContent value="past">
            {pastBookings.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {pastBookings.map(
                  (booking) =>
                    renderBookingCard(booking)
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-orange-100/80 bg-white/70 py-12 text-center shadow-sm backdrop-blur-xl">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50">
                  <Calendar className="h-6 w-6 text-orange-400" />
                </div>

                <p className="text-sm font-semibold text-slate-700">
                  No past bookings
                </p>

                <p className="mt-1 text-xs text-slate-400">
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