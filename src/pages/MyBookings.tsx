import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  shop_name: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
  image_url: string;
}

const mockBookings: Booking[] = [
  {
    id: '1',
    shop_name: 'Classic Cuts Barbershop',
    service: 'Classic Haircut',
    date: '2024-01-20',
    time: '10:00 AM',
    status: 'confirmed',
    price: 25,
    image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500',
  },
  {
    id: '2',
    shop_name: 'Modern Styles Studio',
    service: 'Fade + Beard Trim',
    date: '2024-01-22',
    time: '2:30 PM',
    status: 'pending',
    price: 40,
    image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500',
  },
  {
    id: '3',
    shop_name: "The Gentleman's Corner",
    service: 'Premium Grooming',
    date: '2024-01-15',
    time: '11:00 AM',
    status: 'completed',
    price: 55,
    image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500',
  },
  {
    id: '4',
    shop_name: 'Urban Edge Barbers',
    service: 'Skin Fade',
    date: '2024-01-10',
    time: '3:00 PM',
    status: 'cancelled',
    price: 30,
    image_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500',
  },
];

const statusConfig = {
  pending: {
    icon: AlertCircle,
    label: 'Pending',
    className: 'text-yellow-500 bg-yellow-500/10',
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed',
    className: 'text-green-500 bg-green-500/10',
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    className: 'text-blue-500 bg-blue-500/10',
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    className: 'text-red-500 bg-red-500/10',
  },
};

export default function MyBookings() {
  const [activeTab, setActiveTab] = useState('upcoming');

  const upcomingBookings = mockBookings.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed'
  );
  const pastBookings = mockBookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  );

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const config = statusConfig[booking.status];
    const StatusIcon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="sm:w-32 h-32 sm:h-auto">
            <img
              src={booking.image_url}
              alt={booking.shop_name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{booking.shop_name}</h3>
                <p className="text-sm text-primary">{booking.service}</p>
              </div>
              <span
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                  config.className
                )}
              >
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-3">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(booking.date).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{booking.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">${booking.price}</span>
              </div>
            </div>

            {(booking.status === 'pending' || booking.status === 'confirmed') && (
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">
                  Reschedule
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10">
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
          My <span className="gradient-text">Bookings</span>
        </h1>
        <p className="text-muted-foreground">Manage your appointments</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastBookings.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingBookings.length > 0 ? (
            upcomingBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming bookings</p>
              <Button className="mt-4">Book Now</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-4">
          {pastBookings.length > 0 ? (
            pastBookings.map((booking) => (
              <BookingCard key={booking.id} booking={booking} />
            ))
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
