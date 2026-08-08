import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Check, X, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getBarberBookings, getMyServices, updateBookingStatus, verifyBookingOtp, BookingData } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const statusConfig: Record<string, { icon: typeof AlertCircle; label: string; className: string }> = {
  pending: { icon: AlertCircle, label: 'Pending', className: 'text-yellow-500 bg-yellow-500/10' },
  approved: { icon: CheckCircle, label: 'Approved', className: 'text-green-500 bg-green-500/10' },
  confirmed: { icon: CheckCircle, label: 'Confirmed', className: 'text-green-500 bg-green-500/10' },
  completed: { icon: CheckCircle, label: 'Completed', className: 'text-blue-500 bg-blue-500/10' },
  rejected: { icon: XCircle, label: 'Rejected', className: 'text-red-500 bg-red-500/10' },
  cancelled: { icon: XCircle, label: 'Cancelled', className: 'text-red-500 bg-red-500/10' },
};

type GroupedBooking = BookingData & { ids: string[] };

type BookingCardProps = {
  booking: GroupedBooking;
  customerName: string;
  acting: { id: string; action: 'approved' | 'rejected' } | null;
  onStatus: (e: React.MouseEvent, ids: string[], status: 'approved' | 'rejected') => void;
  otpValue: string;
  onOtpChange: (v: string) => void;
  onVerify: () => void;
  verifying: boolean;
};

function BookingCard({ booking, customerName, acting, onStatus, otpValue, onOtpChange, onVerify, verifying }: BookingCardProps) {
  const status = booking.status as keyof typeof statusConfig;
  const config = statusConfig[status] || statusConfig.pending;
  const StatusIcon = config.icon;
  const isPending = booking.status === 'pending';
  const isThisActing = !!acting && booking.ids.includes(acting.id);
  const isRejecting = isThisActing && acting?.action === 'rejected';
  const isApproving = isThisActing && acting?.action === 'approved';
  const disableBoth = isThisActing;


  const serviceList =
    booking.services_list && booking.services_list.length > 0
      ? booking.services_list
      : booking.services && booking.services.length > 0
        ? booking.services
        : [{
            id: booking.service_id,
            name: booking.service?.name || 'Service',
            price: Number(booking.service?.price ?? 0),
            duration: booking.service?.duration,
          }];

  const homeCharge = Number(booking.home_service_price ?? booking.home_service_charge ?? 0);
  const servicesTotal = serviceList.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const grandTotal = servicesTotal + (booking.home_service ? homeCharge : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:border-primary/50 hover:shadow-md transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-base truncate">{customerName}</p>
            <p className="text-xs text-muted-foreground">Booking #{booking.id.slice(0, 8)}</p>
          </div>
        </div>
        <span className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0', config.className)}>
          <StatusIcon className="w-3 h-3" />
          {config.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          <span>{new Date(booking.date).toLocaleDateString('en-IN')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4" />
          <span>{booking.time_slot}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border/70 bg-muted/30 divide-y divide-border/70 overflow-hidden mb-4">
        <p className="px-4 py-2 text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
          Services ({serviceList.length})
        </p>
        {serviceList.map((s, i) => (
          <div key={s.id || `${s.name}-${i}`} className="flex items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium truncate">{s.name}</p>
              {s.duration ? (
                <p className="text-xs text-muted-foreground mt-0.5">{s.duration} min</p>
              ) : null}
            </div>
            <span className="font-semibold shrink-0">₹{Number(s.price ?? 0)}</span>
          </div>
        ))}
        {booking.home_service && (
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
              🏠 Home Service
            </span>
            <span className="font-semibold shrink-0">
              {homeCharge > 0 ? `₹${homeCharge}` : 'Included'}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Grand Total</p>
          <span className="text-xl font-bold">₹{grandTotal}</span>
        </div>

        {isPending && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              disabled={disableBoth}
              onClick={(e) => onStatus(e, booking.id, 'rejected')}
              className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-60"
            >
              {isRejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-1" /> Reject</>}
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={disableBoth}
              onClick={(e) => onStatus(e, booking.id, 'approved')}
              className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-60"
            >
              {isApproving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Accept</>}
            </Button>
          </div>
        )}
      </div>


      {booking.status === 'approved' && (
        <div className="mt-4 pt-4 border-t border-border">
          <label className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
            <KeyRound className="w-3.5 h-3.5" />
            Verify customer OTP
          </label>
          <div className="flex items-center gap-2">
            <Input
              inputMode="numeric"
              placeholder="Enter OTP"
              value={otpValue}
              onChange={(e) => onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 8))}
              className="tracking-[0.3em] font-mono text-center text-base"
              disabled={verifying}
            />
            <Button
              type="button"
              onClick={onVerify}
              disabled={verifying}
              className="bg-primary hover:bg-primary/90"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify'}
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
  const [acting, setActing] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const {
    data: rawBookings = [],
    isLoading: loading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['barberBookings'],
    queryFn: async () => {
      const res = await getBarberBookings();
      if (!res.success) throw new Error(res.error || 'Failed to fetch bookings');
      return res.data || [];
    },
    refetchInterval: 10000,
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
      ? { ...b, service: { name: s.name, price: s.price, duration: s.duration, ...(b.service || {}) } }
      : { ...b };

    // Multi-service bookings: prefer services_list from the API, then service_ids.
    const list = b.services_list && b.services_list.length > 0 ? b.services_list : null;
    if (list) {
      enriched.services_list = list.map((item, i) => {
        const found = myServices.find((x) => x.id === item.id);
        return {
          id: item.id ?? `svc-${i}`,
          name: item.name || found?.name || 'Service',
          price: Number(item.price ?? found?.price ?? 0),
          duration: item.duration ?? found?.duration,
        };
      });
    } else {
      const ids = b.service_ids && b.service_ids.length > 0 ? b.service_ids : null;
      if (!enriched.services && ids) {
        enriched.services = ids.map((id) => {
          const found = myServices.find((x) => x.id === id);
          return {
            id,
            name: found?.name || 'Service',
            price: Number(found?.price ?? 0),
            duration: found?.duration,
          };
        });
      }
    }
    return enriched;
  });


  // Resolve real customer names from profiles (public.profiles.name) for any
  // user_id referenced by the bookings list.
  const userIds = Array.from(
    new Set(
      bookings
        .map((b) => b.user_id || b.customer_id)
        .filter((v): v is string => !!v),
    ),
  );
  const userIdsKey = userIds.slice().sort().join(',');

  const { data: nameMap = {} } = useQuery({
    queryKey: ['bookingCustomerNames', userIdsKey],
    queryFn: async () => {
      if (userIds.length === 0) return {};
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);
      if (error) return {};
      const map: Record<string, string> = {};
      for (const row of data || []) {
        if (row?.id) map[row.id as string] = (row as { name?: string }).name || '';
      }
      return map;
    },
    enabled: userIds.length > 0,
    staleTime: 60_000,
  });

  const nameFor = (b: BookingData) => {
    const uid = b.user_id || b.customer_id;
    return (
      b.user?.full_name ||
      b.user?.name ||
      (uid ? nameMap[uid] : '') ||
      b.user?.email ||
      'Customer'
    );
  };

  const handleVerifyOtp = async (bookingId: string) => {
    const otp = (otpInputs[bookingId] || '').trim();
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }
    setVerifyingId(bookingId);
    try {
      const res = await verifyBookingOtp(bookingId, otp);
      if (res.success) {
        toast.success('OTP verified — booking completed');
        setOtpInputs((p) => ({ ...p, [bookingId]: '' }));
        qc.invalidateQueries({ queryKey: ['barberBookings'] });
        qc.invalidateQueries({ queryKey: ['myBookings'] });
        qc.invalidateQueries({ queryKey: ['bookedSlots'] });
      } else {
        toast.error(res.error || 'Invalid OTP');
      }
    } finally {
      setVerifyingId(null);
    }
  };

  const handleStatus = async (
    e: React.MouseEvent,
    id: string,
    status: 'approved' | 'rejected',
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (acting) return;
    setActing({ id, action: status });
    try {
      const res = await updateBookingStatus(id, status);
      if (res.success) {
        toast.success(status === 'approved' ? 'Booking accepted' : 'Booking rejected');
        qc.invalidateQueries({ queryKey: ['barberBookings'] });
        qc.invalidateQueries({ queryKey: ['myBookings'] });
        qc.invalidateQueries({ queryKey: ['bookedSlots'] });
      } else {
        toast.error(res.error || 'Action failed');
      }
    } finally {
      setActing(null);
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const upcomingBookings = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed' || b.status === 'approved'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected'
  );

  const renderBookingCard = (booking: BookingData) => (
    <BookingCard
      key={booking.id}
      booking={booking}
      customerName={nameFor(booking)}
      acting={acting}
      onStatus={handleStatus}
      otpValue={otpInputs[booking.id] || ''}
      onOtpChange={(v) => setOtpInputs((p) => ({ ...p, [booking.id]: v }))}
      onVerify={() => handleVerifyOtp(booking.id)}
      verifying={verifyingId === booking.id}
    />
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            Customer <span className="gradient-text">Bookings</span>
            {pendingBookings.length > 0 && (
              <span className="ml-3 inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-red-500 text-white text-sm font-bold align-middle">
                {pendingBookings.length} new
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">Manage your customer appointments</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingBookings.map((booking) => renderBookingCard(booking))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming bookings</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastBookings.map((booking) => renderBookingCard(booking))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No past bookings</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
