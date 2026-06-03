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

  const loadingData = loadingShop || loadingServices;
  const selectedServiceData = services.find((s) => s.id === selectedService);

  // Pre-select service from query param when services arrive
  useEffect(() => {
    if (preselectedServiceId && !selectedService && services.length > 0) {
      const match = services.find((s) => s.id === preselectedServiceId);
      if (match) setSelectedService(match.id);
    }
  }, [preselectedServiceId, services, selectedService]);

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
    const dateStr = selectedDate.toISOString().split('T')[0];

    const slotCheck = await checkSlotAvailability(shopId, dateStr, selectedTime);
    if (!slotCheck.success) {
      toast.error(slotCheck.error || 'Failed to verify slot availability');
      setLoading(false);
      return;
    }
    if (slotCheck.data?.available === false) {
      toast.error('This slot is already booked, please choose another time');
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
      <div className="min-h-screen flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mb-4 text-gold" />
        <p className="text-white/80">Loading...</p>
      </div>
    );
  }

  if (!shopId || !shop) {
    return (
      <div className="min-h-screen p-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-white hover:bg-white/5">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-white/40 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-white">Barber Not Found</h3>
          <Button onClick={() => navigate('/discover')} className="btn-gold">Discover Barbers</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white relative">
      {/* Ambient glow */}
      <div
        className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--gold) / 0.6), transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.7), transparent 70%)' }}
      />

      <div className="relative max-w-2xl mx-auto pb-12 px-4 pt-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-5 text-white/80 hover:text-white hover:bg-white/5 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        {/* Barber Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5 mb-8 flex items-center gap-4 border border-gold/20"
        >
          <div className="w-14 h-14 rounded-full p-[2px] shrink-0 bg-gradient-to-br from-gold to-gold/40">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center">
              <Scissors className="w-6 h-6 text-gold" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold text-white truncate">{shop.shop_name}</h1>
            <div className="flex items-center gap-1.5 text-xs text-white/70 mt-1">
              <MapPin className="w-3 h-3 shrink-0 text-gold" />
              <span className="truncate">{shop.location}</span>
            </div>
            <div className="flex items-center gap-0.5 mt-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={cn('w-3 h-3', i <= 4 ? 'fill-gold text-gold' : 'text-white/20')}
                />
              ))}
              <span className="ml-1.5 text-[11px] text-white/70">4.8</span>
            </div>
          </div>
        </motion.div>

        {/* Service */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50 mb-3">Service</h2>
          {services.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center border border-white/10">
              <Scissors className="w-9 h-9 text-white/30 mx-auto mb-2" />
              <p className="text-sm text-white/60">No services added yet by this barber.</p>
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
              <SelectTrigger className="w-full h-14 glass-card border border-white/10 rounded-xl px-4 text-white hover:border-gold/40 transition-colors">
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent className="bg-black/95 backdrop-blur-xl border border-white/10 text-white">
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id} className="py-3 text-white focus:bg-white/10 focus:text-white">
                    <div className="flex items-center justify-between gap-6 w-full">
                      <div className="flex flex-col text-left">
                        <span className="font-medium text-sm flex items-center gap-1.5">
                          {service.name}
                          {service.home_service && <Home className="w-3 h-3 text-gold" />}
                        </span>
                        <span className="text-[11px] text-white/60 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {service.duration} min
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gold">₹{service.price}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </section>

        {/* Date — inline calendar */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50 mb-3">
            Date {selectedDate && <span className="text-white/80 normal-case tracking-normal font-medium">· {format(selectedDate, 'EEE, MMM d, yyyy')}</span>}
          </h2>
          <div className="glass-card rounded-2xl border border-white/10 p-2 flex justify-center">
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
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50 mb-3">Time</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {timeSlots.map((time) => {
              const active = selectedTime === time;
              return (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    'py-3 px-2 rounded-xl text-[13px] font-medium transition-all border',
                    active
                      ? 'bg-gold text-black border-gold shadow-[0_0_18px_-4px_hsl(var(--gold)/0.7)]'
                      : 'glass-card text-white/90 border-white/10 hover:border-gold/40'
                  )}
                >
                  {time}
                </button>
              );
            })}
          </div>

          {selectedServiceData?.home_service && (
            <div className="mt-5 p-4 rounded-xl glass-card border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-white">Home Service</span>
              </div>
              <Button
                size="sm"
                onClick={() => setHomeService(!homeService)}
                className={cn(
                  'font-medium',
                  homeService
                    ? 'bg-gold text-black hover:bg-gold/90'
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                )}
              >
                {homeService ? <><Check className="w-3 h-3 mr-1" /> Selected</> : 'Select'}
              </Button>
            </div>
          )}
        </section>

        {/* Summary */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50 mb-3">Summary</h2>
          <div className="glass-card rounded-2xl border border-gold/20 p-5">
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
