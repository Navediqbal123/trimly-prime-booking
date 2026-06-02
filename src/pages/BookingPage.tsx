import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  MapPin,
  Clock,
  Calendar as CalendarIcon,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-foreground">Loading...</p>
      </div>
    );
  }

  if (!shopId || !shop) {
    return (
      <div className="animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-foreground/60 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-foreground">Barber Not Found</h3>
          <Button onClick={() => navigate('/discover')}>Discover Barbers</Button>
        </div>
      </div>
    );
  }


  return (
    <div className="animate-fade-in max-w-2xl mx-auto pb-10 px-1">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-5 text-foreground -ml-2">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* Barber Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 mb-8 flex items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full btn-gold p-[2px] shrink-0">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
            <Scissors className="w-6 h-6 text-gold" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-display font-bold gradient-gold-text truncate">{shop.shop_name}</h1>
          <div className="flex items-center gap-1.5 text-xs text-foreground/70 mt-1">
            <MapPin className="w-3 h-3 text-gold shrink-0" />
            <span className="truncate">{shop.location}</span>
          </div>
          <div className="flex items-center gap-0.5 mt-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={cn('w-3 h-3', i <= 4 ? 'fill-gold text-gold' : 'text-foreground/25')} />
            ))}
            <span className="ml-1.5 text-[11px] text-foreground/80">4.8</span>
          </div>
        </div>
      </motion.div>

      {/* Service Selection */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="mb-8"
      >
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60 mb-3 px-1">Service</h2>
        {services.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Scissors className="w-9 h-9 text-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-foreground/60">No services added yet by this barber.</p>
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
            <SelectTrigger className="w-full h-14 bg-card/60 border-border rounded-xl px-4 text-foreground hover:border-gold/50 transition-colors">
              <SelectValue placeholder="Choose a service" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id} className="py-3">
                  <div className="flex items-center justify-between gap-6 w-full">
                    <div className="flex flex-col text-left">
                      <span className="font-medium text-sm text-foreground flex items-center gap-1.5">
                        {service.name}
                        {service.home_service && <Home className="w-3 h-3 text-gold" />}
                      </span>
                      <span className="text-[11px] text-foreground/60 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" /> {service.duration} min
                      </span>
                    </div>
                    <span className="text-sm font-semibold gradient-gold-text">₹{service.price}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </motion.section>

      {/* Date Picker */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60 mb-3 px-1">Date</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal h-14 bg-card/60 border-border rounded-xl px-4 hover:border-gold/50 hover:bg-card/60',
                !selectedDate && 'text-foreground/50'
              )}
            >
              <CalendarIcon className="mr-3 h-4 w-4 text-gold" />
              {selectedDate ? format(selectedDate, 'EEE, MMM d, yyyy') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 border-border bg-[hsl(270_50%_8%)] backdrop-blur-xl rounded-2xl shadow-2xl"
            align="start"
          >
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => setSelectedDate(date ?? undefined)}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className="p-3 pointer-events-auto"
              classNames={{
                day: 'h-9 w-9 p-0 font-normal rounded-lg text-foreground/85 hover:bg-gold/15 hover:text-foreground transition-colors aria-selected:opacity-100',
                day_selected:
                  'bg-gold text-gold-foreground hover:bg-gold hover:text-gold-foreground focus:bg-gold focus:text-gold-foreground shadow-[0_0_18px_hsl(43_90%_60%_/_0.45)]',
                day_today: 'border border-gold/40 text-gold',
                day_outside: 'text-foreground/30',
                day_disabled: 'text-foreground/20 opacity-50',
                head_cell: 'text-foreground/50 rounded-md w-9 font-medium text-[0.7rem] uppercase tracking-wider',
                caption_label: 'text-sm font-semibold text-foreground',
                nav_button: 'h-7 w-7 bg-card/40 hover:bg-gold/15 hover:text-gold border border-border rounded-lg p-0 transition-colors',
                cell: 'h-9 w-9 text-center text-sm p-0 relative',
              }}
            />
          </PopoverContent>
        </Popover>
      </motion.section>

      {/* Time Slots */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-8"
      >
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60 mb-3 px-1">Time</h2>
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
                    ? 'bg-gold text-gold-foreground border-gold shadow-[0_0_18px_hsl(43_90%_60%_/_0.45)]'
                    : 'bg-card/60 text-foreground/85 border-border hover:border-gold/50 hover:text-foreground'
                )}
              >
                {time}
              </button>
            );
          })}
        </div>

        {selectedServiceData?.home_service && (
          <div className="mt-5 p-4 rounded-xl bg-card/60 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Home className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-foreground">Home Service</span>
            </div>
            <Button
              size="sm"
              variant={homeService ? 'default' : 'outline'}
              onClick={() => setHomeService(!homeService)}
              className={homeService ? 'bg-gold text-gold-foreground hover:bg-gold/90' : ''}
            >
              {homeService ? <><Check className="w-3 h-3 mr-1" /> Selected</> : 'Select'}
            </Button>
          </div>
        )}
      </motion.section>

      {/* Summary */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/60 mb-3 px-1">Summary</h2>
        <div className="glass-card rounded-2xl p-5">
          <div className="space-y-3 text-sm">
            {[
              ['Service', selectedServiceData?.name || '—'],
              ['Date', selectedDate ? format(selectedDate, 'EEE, MMM d') : '—'],
              ['Time', selectedTime || '—'],
              ['Duration', selectedServiceData ? `${selectedServiceData.duration} min` : '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-foreground/60">{label}</span>
                <span className="text-foreground font-medium">{value}</span>
              </div>
            ))}
            {homeService && (
              <div className="flex justify-between items-center">
                <span className="text-foreground/60">Type</span>
                <span className="text-gold font-medium flex items-center gap-1">
                  <Home className="w-3 h-3" /> Home Service
                </span>
              </div>
            )}
            <div className="border-t border-border/60 pt-4 mt-4 flex justify-between items-center">
              <span className="text-sm font-medium text-foreground/70">Total</span>
              <span className="text-3xl font-bold gradient-gold-text leading-none">
                ₹{selectedServiceData?.price || 0}
              </span>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Confirm Button */}
      <Button
        onClick={handleBook}
        disabled={loading || !selectedService || !selectedDate || !selectedTime}
        className="w-full h-14 btn-gold text-gold-foreground font-semibold text-base rounded-xl shadow-[0_8px_30px_hsl(43_90%_60%_/_0.35)] hover:opacity-95 disabled:opacity-40 disabled:shadow-none transition-all"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Booking...</>
        ) : (
          <><Check className="w-5 h-5 mr-2" /> Confirm Booking</>
        )}
      </Button>
    </div>
  );
}
