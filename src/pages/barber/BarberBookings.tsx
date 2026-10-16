import { useState, type MouseEvent } from 'react';
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
    className:
      'bg-amber-500/15 text-amber-700 dark:text-amber-300 ',
  },
  approved: {
    icon: CheckCircle,
    label: 'Approved',
    className:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ',
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed',
    className:
      'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    className:
      'bg-blue-500/15 text-blue-700 dark:text-blue-300 ',
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    className:
      'bg-rose-500/15 text-rose-700 dark:text-rose-300 ',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    className:
      'bg-rose-500/15 text-rose-700 dark:text-rose-300 ',
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
    e: MouseEvent,
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
  const isExpired =
  isPending &&
  new Date(`${booking.date}T${booking.time_slot}`) <= new Date();
  const isThisActing = !!acting && booking.ids.includes(acting.id);
  const isRejecting = isThisActing && acting?.action === 'rejected';
  const isApproving = isThisActing && acting?.action === 'approved';
  const disableBoth = isThisActing || isExpired;

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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
  "w-full min-w-0 overflow-hidden rounded-[28px] border p-4 sm:p-5 transition-all duration-300",
  isExpired
    ? "border-border bg-muted opacity-70 "
    : "border-border bg-card text-card-foreground  "
)}
    >
      {/* Customer + Status */}
      <div className="flex w-full min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {customerAvatar ? (
            <img
              src={customerAvatar}
              alt={
                customerName
                  ? `${customerName} profile photo`
                  : 'Customer profile photo'
              }
              loading="lazy"
              className="h-12 w-12 shrink-0 rounded-full object-cover border-[5px] border-background "
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ">
              {customerName ? (
                <span className="text-lg font-bold">
                  {customerName.trim().charAt(0).toUpperCase()}
                </span>
              ) : (
                <User className="h-6 w-6" />
              )}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-foreground sm:text-lg">
              {customerName || `Booking #${booking.id.slice(0, 8)}`}
            </p>

            <p className="truncate text-xs font-medium text-muted-foreground">
              #{booking.id.slice(0, 8)}
              {booking.created_at
                ? ` · ${timeAgo(booking.created_at)}`
                : ''}
            </p>
          </div>
        </div>

        <span
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-[18px] px-3 py-2 text-xs font-bold sm:text-sm',
            config.className
          )}
        >
          {isExpired ? (
  <>
    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
    EXPIRED
  </>
) : (
  <>
    <StatusIcon className="h-4 w-4" />
    {config.label}
  </>
)}
        </span>
      </div>

      {/* Date + Time */}
      <div className="mt-4 grid w-full min-w-0 grid-cols-2 gap-3">
        <div className="min-w-0 rounded-[18px] border border-orange-200/60 bg-orange-50 p-3 dark:border-orange-500/20 dark:bg-orange-500/10 ">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-orange-100 dark:bg-orange-500/15 ">
              <Calendar className="h-4 w-4 text-foreground" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Date
              </p>
              <p className="whitespace-nowrap text-xs font-bold tracking-tight text-foreground sm:text-base">
                {new Date(booking.date).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-[18px] border border-orange-200/60 bg-orange-50 p-3 dark:border-orange-500/20 dark:bg-orange-500/10 ">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-orange-100 dark:bg-orange-500/15 ">
              <Clock className="h-4 w-4 text-foreground" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Time
              </p>
              <p className="whitespace-nowrap text-xs font-bold tracking-tight text-foreground sm:text-base">
                {booking.time_slot}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Services */}
      <div className="mt-4 w-full min-w-0 overflow-hidden rounded-[24px] bg-secondary p-3.5 ">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-primary/10 text-primary ">
              <Scissors className="h-5 w-5" />
            </div>

            <p className="truncate text-sm font-bold uppercase tracking-wide text-foreground">
              Services
            </p>
          </div>

          <span className="shrink-0 rounded-[15px] bg-card px-3 py-2 text-xs font-bold text-foreground ">
            {serviceList.length} items
          </span>
        </div>

        <div className="space-y-2">
          {serviceList.map((s, i) => (
            <div
              key={s.id || `${s.name}-${i}`}
              className="flex min-w-0 items-center justify-between gap-3 rounded-[18px] bg-card px-3.5 py-3 "
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-foreground">
                  {s.name}
                </p>

                {s.duration ? (
                  <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                    {s.duration} min
                  </p>
                ) : null}
              </div>

              <span className="shrink-0 text-sm font-bold text-foreground">
                ₹{Number(s.price ?? 0)}
              </span>
            </div>
          ))}

          {booking.home_service && (
            <div className="flex items-center justify-between gap-3 rounded-[18px] bg-emerald-500/10 px-3.5 py-3 ">
              <span className="truncate text-xs font-bold text-emerald-700 dark:text-emerald-300">
                🏠 Home Service
              </span>

              <span className="shrink-0 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                {homeCharge > 0 ? `₹${homeCharge}` : 'Included'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Total + Actions */}
      <div className="mt-4 flex min-w-0 items-center justify-between gap-3 rounded-[22px] bg-secondary p-4 ">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Grand Total
          </p>

          <span className="text-xl font-black text-foreground sm:text-2xl">
            ₹{grandTotal}
          </span>
        </div>

        {isPending && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={disableBoth}
              onClick={(e) =>
                onStatus(e, booking.ids, 'rejected')
              }
              className="h-10 rounded-[16px] bg-rose-500/15 px-3 font-bold text-rose-700 dark:text-rose-300  hover:bg-[#ffd7df]"
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="mr-1 h-4 w-4" />
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
              className="h-10 rounded-[16px] bg-emerald-500/15 px-3 font-bold text-emerald-700 dark:text-emerald-300  hover:bg-[#cef4e2]"
            >
              {isApproving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Accept
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* OTP */}
      {booking.status === 'approved' && (
        <div className="mt-4 w-full rounded-[22px] bg-secondary p-4 ">
          <label className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <KeyRound className="h-4 w-4 text-primary" />
            Verify Customer OTP
          </label>

          <div className="flex w-full min-w-0 gap-2">
            <Input
              inputMode="numeric"
              placeholder="Enter OTP"
              value={otpValue}
              onChange={(e) =>
                onOtpChange(
                  e.target.value.replace(/\D/g, '').slice(0, 8)
                )
              }
              className="h-11 min-w-0 flex-1 rounded-[16px] border border-border bg-background text-center font-mono text-base tracking-[0.3em] "
              disabled={verifying}
            />

            <Button
              type="button"
              onClick={onVerify}
              disabled={verifying}
              className="h-11 shrink-0 rounded-[16px] bg-primary px-5 font-bold text-white  hover:bg-primary"
            >
              {verifying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
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

  const [otpInputs, setOtpInputs] = useState<
    Record<string, string>
  >({});

  const [verifyingId, setVerifyingId] = useState<string | null>(
    null
  );

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
        throw new Error(res.error || 'Failed to fetch bookings');
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
      : { ...b };

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
        b.user_id ||
        b.customer_id ||
        'unknown';

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

  /* Customer profile lookup */
  const userIds = Array.from(
    new Set(
      bookings
        .map(
          (b) => b.user_id || b.customer_id
        )
        .filter(
          (v): v is string => !!v
        )
    )
  );

  const userIdsKey = userIds
    .slice()
    .sort()
    .join(',');

  const { data: profileMap = {} } =
    useQuery({
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

  /* OTP verification */
  const handleVerifyOtp = async (
    bookingId: string
  ) => {
    const otp = (
      otpInputs[bookingId] || ''
    ).trim();

    if (!otp) {
      toast.error(
        'Please enter the OTP'
      );
      return;
    }

    setVerifyingId(bookingId);

    try {
      const res =
        await verifyBookingOtp(
          bookingId,
          otp
        );

      if (res.success) {
        toast.success(
          'Service Completed'
        );

        setOtpInputs((p) => ({
          ...p,
          [bookingId]: '',
        }));

        setStatusOverrides((p) => ({
          ...p,
          [bookingId]: 'completed',
        }));

        qc.invalidateQueries({
          queryKey: [
            'barberBookings',
          ],
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

  /* Approve / Reject */
  const handleStatus = (
    e: MouseEvent,
    ids: string[],
    status:
      | 'approved'
      | 'rejected'
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
      const results =
        await Promise.all(
          ids.map((id) =>
            updateBookingStatus(
              id,
              status
            )
          )
        );

      const failed = results.some(
        (r) => !r.success
      );

      if (failed) {
        toast.error(
          results.find(
            (r) => !r.success
          )?.error ||
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
        queryKey: [
          'barberBookings',
        ],
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
        otpInputs[booking.ids[0]] ||
        ''
      }
      onOtpChange={(v) =>
        setOtpInputs((p) => ({
          ...p,
          [booking.ids[0]]: v,
        }))
      }
      onVerify={() =>
        handleVerifyOtp(
          booking.ids[0]
        )
      }
      verifying={
        verifyingId ===
        booking.ids[0]
      }
    />
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary/10 ">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>

          <p className="mt-4 font-semibold text-muted-foreground">
            Loading bookings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 bg-background text-foreground animate-fade-in">
      {/* Header */}
      <div className="w-full min-w-0 pb-5">
        <div className="w-full min-w-0">
          <h1 className="flex min-w-0 flex-wrap items-center gap-x-2 text-2xl font-black leading-tight tracking-[-0.5px] whitespace-nowrap text-foreground sm:text-3xl lg:text-4xl">
            <span>Customer</span>

            <span className="text-primary">
              Bookings
            </span>

            {pendingBookings.length >
              0 && (
              <span className="inline-flex h-7 items-center rounded-full bg-primary/10 px-3 text-xs font-bold text-primary ">
                {pendingBookings.length}{' '}
                new
              </span>
            )}
          </h1>

          <p className="mt-2 truncate text-sm font-semibold text-muted-foreground sm:text-base">
            Manage your customer appointments
          </p>
        </div>

        {/* Refresh */}
        <Button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="mt-3 flex h-10 w-full rounded-[16px] bg-orange-500 font-bold text-white shadow-[0_4px_12px_rgba(255,116,23,0.25)] hover:bg-orange-600 sm:mt-0 sm:w-auto"
        >
          <RefreshCw
            className={cn(
              'mr-2 h-5 w-5',
              isFetching &&
                'animate-spin'
            )}
          />

          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full min-w-0"
      >
        <TabsList className="mb-5 flex h-[54px] w-full min-w-0 rounded-[22px] border border-border bg-card p-2 ">
          <TabsTrigger
            value="upcoming"
            className="h-full min-w-0 flex-1 rounded-[16px] px-2 text-sm font-bold text-muted-foreground data-[state=active]:bg-[#ff7417] data-[state=active]:text-white data-[state=active]:shadow-[0_3px_10px_rgba(255,116,23,0.25)] sm:text-base"
          >
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>

          <TabsTrigger
            value="past"
            className="h-full min-w-0 flex-1 rounded-[16px] px-2 text-sm font-bold text-muted-foreground data-[state=active]:bg-[#ff7417] data-[state=active]:text-white data-[state=active]:shadow-[0_3px_10px_rgba(255,116,23,0.25)] sm:text-base"
          >
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        {/* Upcoming */}
        <TabsContent
          value="upcoming"
          className="mt-0 w-full min-w-0"
        >
          {upcomingBookings.length >
          0 ? (
            <div className="grid w-full min-w-0 grid-cols-1 gap-4">
              {upcomingBookings.map(
                (booking) =>
                  renderBookingCard(
                    booking
                  )
              )}
            </div>
          ) : (
            <div className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-[28px] border border-border bg-card p-6 ">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-primary/10 text-primary ">
                <Calendar className="h-8 w-8" />
              </div>

              <p className="mt-4 font-bold text-muted-foreground">
                No upcoming bookings
              </p>
            </div>
          )}
        </TabsContent>

        {/* Past */}
        <TabsContent
          value="past"
          className="mt-0 w-full min-w-0"
        >
          {pastBookings.length >
          0 ? (
            <div className="grid w-full min-w-0 grid-cols-1 gap-4">
              {pastBookings.map(
                (booking) =>
                  renderBookingCard(
                    booking
                  )
              )}
            </div>
          ) : (
            <div className="flex min-h-[220px] w-full flex-col items-center justify-center rounded-[28px] border border-border bg-card p-6 ">
              <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-secondary text-muted-foreground ">
                <Calendar className="h-8 w-8" />
              </div>

              <p className="mt-4 font-bold text-muted-foreground">
                No past bookings
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}