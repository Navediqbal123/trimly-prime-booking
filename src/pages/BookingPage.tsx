import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  MapPin,
  Clock,
  ArrowLeft,
  Home,
  Loader2,
  AlertCircle,
  Scissors,
  Star,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createBooking, getApprovedBarbers, getPendingBarbers, getBarberServices, checkSlotAvailability } from '@/lib/api';

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
  '12:00 AM',
];

export default function BookingPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedServiceId = searchParams.get('service');

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [homeService, setHomeService] = useState(false);
  const [loading, setLoading] = useState(false);

  const { data: shop, isLoading: loadingShop } = useQuery({
    queryKey: ['barber', shopId],
    queryFn: async () => {
      const [approvedRes, pendingRes] = await Promise.all([
        getApprovedBarbers(),
        getPendingBarbers(),
      ]);
      const all = [
        ...(approvedRes.success && approvedRes.data ? approvedRes.data : []),
        ...(pendingRes.success && pendingRes.data ? pendingRes.data : []),
      ];
      return all.find((b) => b.id === shopId) || null;
    },
    enabled: !!shopId,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['barberServices', shopId],
    queryFn: async () => {
      const res = await getBarberServices(shopId!);
      return res.success && res.data ? res.data : [];
    },
    enabled: !!shopId,
  });

  // Use LOCAL date (not UTC) so slot lookups match the date the user picked.
  const toLocalDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const dateKey = selectedDate ? toLocalDateKey(selectedDate) : null;

  // Parse a "9:00 AM" / "12:30 AM" slot into a Date on the given day (local time).
  const slotToDate = (day: Date, slot: string) => {
    const m = slot.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return null;
    let hh = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ap = m[3].toUpperCase();
    if (ap === 'AM') hh = hh === 12 ? 0 : hh;
    else hh = hh === 12 ? 12 : hh + 12;
    const d = new Date(day);
    d.setHours(hh, mm, 0, 0);
    return d;
  };

  // Tick every 30s so "past slot" disabling updates in real time.
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const isSlotPast = (slot: string) => {
    if (!selectedDate) return false;
    const d = slotToDate(selectedDate, slot);
    if (!d) return false;
    return d.getTime() <= nowTick;
  };

  const { data: bookedSlots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['bookedSlots', shopId, dateKey],
    queryFn: async () => {
      if (!shopId || !dateKey) return [];
      // Check each slot independently for this specific date. Backend returns
      // available:false only when there's an active booking (pending / approved /
      // in-progress). Completed / cancelled / rejected free the slot back up.
      const results = await Promise.all(
        timeSlots.map(async (slot) => {
          const res = await checkSlotAvailability(shopId, dateKey, slot);
          const available = res.success ? res.data?.available !== false : true;
          return available ? null : slot;
        })
      );
      return results.filter((s): s is string => !!s);
    },
    enabled: !!shopId && !!dateKey,
    // Real-time freshness: refetch every 15s so freed slots re-enable automatically.
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 15000,
    refetchIntervalInBackground: false,
  });

  const loadingData = loadingShop || loadingServices;
  const selectedServiceData = services.find((s) => s.id === selectedService);

  useEffect(() => {
    if (preselectedServiceId && !selectedService && services.length > 0) {
      const match = services.find((s) => s.id === preselectedServiceId);
      if (match) setSelectedService(match.id);
    }
  }, [preselectedServiceId, services, selectedService]);

  useEffect(() => {
    if (selectedTime && bookedSlots.includes(selectedTime)) {
      setSelectedTime(null);
    }
  }, [bookedSlots, selectedTime]);

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error('Please select a service, date and time');
      return;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!shopId || !uuidRegex.test(shopId) || !uuidRegex.test(selectedService)) {
      toast.error('Invalid IDs');
      return;
    }

    setLoading(true);
    const dateStr = toLocalDateKey(selectedDate);

    const slotCheck = await checkSlotAvailability(shopId, dateStr, selectedTime);
    if (!slotCheck.success) {
      toast.error(slotCheck.error || 'Failed to verify slot availability');
      setLoading(false);
      return;
    }
    if (slotCheck.data?.available === false) {
      toast.error('This slot is already booked, please select another time');
      setLoading(false);
      return;
    }

    const response = await createBooking({
      barber_id: shopId,
      service_id: selectedService,
      date: dateStr,
      time_slot: selectedTime,
      home_service: homeService,
    });

    if (response.success) {
      toast.success('Booking confirmed!');
      navigate('/bookings');
    } else {
      toast.error(response.error || 'Failed to create booking');
    }
    setLoading(false);
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-16 bg-white">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-black" />
        <p className="text-black/70">Loading...</p>
      </div>
    );
  }

  if (!shopId || !shop) {
    return (
      <div className="min-h-screen p-4 bg-white">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-black hover:bg-black/5">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-black/40 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-black">Barber Not Found</h3>
          <Button onClick={() => navigate('/discover')} className="btn-gold">Discover Barbers</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black -m-4 lg:-m-8 -mt-16 lg:-mt-8 -mb-36 lg:-mb-8 px-4 lg:px-8 pt-16 lg:pt-8 pb-36 lg:pb-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-5 text-black hover:bg-black/5 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* Barber Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 mb-8 flex items-center gap-4 bg-white border border-black/10 shadow-sm"
        >
          <div className="w-14 h-14 rounded-full p-[2px] shrink-0 bg-gradient-to-br from-gold to-gold/40">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Scissors className="w-6 h-6 text-gold" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold text-black truncate">{shop.shop_name}</h1>
            <div className="flex items-center gap-1.5 text-xs text-black/70 mt-1">
              <MapPin className="w-3 h-3 shrink-0 text-black" />
              <span className="truncate">{shop.location}</span>
            </div>
            <div className="flex items-center gap-0.5 mt-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn('w-3 h-3', i <= 4 ? 'fill-gold text-gold' : 'text-black/20')}
                />
              ))}
              <span className="ml-1.5 text-[11px] text-black/70">4.8</span>
            </div>
          </div>
        </motion.div>

        {/* Service */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/60 mb-3">Service</h2>
          {services.length === 0 ? (
            <div className="rounded-2xl p-8 text-center bg-white border border-black/10">
              <Scissors className="w-9 h-9 text-black/30 mx-auto mb-2" />
              <p className="text-sm text-black/60">No services added yet by this barber.</p>
            </div>
          ) : (
            <Select
              value={selectedService ?? undefined}
              onValueChange={(val) => {
                setSelectedService(val);
                const svc = services.find((s) => s.id === val);
                if (svc && !svc.home_service) setHomeService(false);
              }}
            >
              <SelectTrigger className="w-full h-14 bg-white border border-black/15 rounded-xl px-4 text-black hover:border-black/40 transition-colors">
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-black/10 text-black">
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id} className="py-3 text-black focus:bg-black/5 focus:text-black">
                    <div className="flex items-center justify-between gap-6 w-full">
                      <div className="flex flex-col text-left">
                        <span className="font-medium text-sm flex items-center gap-1.5">
                          {service.name}
                          {service.home_service && <Home className="w-3 h-3 text-black" />}
                        </span>
                        <span className="text-[11px] text-black/60 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {service.duration} min
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-black">₹{service.price}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </section>

        {/* Date — dark calendar */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/60 mb-3">
            Date {selectedDate && <span className="text-black normal-case tracking-normal font-medium">· {format(selectedDate, 'EEE, MMM d, yyyy')}</span>}
          </h2>
          <div className="rounded-2xl bg-[#0d0d0d] p-2 flex justify-center border border-black">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date ?? undefined)}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className="p-2 pointer-events-auto"
              classNames={{
                months: 'flex flex-col',
                month: 'space-y-3',
                caption: 'flex justify-center pt-1 pb-2 relative items-center',
                caption_label: 'text-sm font-semibold text-white',
                nav_button: 'h-7 w-7 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg p-0 transition-colors inline-flex items-center justify-center',
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                head_cell: 'text-white/40 rounded-md w-10 font-medium text-[0.7rem] uppercase tracking-wider',
                row: 'flex w-full mt-1.5',
                cell: 'h-10 w-10 text-center text-sm p-0 relative',
                day: 'h-10 w-10 p-0 font-normal rounded-lg text-white/90 hover:bg-white/10 transition-colors aria-selected:opacity-100 inline-flex items-center justify-center',
                day_selected: 'bg-gold text-black hover:bg-gold hover:text-black focus:bg-gold focus:text-black font-semibold shadow-[0_0_18px_-2px_hsl(var(--gold)/0.7)]',
                day_today: 'border border-gold/40 text-gold font-semibold',
                day_outside: 'text-white/25',
                day_disabled: 'text-white/15 opacity-50',
              }}
            />
          </div>
        </section>

        {/* Time */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/60 mb-3">Time</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {timeSlots.map((time) => {
              const active = selectedTime === time;
              const booked = bookedSlots.includes(time);
              return (
                <button
                  key={time}
                  onClick={() => !booked && setSelectedTime(time)}
                  disabled={booked}
                  title={booked ? 'Already booked' : undefined}
                  className={cn(
                    'py-3 px-2 rounded-xl text-[13px] font-medium transition-all border',
                    booked
                      ? 'bg-neutral-300 text-neutral-500 border-neutral-300 cursor-not-allowed line-through'
                      : active
                        ? 'bg-gold text-black border-gold shadow-[0_0_18px_-4px_hsl(var(--gold)/0.7)]'
                        : 'bg-[#111] text-white border-[#111] hover:border-gold/60'
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>
          {dateKey && loadingSlots && (
            <p className="text-xs text-black/50 mt-2">Checking availability…</p>
          )}

          {selectedServiceData?.home_service && (
            <div className="mt-5 p-4 rounded-xl bg-white border border-black/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-black" />
                <span className="text-sm font-medium text-black">Home Service</span>
              </div>
              <Button
                size="sm"
                onClick={() => setHomeService(!homeService)}
                className={cn(
                  'font-medium',
                  homeService
                    ? 'bg-gold text-black hover:bg-gold/90'
                    : 'bg-black text-white hover:bg-black/90'
                )}
              >
                {homeService ? <><Check className="w-3 h-3 mr-1" /> Selected</> : 'Select'}
              </Button>
            </div>
          )}
        </section>

        {/* Summary - dark card */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/60 mb-3">Summary</h2>
          <div className="rounded-2xl bg-[#0d0d0d] border border-gold/30 p-5 text-white">
            <div className="space-y-3 text-sm">
              {[
                ['Service', selectedServiceData?.name || '—'],
                ['Date', selectedDate ? format(selectedDate, 'EEE, MMM d') : '—'],
                ['Time', selectedTime || '—'],
                ['Duration', selectedServiceData ? `${selectedServiceData.duration} min` : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-white/55">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
              ))}
              {selectedServiceData && (
                <div className="flex justify-between items-center">
                  <span className="text-white/55">Price</span>
                  <span className="text-white font-medium">₹{selectedServiceData.price}</span>
                </div>
              )}
              {homeService && (
                <div className="flex justify-between items-center">
                  <span className="text-white/55">Type</span>
                  <span className="font-medium flex items-center gap-1 text-gold">
                    <Home className="w-3 h-3" /> Home Service
                  </span>
                </div>
              )}
              <div className="border-t border-white/10 pt-4 mt-4 flex justify-between items-center">
                <span className="text-sm font-medium text-white/70">Total</span>
                <span className="text-3xl font-bold leading-none gradient-gold-text">
                  ₹{selectedServiceData?.price ?? 0}
                </span>
              </div>
            </div>
          </div>
        </section>

        <Button
          onClick={handleBook}
          disabled={loading || !selectedService || !selectedDate || !selectedTime}
          className="w-full h-14 btn-gold font-semibold text-base rounded-xl disabled:opacity-40 transition-all shadow-[0_8px_30px_-8px_hsl(var(--gold)/0.6)]"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Booking...</>
          ) : (
            <><Check className="w-5 h-5 mr-2" /> Confirm Booking</>
          )}
        </Button>
      </div>
    </div>
  );
}
