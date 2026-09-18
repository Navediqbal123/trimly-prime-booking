import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getMyBookings, cancelBooking, BookingData, getApprovedBarbers, getBarberServices, ServiceData } from '@/lib/api';
import { listAllShopMedia } from '@/lib/shopMediaStore';
import { shopImage } from '@/lib/shopMedia';
import { timeAgo, useTimeTick } from '@/lib/timeAgo';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const statusConfig = {
  pending: { icon: AlertCircle, label: 'Pending', className: 'text-yellow-500 bg-yellow-500/10' },
  approved: { icon: CheckCircle, label: 'Approved', className: 'text-green-500 bg-green-500/10' },
  confirmed: { icon: CheckCircle, label: 'Confirmed', className: 'text-green-500 bg-green-500/10' },
  completed: { icon: CheckCircle, label: 'Completed', className: 'text-blue-500 bg-blue-500/10' },
  cancelled: { icon: XCircle, label: 'Cancelled', className: 'text-red-500 bg-red-500/10' },
  rejected: { icon: XCircle, label: 'Rejected', className: 'text-red-500 bg-red-500/10' },
};

export default function MyBookings() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<Record<string, number>>({});

  // Keep "Just now / 2 min ago" labels live between refetches.
  useTimeTick(60000);

  const { data: bookings = [], isLoading: loading, isFetching, refetch } = useQuery({
    queryKey: ['myBookings'],
    queryFn: async () => {
      const res = await getMyBookings();
      if (!res.success) throw new Error(res.error || 'Failed to fetch bookings');
      return res.data || [];
    },
    // Real-time freshness: poll every 15s + refetch on focus so new/updated
    // bookings show without a manual refresh.
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Existing ratings for the user's bookings.
  const { data: existingReviews = [] } = useQuery({
    queryKey: ['myBookingReviews', bookings.map((b) => b.id).sort().join(',')],
    queryFn: async () => {
      const bookingIds = bookings.map((b) => b.id).filter(Boolean);

      if (!bookingIds.length) return [];

      const { data, error } = await supabase
        .from('reviews')
        .select('booking_id, rating')
        .in('booking_id', bookingIds);

      if (error) throw error;

      return data || [];
    },
    enabled: bookings.length > 0,
    staleTime: 30_000,
  });

  // Resolve real shop names for every barber referenced by the bookings.
  const { data: shopMap = {} } = useQuery({
    queryKey: ['bookingShopNames'],
    queryFn: async () => {
      const res = await getApprovedBarbers();
      const map: Record<string, string> = {};
      for (const b of res.data || []) {
        if (b?.id && b.shop_name) map[b.id] = b.shop_name;
      }
      return map;
    },
    staleTime: 60_000,
  });

  // Resolve real service names/prices for every barber referenced by bookings.
  const barberIds = Array.from(new Set(bookings.map((b) => b.barber_id).filter(Boolean)));
  const barberIdsKey = barberIds.slice().sort().join(',');

  const { data: serviceMap = {} } = useQuery({
    queryKey: ['bookingServiceCatalog', barberIdsKey],
    queryFn: async () => {
      const map: Record<string, ServiceData> = {};
      const results = await Promise.all(barberIds.map((id) => getBarberServices(id)));
      for (const res of results) {
        for (const s of res.data || []) {
          if (s?.id) map[s.id] = s;
        }
      }
      return map;
    },
    enabled: barberIds.length > 0,
    staleTime: 60_000,
  });

  // Shop photos uploaded by barbers (Barber Hub → My Shop).
  const { data: shopPhotos = {} } = useQuery({
    queryKey: ['bookingShopPhotos'],
    queryFn: listAllShopMedia,
    staleTime: 60_000,
  });

  const handleCancelGroup = async (group: BookingData[]) => {
    setCancellingId(group[0].id);
    const results = await Promise.all(group.map((b) => cancelBooking(b.id)));

    if (results.every((r) => r.success)) {
      toast.success('Booking cancelled successfully');
    } else {
      toast.error(results.find((r) => !r.success)?.error || 'Failed to cancel booking');
    }

    qc.invalidateQueries({ queryKey: ['myBookings'] });
    qc.invalidateQueries({ queryKey: ['bookedSlots'] });
    setCancellingId(null);
  };

  // Submit rating for a completed booking.
  const handleRating = async (group: BookingData[]) => {
    const booking = group[0];
    const rating = selectedRating[booking.id];

    if (!rating) {
      toast.error('Please select a rating.');
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error('Please log in again.');
      return;
    }

    const { error } = await supabase.from('reviews').insert({
      booking_id: booking.id,
      customer_id: user.id,
      barber_id: booking.barber_id,
      rating,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Rating submitted successfully!');

    setSelectedRating((prev) => {
      const updated = { ...prev };
      delete updated[booking.id];
      return updated;
    });

    qc.invalidateQueries({ queryKey: ['myBookingReviews'] });
  };

  // Group every booking with the same barber + date + time slot into ONE card.
  const groups = (() => {
    const map = new Map<string, BookingData[]>();

    for (const b of bookings) {
      const key = `${b.barber_id}|${b.date}|${b.time_slot}`;
      const list = map.get(key);

      if (list) list.push(b);
      else map.set(key, [b]);
    }

    return Array.from(map.values());
  })();

  const upcomingBookings = groups.filter((g) =>
    ['pending', 'confirmed', 'approved'].includes(g[0].status)
  );

  const pastBookings = groups.filter((g) =>
    ['completed', 'cancelled', 'rejected'].includes(g[0].status)
  );

  const resolveServices = (booking: BookingData) => {
    const rawList =
      booking.services_list && booking.services_list.length > 0
        ? booking.services_list
        : booking.services && booking.services.length > 0
          ? booking.services
          : booking.service_ids && booking.service_ids.length > 0
            ? booking.service_ids.map((id) => ({ id, name: '', price: 0 }))
            : booking.service
              ? [{ id: booking.service_id, name: booking.service.name, price: booking.service.price }]
              : booking.service_id
                ? [{ id: booking.service_id, name: '', price: 0 }]
                : [];

    return rawList.map((s, i) => {
      const cat = s.id ? serviceMap[s.id] : undefined;

      return {
        id: s.id || `${i}`,
        name: s.name || cat?.name || '',
        price: Number(s.price ?? 0) || Number(cat?.price ?? 0),
      };
    });
  };

  const BookingCard = ({ group }: { group: BookingData[] }) => {
    const booking = group[0];
    const status = booking.status as keyof typeof statusConfig;
    const config = statusConfig[status] || statusConfig.pending;
    const StatusIcon = config.icon;

    // Merge all services from every booking in the group (dedup by id).
    const seen = new Set<string>();

    const services = group
      .flatMap(resolveServices)
      .filter((s) => {
        const key = s.id || s.name;

        if (!key || seen.has(key)) return false;

        seen.add(key);
        return true;
      });

    const shopName = booking.barber?.shop_name || shopMap[booking.barber_id] || '';

    const photo =
      (shopPhotos[booking.barber_id] && shopPhotos[booking.barber_id][0]) ||
      (booking.barber_id ? shopImage(booking.barber_id) : '');

    const serviceTitle = services.map((s) => s.name).filter(Boolean).join(' + ');

    const total =
      services.reduce((sum, s) => sum + Number(s.price ?? 0), 0) ||
      group.reduce((sum, b) => sum + Number(b.total_amount ?? 0), 0);

    const isCompleted = booking.status === 'completed';

    const hasRated = existingReviews.some(
      (review) => review.booking_id === booking.id
    );

    const currentRating = selectedRating[booking.id] || 0;

return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="
          w-full overflow-hidden rounded-[26px]
          border border-slate-100 bg-white
          shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]
          transition-all duration-300
        "
      >
        <div className="p-4 sm:p-5">
          {/* Shop + status */}
          <div className="flex min-w-0 items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              {photo && (
                <div className="shrink-0 rounded-[18px] bg-white p-1 shadow-[3px_4px_9px_rgba(0,0,0,0.10),-2px_-2px_6px_rgba(255,255,255,0.95)]">
                  <img
                    src={photo}
                    alt={shopName ? `${shopName} barber shop` : 'Barber shop'}
                    loading="lazy"
                    className="h-16 w-16 rounded-[14px] object-cover sm:h-[72px] sm:w-[72px]"
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                {shopName && (
                  <h3 className="line-clamp-2 break-words font-display text-[20px] font-bold leading-[1.08] tracking-[-0.3px] text-black sm:text-[22px]">
                    {shopName}
                  </h3>
                )}

                {serviceTitle && (
                  <p className="mt-1 line-clamp-2 break-words text-[15px] font-medium leading-tight text-orange-500 sm:text-base">
                    {serviceTitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span
                className={cn(
                  'flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-bold shadow-[3px_4px_9px_rgba(0,0,0,0.10),inset_1px_1px_3px_rgba(255,255,255,0.80)]',
                  config.className
                )}
              >
                <StatusIcon className="h-4 w-4" />
                {config.label}
              </span>

              {booking.created_at && (
                <span className="whitespace-nowrap text-[11px] font-medium text-slate-500">
                  {timeAgo(booking.created_at)}
                </span>
              )}
            </div>
          </div>

          {/* Multiple services */}
          {services.length > 1 && (
            <div className="mt-4 overflow-hidden rounded-[18px] border border-slate-100 bg-white shadow-[3px_4px_9px_rgba(0,0,0,0.07),-2px_-2px_7px_rgba(255,255,255,0.95)]">
              {services.filter((s) => s.name).map((s, i) => (
                <div
                  key={s.id || `${s.name}-${i}`}
                  className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-sm last:border-b-0"
                >
                  <span className="min-w-0 truncate font-medium text-slate-700">
                    {s.name}
                  </span>
                  <span className="shrink-0 font-bold text-black">
                    ₹{Number(s.price ?? 0)}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Date + time clay boxes */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="flex min-w-0 items-center gap-2 rounded-[17px] border border-orange-100 bg-[#fff5ed] px-3 py-2.5 shadow-[4px_5px_10px_rgba(0,0,0,0.08),-3px_-3px_8px_rgba(255,255,255,0.95)]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[#ffb27f] shadow-[2px_3px_6px_rgba(0,0,0,0.10),inset_1px_1px_3px_rgba(255,255,255,0.55)]">
                <Calendar className="h-4 w-4 text-[#d94f00]" />
              </div>
              <span className="min-w-0 whitespace-nowrap text-[12px] font-semibold text-slate-700 sm:text-sm">
                {new Date(booking.date).toLocaleDateString('en-IN')}
              </span>
            </div>

            <div className="flex min-w-0 items-center gap-2 rounded-[17px] border border-orange-100 bg-[#fff5ed] px-3 py-2.5 shadow-[4px_5px_10px_rgba(0,0,0,0.08),-3px_-3px_8px_rgba(255,255,255,0.95)]">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[11px] bg-[#ffb27f] shadow-[2px_3px_6px_rgba(0,0,0,0.10),inset_1px_1px_3px_rgba(255,255,255,0.55)]">
                <Clock className="h-4 w-4 text-[#d94f00]" />
              </div>
              <span className="min-w-0 whitespace-nowrap text-[12px] font-semibold text-slate-700 sm:text-sm">
                {booking.time_slot}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="mt-4">
            <span className="text-[18px] font-bold text-black sm:text-[20px]">
              Total <span className="text-[#ef4444]">₹{total}</span>
            </span>
          </div>

          {/* Cancel */}
          {(booking.status === 'pending' ||
            booking.status === 'confirmed' ||
            booking.status === 'approved') && (
            <div className="mt-4 w-full">
              <Button
                variant="outline"
                size="sm"
                className="
                  h-11 w-full rounded-full border-0
                  bg-[#fca5a5] text-black
                  font-bold
                  shadow-[5px_6px_12px_rgba(239,68,68,0.22),inset_2px_2px_5px_rgba(255,255,255,0.55),inset_-3px_-3px_6px_rgba(185,28,28,0.18)]
                  transition-all duration-200
                  hover:bg-[#fca5a5] hover:text-black
                  active:translate-y-[1px] active:shadow-[2px_3px_7px_rgba(239,68,68,0.18)]
                "
                onClick={() => handleCancelGroup(group)}
                disabled={cancellingId === booking.id}
              >
                {cancellingId === booking.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <span className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#ef4444] shadow-[2px_2px_5px_rgba(0,0,0,0.14),inset_1px_1px_2px_rgba(255,255,255,0.35)]">
                      <XCircle className="h-4 w-4 text-white" />
                    </span>
                    Cancel
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Completed booking rating */}
          {isCompleted && (
            <div className="mt-4 rounded-[20px] border border-slate-100 bg-white p-3.5 shadow-[4px_5px_11px_rgba(0,0,0,0.07),-3px_-3px_9px_rgba(255,255,255,0.95)]">
              {hasRated ? (
                <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const review = existingReviews.find(
                        (r) => r.booking_id === booking.id
                      );

                      return (
                        <Star
                          key={index}
                          className={cn(
                            'h-4 w-4',
                            index < (review?.rating || 0)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-slate-300'
                          )}
                        />
                      );
                    })}
                  </div>
                  <span>Rated</span>
                </div>
              ) : (
                <div>
                  <p className="mb-2 text-sm font-bold text-black">
                    Rate this Barber
                  </p>

                  <div className="mb-3 flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const starNumber = index + 1;

                      return (
                        <button
                          key={starNumber}
                          type="button"
                          onClick={() =>
                            setSelectedRating((prev) => ({
                              ...prev,
                              [booking.id]: starNumber,
                            }))
                          }
                          className="rounded-md p-1 transition-transform hover:scale-110"
                          aria-label={`Rate ${starNumber} star${starNumber > 1 ? 's' : ''}`}
                        >
                          <Star
                            className={cn(
                              'h-6 w-6',
                              starNumber <= currentRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-300'
                            )}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleRating(group)}
                    disabled={!currentRating}
                    className="
                      rounded-full bg-[#ff7417] text-white
                      shadow-[4px_5px_10px_rgba(255,116,23,0.25),inset_1px_1px_3px_rgba(255,255,255,0.30)]
                      hover:bg-[#ff7417]
                    "
                  >
                    Submit Rating
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-orange-500" />
        <p className="text-slate-500">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="min-h-full w-full bg-white animate-fade-in">
      {/* Header */}
      <div className="mb-4 flex w-full flex-col gap-3">
        <div className="min-w-0">
          <h1 className="whitespace-nowrap font-display text-[31px] font-bold leading-none tracking-[-1.2px] text-black sm:text-4xl">
            My <span className="text-[#ff7417]">Bookings</span>
          </h1>

          <p className="mt-2 whitespace-nowrap text-[15px] font-medium text-slate-500 sm:text-base">
            Manage your appointments
          </p>
        </div>

        {/* Full-width orange clay Refresh */}
        <Button
          onClick={() => refetch()}
          disabled={isFetching}
          className="
            h-11 w-full rounded-full border-0
            bg-[#f97316] text-white
            text-sm font-bold
            shadow-[6px_7px_14px_rgba(194,65,12,0.28),inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(154,52,18,0.25)]
            transition-all duration-200
            hover:bg-[#f97316]
            active:translate-y-[1px] active:shadow-[3px_4px_8px_rgba(194,65,12,0.22)]
          "
        >
          <RefreshCw
            className={`mr-2 h-5 w-5 ${isFetching ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Upcoming / Past clay pill tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList
          className="
            mb-4 flex h-12 w-full rounded-full
            border border-slate-100 bg-white p-1
            shadow-[5px_6px_13px_rgba(0,0,0,0.08),-4px_-4px_11px_rgba(255,255,255,0.95)]
          "
        >
          <TabsTrigger
            value="upcoming"
            className="
              h-full flex-1 rounded-full
              text-sm font-bold text-slate-500
              transition-all duration-200
              data-[state=active]:bg-[#f97316]
              data-[state=active]:text-white
              data-[state=active]:shadow-[5px_6px_12px_rgba(194,65,12,0.24),inset_1px_1px_3px_rgba(255,255,255,0.28),inset_-2px_-2px_4px_rgba(154,52,18,0.20)]
            "
          >
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>

          <TabsTrigger
            value="past"
            className="
              h-full flex-1 rounded-full
              text-sm font-bold text-slate-500
              transition-all duration-200
              data-[state=active]:bg-[#f97316]
              data-[state=active]:text-white
              data-[state=active]:shadow-[5px_6px_12px_rgba(194,65,12,0.24),inset_1px_1px_3px_rgba(255,255,255,0.28),inset_-2px_-2px_4px_rgba(154,52,18,0.20)]
            "
          >
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((g) => (
              <BookingCard key={g[0].id} group={g} />
            ))
          ) : (
            <div className="rounded-[26px] border border-slate-100 bg-white py-12 text-center shadow-[6px_7px_15px_rgba(0,0,0,0.08),-5px_-5px_13px_rgba(255,255,255,0.95)]">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="font-medium text-slate-500">No upcoming bookings</p>
              <Button
                className="
                  mt-4 rounded-full bg-[#f97316] text-white
                  shadow-[4px_5px_10px_rgba(194,65,12,0.25),inset_1px_1px_3px_rgba(255,255,255,0.30)]
                  hover:bg-[#f97316]
                "
                onClick={() => navigate('/discover')}
              >
                Book Now
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastBookings.length > 0 ? (
            pastBookings.map((g) => (
              <BookingCard key={g[0].id} group={g} />
            ))
          ) : (
            <div className="rounded-[26px] border border-slate-100 bg-white py-12 text-center shadow-[6px_7px_15px_rgba(0,0,0,0.08),-5px_-5px_13px_rgba(255,255,255,0.95)]">
              <Calendar className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <p className="font-medium text-slate-500">No past bookings</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
