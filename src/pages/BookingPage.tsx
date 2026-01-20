import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Calendar,
  ArrowLeft,
  Check,
  Home,
  Loader2,
  AlertCircle,
  Scissors,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createBooking, getApprovedBarbers, getBarberServices, ApprovedBarberData, ServiceData } from '@/lib/api';

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
];

export default function BookingPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [homeService, setHomeService] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  const [shop, setShop] = useState<ApprovedBarberData | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!shopId) {
        setLoadingData(false);
        return;
      }

      setLoadingData(true);

      // Fetch barber details
      const barbersResponse = await getApprovedBarbers();
      if (barbersResponse.success && barbersResponse.data) {
        const foundBarber = barbersResponse.data.find(b => b.id === shopId);
        if (foundBarber) {
          setShop(foundBarber);
        }
      }

      // Fetch services for this barber
      const servicesResponse = await getBarberServices(shopId);
      if (servicesResponse.success && servicesResponse.data) {
        setServices(servicesResponse.data);
      }

      setLoadingData(false);
    };

    fetchData();
  }, [shopId]);

  const selectedServiceData = services.find((s) => s.id === selectedService);

  const generateDates = () => {
    const dates = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const handleBook = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error('Please complete all steps');
      return;
    }

    // Validate UUIDs before sending
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!shopId || !uuidRegex.test(shopId)) {
      toast.error('Invalid barber ID. Please select a valid barber.');
      return;
    }

    if (!uuidRegex.test(selectedService)) {
      toast.error('Invalid service ID. Please select a valid service.');
      return;
    }

    setLoading(true);

    // Format date as YYYY-MM-DD
    const formattedDate = selectedDate.toISOString().split('T')[0];

    const response = await createBooking({
      barber_id: shopId,
      service_id: selectedService,
      date: formattedDate,
      time_slot: selectedTime,
      home_service: homeService,
    });

    if (response.success) {
      toast.success('Booking confirmed! Check your bookings for details.');
      navigate('/bookings');
    } else {
      toast.error(response.error || 'Failed to create booking');
    }

    setLoading(false);
  };

  const handleNext = () => {
    if (step === 1 && !selectedService) {
      toast.error('Please select a service');
      return;
    }
    if (step === 2 && (!selectedDate || !selectedTime)) {
      toast.error('Please select date and time');
      return;
    }
    setStep(step + 1);
  };

  // Loading state
  if (loadingData) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading barber details...</p>
      </div>
    );
  }

  // Show message if no shop ID or no data available
  if (!shopId || !shop) {
    return (
      <div className="animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Barber Not Found</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            The barber you're looking for doesn't exist or hasn't been approved yet.
          </p>
          <Button onClick={() => navigate('/discover')}>
            Discover Barbers
          </Button>
        </div>
      </div>
    );
  }

  // Show message if no services
  if (services.length === 0) {
    return (
      <div className="animate-fade-in">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Scissors className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Services Available</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            {shop.shop_name} hasn't added any services yet. Please check back later.
          </p>
          <Button onClick={() => navigate('/discover')}>
            Browse Other Barbers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shop Info */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl overflow-hidden sticky top-24"
          >
            <div className="h-48 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <Scissors className="w-16 h-16 text-primary/40" />
            </div>
            <div className="p-5">
              <h2 className="text-xl font-semibold mb-2">{shop.shop_name}</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{shop.location}</span>
                </div>
                {shop.user?.name && (
                  <p className="text-muted-foreground">Owner: {shop.user.name}</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Booking Steps */}
        <div className="lg:col-span-2">
          {/* Step Indicator */}
          <div className="flex items-center gap-4 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                    step >= s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground'
                  )}
                >
                  {step > s ? <Check className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={cn(
                      'w-16 h-0.5 mx-2',
                      step > s ? 'bg-primary' : 'bg-secondary'
                    )}
                  />
                )}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Select Service */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-xl font-semibold mb-4">Select a Service</h3>
                <div className="space-y-3">
                  {services.map((service) => (
                    <motion.div
                      key={service.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => {
                        setSelectedService(service.id);
                        if (!service.home_service) {
                          setHomeService(false);
                        }
                      }}
                      className={cn(
                        'p-4 rounded-xl border cursor-pointer transition-all',
                        selectedService === service.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{service.name}</h4>
                            {service.home_service && (
                              <Home className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                            <Clock className="w-4 h-4" />
                            <span>{service.duration} min</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-primary">
                            ${service.price}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <Button
                  className="w-full mt-6"
                  disabled={!selectedService}
                  onClick={() => setStep(2)}
                >
                  Continue
                </Button>
              </motion.div>
            )}

            {/* Step 2: Select Date & Time */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-xl font-semibold mb-4">Select Date & Time</h3>

                {/* Home Service Toggle */}
                {selectedServiceData?.home_service && (
                  <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Home className="w-5 h-5 text-green-500" />
                        <span className="font-medium">Home Service Available</span>
                      </div>
                      <Button
                        variant={homeService ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setHomeService(!homeService)}
                      >
                        {homeService ? 'Selected' : 'Select'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Date Selection */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3">Select Date</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {generateDates().map((date) => (
                      <motion.button
                        key={date.toISOString()}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          'flex-shrink-0 w-16 py-3 rounded-xl text-center transition-colors',
                          selectedDate?.toDateString() === date.toDateString()
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        )}
                      >
                        <div className="text-xs font-medium">
                          {date.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-lg font-bold">{date.getDate()}</div>
                        <div className="text-xs">
                          {date.toLocaleDateString('en-US', { month: 'short' })}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Select Time</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {timeSlots.map((time) => (
                      <motion.button
                        key={time}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setSelectedTime(time)}
                        className={cn(
                          'py-2 px-3 rounded-lg text-sm transition-colors',
                          selectedTime === time
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                        )}
                      >
                        {time}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!selectedDate || !selectedTime}
                    onClick={handleNext}
                  >
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-xl font-semibold mb-4">Confirm Booking</h3>

                <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{selectedServiceData?.name}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">
                      {selectedDate?.toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium">{selectedTime}</span>
                  </div>

                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{selectedServiceData?.duration} min</span>
                  </div>

                  {homeService && (
                    <div className="flex justify-between items-center pb-4 border-b border-border">
                      <span className="text-muted-foreground">Service Type</span>
                      <span className="font-medium text-green-500 flex items-center gap-1">
                        <Home className="w-4 h-4" /> Home Service
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      ${selectedServiceData?.price}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" onClick={() => setStep(2)} disabled={loading}>
                    Back
                  </Button>
                  <Button className="flex-1" onClick={handleBook} disabled={loading}>
                    {loading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Calendar className="w-4 h-4 mr-2" />
                    )}
                    {loading ? 'Booking...' : 'Confirm Booking'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
