import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getMyBookings, cancelBooking, BookingData, getApprovedBarbers, getBarberServices, ServiceData } from '@/lib/api';
import { listAllShopMedia } from '@/lib/shopMediaStore';
import { shopImage } from '@/lib/shopMedia';
import { timeAgo, useTimeTick } from '@/lib/timeAgo';
import { toast } from 'sonner';

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
    const total = services.reduce((sum, s) => sum + Number(s.price ?? 0), 0) ||
      group.reduce((sum, b) => sum + Number(b.total_amount ?? 0), 0);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300"
      >
        <div className="p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              {photo && (
                <img
                  src={photo}
                  alt={shopName ? `${shopName} barber shop` : 'Barber shop'}
                  loading="lazy"
                  className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
                />
              )}
              <div className="min-w-0">
                {shopName && <h3 className="font-semibold truncate">{shopName}</h3>}
                {serviceTitle && <p className="text-sm text-primary">{serviceTitle}</p>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className={cn('flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium', config.className)}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
              {booking.created_at && (
                <span className="text-[11px] text-muted-foreground">{timeAgo(booking.created_at)}</span>
              )}
            </div>
          </div>

          {services.length > 1 && (
            <div className="mt-3 rounded-xl border border-border/70 divide-y divide-border/70 overflow-hidden">
              {services.filter((s) => s.name).map((s, i) => (
                <div key={s.id || `${s.name}-${i}`} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="truncate">{s.name}</span>
                  <span className="font-semibold shrink-0">₹{Number(s.price ?? 0)}</span>
                </div>
              ))}
            </div>
          )}


          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(booking.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{booking.time_slot}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium text-foreground">Total ₹{total}</span>
            </div>
          </div>

          {(booking.status === 'pending' || booking.status === 'confirmed' || booking.status === 'approved') && (
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={() => handleCancelGroup(group)}
                disabled={cancellingId === booking.id}
              >
                {cancellingId === booking.id ? (
                  <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Cancelling...</>
                ) : (
                  <><XCircle className="w-4 h-4 mr-1" />Cancel</>
                )}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            My <span className="gradient-text">Bookings</span>
          </h1>
          <p className="text-muted-foreground">Manage your appointments</p>
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

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming bookings</p>
              <Button className="mt-4" onClick={() => navigate('/discover')}>Book Now</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastBookings.length > 0 ? (
            pastBookings.map((booking) => <BookingCard key={booking.id} booking={booking} />)
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
