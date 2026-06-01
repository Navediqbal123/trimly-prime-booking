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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createBooking, getApprovedBarbers, getPendingBarbers, getBarberServices } from '@/lib/api';

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
    const response = await createBooking({
      barber_id: shopId,
      service_id: selectedService,
      date: selectedDate.toISOString().split('T')[0],
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
    <div className="animate-fade-in max-w-3xl mx-auto pb-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 text-foreground">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* Barber Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-5 mb-6 flex items-center gap-4"
      >
        <div className="w-16 h-16 rounded-full btn-gold p-1 shrink-0">
          <div className="w-full h-full rounded-full bg-background flex items-center justify-center">
            <Scissors className="w-7 h-7 text-gold" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-display font-bold gradient-gold-text truncate">{shop.shop_name}</h1>
          <div className="flex items-center gap-1 text-xs text-foreground/80 mt-1">
            <MapPin className="w-3 h-3 text-gold" />
            <span className="truncate">{shop.location}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className={cn('w-3 h-3', i <= 4 ? 'fill-gold text-gold' : 'text-foreground/30')} />
            ))}
            <span className="ml-1 text-xs text-foreground">4.8</span>
          </div>
        </div>
      </motion.div>

      {/* Service Selection */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl p-5 mb-6"
      >
        <h2 className="text-lg font-display font-bold text-foreground mb-4">Select Service</h2>
        {services.length === 0 ? (
          <div className="text-center py-6">
            <Scissors className="w-10 h-10 text-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-foreground/70">No services added yet by this barber.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => {
                  setSelectedService(service.id);
                  if (!service.home_service) setHomeService(false);
                }}
                className={cn(
                  'w-full flex items-center justify-between p-3 rounded-xl border transition-all',
                  selectedService === service.id
                    ? 'bg-primary/20 border-primary'
                    : 'bg-secondary/40 border-border hover:border-primary/50'
                )}
              >
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{service.name}</span>
                    {service.home_service && <Home className="w-3 h-3 text-gold" />}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-foreground/70 mt-0.5">
                    <Clock className="w-3 h-3" /> {service.duration} min
                  </div>
                </div>
                <span className="text-base font-bold gradient-gold-text">₹{service.price}</span>
              </button>
            ))}
          </div>
        )}
      </motion.div>

      {/* Date Picker */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-card rounded-2xl p-5 mb-6"
      >
        <h2 className="text-lg font-display font-bold text-foreground mb-4">Select Date</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal h-12 bg-secondary/40 border-border text-foreground hover:bg-secondary/60',
                !selectedDate && 'text-foreground/60'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-gold" />
              {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              initialFocus
              className={cn('p-3 pointer-events-auto')}
            />
          </PopoverContent>
        </Popover>
      </motion.div>

      {/* Time Slots */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl p-5 mb-6"
      >
        <h2 className="text-lg font-display font-bold text-foreground mb-4">Select Time</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {timeSlots.map((time) => (
            <button
              key={time}
              onClick={() => setSelectedTime(time)}
              className={cn(
                'py-2.5 px-2 rounded-lg text-sm font-medium transition-all border',
                selectedTime === time
                  ? 'bg-gradient-to-r from-primary to-purple-500 text-primary-foreground border-primary shadow-lg shadow-primary/40'
                  : 'bg-secondary/40 text-foreground border-border hover:border-primary/50'
              )}
            >
              {time}
            </button>
          ))}
        </div>

        {selectedServiceData?.home_service && (
          <div className="mt-4 p-3 rounded-xl bg-secondary/40 border border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-foreground">Home Service</span>
            </div>
            <Button
              size="sm"
              variant={homeService ? 'default' : 'outline'}
              onClick={() => setHomeService(!homeService)}
            >
              {homeService ? <><Check className="w-3 h-3 mr-1" /> Selected</> : 'Select'}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Price Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="glass-card rounded-2xl p-5 mb-6"
      >
        <h2 className="text-lg font-display font-bold text-foreground mb-4">Summary</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between text-foreground/80">
            <span>Service</span>
            <span className="text-foreground font-medium">{selectedServiceData?.name || '—'}</span>
          </div>
          <div className="flex justify-between text-foreground/80">
            <span>Date</span>
            <span className="text-foreground font-medium">
              {selectedDate ? format(selectedDate, 'PPP') : '—'}
            </span>
          </div>
          <div className="flex justify-between text-foreground/80">
            <span>Time</span>
            <span className="text-foreground font-medium">{selectedTime || '—'}</span>
          </div>
          <div className="flex justify-between text-foreground/80">
            <span>Duration</span>
            <span className="text-foreground font-medium">
              {selectedServiceData ? `${selectedServiceData.duration} min` : '—'}
            </span>
          </div>
          {homeService && (
            <div className="flex justify-between text-foreground/80">
              <span>Type</span>
              <span className="text-gold font-medium flex items-center gap-1">
                <Home className="w-3 h-3" /> Home Service
              </span>
            </div>
          )}
          <div className="border-t border-border pt-3 flex justify-between items-center">
            <span className="text-base font-semibold text-foreground">Total</span>
            <span className="text-2xl font-bold gradient-gold-text">
              ₹{selectedServiceData?.price || 0}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Confirm Button */}
      <Button
        onClick={handleBook}
        disabled={loading || !selectedService || !selectedDate || !selectedTime}
        className="w-full h-14 bg-gradient-to-r from-primary via-purple-500 to-primary hover:opacity-90 text-primary-foreground font-bold text-base rounded-xl shadow-lg shadow-primary/40"
      >
        {loading ? (
          <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Booking...</>
        ) : (
          <><CalendarIcon className="w-5 h-5 mr-2" /> Confirm Booking</>
        )}
      </Button>
    </div>
  );
}
