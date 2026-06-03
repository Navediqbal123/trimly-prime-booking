import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

const GOLD = '#C9A227';

export default function BookingPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin mb-4" style={{ color: GOLD }} />
        <p className="text-black">Loading...</p>
      </div>
    );
  }

  if (!shopId || !shop) {
    return (
      <div className="min-h-screen bg-white p-4">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-black hover:bg-black/5">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-black/40 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-black">Barber Not Found</h3>
          <Button onClick={() => navigate('/discover')}>Discover Barbers</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-2xl mx-auto pb-10 px-4 pt-4">
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
          className="rounded-2xl p-5 mb-8 flex items-center gap-4 border border-black/10 bg-white shadow-sm"
        >
          <div className="w-14 h-14 rounded-full p-[2px] shrink-0" style={{ background: GOLD }}>
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
              <Scissors className="w-6 h-6" style={{ color: GOLD }} />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-display font-bold text-black truncate">{shop.shop_name}</h1>
            <div className="flex items-center gap-1.5 text-xs text-black/70 mt-1">
              <MapPin className="w-3 h-3 shrink-0" style={{ color: GOLD }} />
              <span className="truncate">{shop.location}</span>
            </div>
            <div className="flex items-center gap-0.5 mt-1.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className="w-3 h-3"
                  style={i <= 4 ? { fill: GOLD, color: GOLD } : { color: 'rgba(0,0,0,0.2)' }}
                />
              ))}
              <span className="ml-1.5 text-[11px] text-black/80">4.8</span>
            </div>
          </div>
        </motion.div>

        {/* Service */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/60 mb-3">Service</h2>
          {services.length === 0 ? (
            <div className="rounded-2xl p-8 text-center border border-black/10 bg-white">
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
              <SelectTrigger className="w-full h-14 bg-white border border-black/15 rounded-xl px-4 text-black hover:border-black/30 transition-colors">
                <SelectValue placeholder="Choose a service" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-black/10 text-black">
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id} className="py-3 text-black focus:bg-black/5">
                    <div className="flex items-center justify-between gap-6 w-full">
                      <div className="flex flex-col text-left">
                        <span className="font-medium text-sm flex items-center gap-1.5">
                          {service.name}
                          {service.home_service && <Home className="w-3 h-3" style={{ color: GOLD }} />}
                        </span>
                        <span className="text-[11px] text-black/60 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" /> {service.duration} min
                        </span>
                      </div>
                      <span className="text-sm font-semibold" style={{ color: GOLD }}>₹{service.price}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </section>

        {/* Date — inline calendar */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/60 mb-3">
            Date {selectedDate && <span className="text-black/80 normal-case tracking-normal font-medium">· {format(selectedDate, 'EEE, MMM d, yyyy')}</span>}
          </h2>
          <div className="rounded-2xl border border-black/10 bg-white p-2 shadow-sm flex justify-center">
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
                caption_label: 'text-sm font-semibold text-black',
                nav_button: 'h-7 w-7 bg-white hover:bg-black/5 text-black border border-black/10 rounded-lg p-0 transition-colors inline-flex items-center justify-center',
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                head_cell: 'text-black/50 rounded-md w-10 font-medium text-[0.7rem] uppercase tracking-wider',
                row: 'flex w-full mt-1.5',
                cell: 'h-10 w-10 text-center text-sm p-0 relative',
                day: 'h-10 w-10 p-0 font-normal rounded-lg text-black hover:bg-black/5 transition-colors aria-selected:opacity-100 inline-flex items-center justify-center',
                day_selected: 'text-white hover:opacity-90 focus:opacity-90',
                day_today: 'border border-black/20 font-semibold',
                day_outside: 'text-black/30',
                day_disabled: 'text-black/20 opacity-50',
              }}
              modifiersStyles={{
                selected: { background: GOLD, color: '#fff' },
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
              return (
                <button
                  key={time}
                  onClick={() => setSelectedTime(time)}
                  className={cn(
                    'py-3 px-2 rounded-xl text-[13px] font-medium transition-all border',
                    active
                      ? 'text-white border-transparent shadow-md'
                      : 'bg-white text-black border-black/15 hover:border-black/30'
                  )}
                  style={active ? { background: GOLD } : undefined}
                >
                  {time}
                </button>
              );
            })}
          </div>

          {selectedServiceData?.home_service && (
            <div className="mt-5 p-4 rounded-xl bg-white border border-black/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4" style={{ color: GOLD }} />
                <span className="text-sm font-medium text-black">Home Service</span>
              </div>
              <Button
                size="sm"
                onClick={() => setHomeService(!homeService)}
                className="text-white hover:opacity-90"
                style={{ background: homeService ? GOLD : '#111' }}
              >
                {homeService ? <><Check className="w-3 h-3 mr-1" /> Selected</> : 'Select'}
              </Button>
            </div>
          )}
        </section>

        {/* Summary */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-black/60 mb-3">Summary</h2>
          <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
            <div className="space-y-3 text-sm">
              {[
                ['Service', selectedServiceData?.name || '—'],
                ['Date', selectedDate ? format(selectedDate, 'EEE, MMM d') : '—'],
                ['Time', selectedTime || '—'],
                ['Duration', selectedServiceData ? `${selectedServiceData.duration} min` : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-black/60">{label}</span>
                  <span className="text-black font-medium">{value}</span>
                </div>
              ))}
              {homeService && (
                <div className="flex justify-between items-center">
                  <span className="text-black/60">Type</span>
                  <span className="font-medium flex items-center gap-1" style={{ color: GOLD }}>
                    <Home className="w-3 h-3" /> Home Service
                  </span>
                </div>
              )}
              <div className="border-t border-black/10 pt-4 mt-4 flex justify-between items-center">
                <span className="text-sm font-medium text-black/70">Total</span>
                <span className="text-3xl font-bold leading-none" style={{ color: GOLD }}>
                  ₹{selectedServiceData?.price || 0}
                </span>
              </div>
            </div>
          </div>
        </section>

        <Button
          onClick={handleBook}
          disabled={loading || !selectedService || !selectedDate || !selectedTime}
          className="w-full h-14 text-white font-semibold text-base rounded-xl hover:opacity-95 disabled:opacity-40 transition-all"
          style={{ background: GOLD }}
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
