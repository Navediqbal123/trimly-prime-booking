import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Clock,
  Calendar,
  Check,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { createBooking } from '@/lib/api';

const mockShop = {
  id: '1',
  shop_name: 'Classic Cuts Barbershop',
  description:
    'Traditional barbershop offering classic cuts and hot towel shaves. With over 20 years of experience, we pride ourselves on delivering the perfect cut every time.',
  address: '123 Main Street, Downtown',
  phone: '+1 234 567 890',
  image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800',
  rating: 4.8,
  reviews: 124,
};

const mockServices = [
  { id: '1', name: 'Classic Haircut', duration: 30, price: 25 },
  { id: '2', name: 'Fade Haircut', duration: 45, price: 35 },
  { id: '3', name: 'Beard Trim', duration: 20, price: 15 },
  { id: '4', name: 'Hot Towel Shave', duration: 30, price: 30 },
  { id: '5', name: 'Haircut + Beard', duration: 60, price: 45 },
  { id: '6', name: 'Kids Haircut', duration: 20, price: 18 },
];

const timeSlots = [
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM',
  '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
];

export default function BookingPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedServiceData = mockServices.find((s) => s.id === selectedService);

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

    setLoading(true);

    // Format date as YYYY-MM-DD
    const formattedDate = selectedDate.toISOString().split('T')[0];

    const response = await createBooking({
      barber_id: shopId || mockShop.id,
      service_id: selectedService,
      date: formattedDate,
      time: selectedTime,
    });

    if (response.success) {
      toast.success('Booking confirmed! Check your bookings for details.');
      navigate('/bookings');
    } else {
      toast.error(response.error || 'Failed to create booking');
    }

    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Back Button */}
      <Button
        variant="ghost"
        className="mb-4"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shop Info */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-border rounded-2xl overflow-hidden sticky top-8"
          >
            <div className="h-48 overflow-hidden">
              <img
                src={mockShop.image_url}
                alt={mockShop.shop_name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-5">
              <h2 className="text-xl font-display font-bold mb-2">
                {mockShop.shop_name}
              </h2>
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{mockShop.rating}</span>
                <span className="text-muted-foreground">
                  ({mockShop.reviews} reviews)
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {mockShop.description}
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{mockShop.address}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{mockShop.phone}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Booking Steps */}
        <div className="lg:col-span-2">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all',
                    step >= s
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {step > s ? <Check className="w-5 h-5" /> : s}
                </div>
                <span
                  className={cn(
                    'ml-2 text-sm hidden sm:block',
                    step >= s ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {s === 1 ? 'Service' : s === 2 ? 'Date & Time' : 'Confirm'}
                </span>
                {s < 3 && (
                  <ChevronRight className="w-5 h-5 mx-4 text-muted-foreground" />
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
                  {mockServices.map((service) => (
                    <motion.div
                      key={service.id}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => setSelectedService(service.id)}
                      className={cn(
                        'p-4 rounded-xl border cursor-pointer transition-all',
                        selectedService === service.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
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
                <h3 className="text-xl font-semibold mb-4">Select Date</h3>
                <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
                  {generateDates().map((date) => (
                    <motion.button
                      key={date.toISOString()}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedDate(date)}
                      className={cn(
                        'flex flex-col items-center p-3 rounded-xl min-w-[70px] transition-all',
                        selectedDate?.toDateString() === date.toDateString()
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border hover:border-primary/50'
                      )}
                    >
                      <span className="text-xs uppercase">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="text-lg font-bold">{date.getDate()}</span>
                      <span className="text-xs">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </motion.button>
                  ))}
                </div>

                <h3 className="text-xl font-semibold mb-4">Select Time</h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-6">
                  {timeSlots.map((time) => (
                    <motion.button
                      key={time}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setSelectedTime(time)}
                      className={cn(
                        'p-2 rounded-lg text-sm transition-all',
                        selectedTime === time
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border hover:border-primary/50'
                      )}
                    >
                      {time}
                    </motion.button>
                  ))}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!selectedDate || !selectedTime}
                    onClick={() => setStep(3)}
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
                <div className="bg-card border border-border rounded-xl p-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-border">
                      <span className="text-muted-foreground">Shop</span>
                      <span className="font-medium">{mockShop.shop_name}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-border">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-medium">
                        {selectedServiceData?.name}
                      </span>
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
                      <span className="font-medium">
                        {selectedServiceData?.duration} minutes
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-lg font-semibold">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        ${selectedServiceData?.price}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
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
