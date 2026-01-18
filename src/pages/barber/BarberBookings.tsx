import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Booking {
  id: string;
  customer_name: string;
  customer_email: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  price: number;
}

const mockBookings: Booking[] = [
  {
    id: '1',
    customer_name: 'John Smith',
    customer_email: 'john@example.com',
    service: 'Classic Haircut',
    date: '2024-01-20',
    time: '10:00 AM',
    status: 'pending',
    price: 25,
  },
  {
    id: '2',
    customer_name: 'Mike Johnson',
    customer_email: 'mike@example.com',
    service: 'Fade + Beard',
    date: '2024-01-20',
    time: '11:30 AM',
    status: 'confirmed',
    price: 40,
  },
  {
    id: '3',
    customer_name: 'David Wilson',
    customer_email: 'david@example.com',
    service: 'Hot Towel Shave',
    date: '2024-01-20',
    time: '2:00 PM',
    status: 'confirmed',
    price: 30,
  },
  {
    id: '4',
    customer_name: 'James Brown',
    customer_email: 'james@example.com',
    service: 'Kids Haircut',
    date: '2024-01-19',
    time: '3:30 PM',
    status: 'completed',
    price: 18,
  },
  {
    id: '5',
    customer_name: 'Robert Taylor',
    customer_email: 'robert@example.com',
    service: 'Premium Grooming',
    date: '2024-01-18',
    time: '10:00 AM',
    status: 'cancelled',
    price: 55,
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

export default function BarberBookings() {
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [activeTab, setActiveTab] = useState('upcoming');

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  );

  const handleConfirm = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'confirmed' } : b))
    );
    toast.success('Booking confirmed');
  };

  const handleComplete = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'completed' } : b))
    );
    toast.success('Booking marked as completed');
  };

  const handleCancel = (id: string) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b))
    );
    toast.success('Booking cancelled');
  };

  const BookingCard = ({ booking }: { booking: Booking }) => {
    const config = statusConfig[booking.status];
    const StatusIcon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-all"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{booking.customer_name}</p>
              <p className="text-sm text-muted-foreground">{booking.customer_email}</p>
            </div>
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

        <div className="space-y-2 mb-4">
          <p className="text-primary font-medium">{booking.service}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(booking.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{booking.time}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-lg font-bold">${booking.price}</span>
          <div className="flex gap-2">
            {booking.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCancel(booking.id)}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={() => handleConfirm(booking.id)}>
                  Confirm
                </Button>
              </>
            )}
            {booking.status === 'confirmed' && (
              <Button size="sm" onClick={() => handleComplete(booking.id)}>
                Mark Complete
              </Button>
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
          Customer <span className="gradient-text">Bookings</span>
        </h1>
        <p className="text-muted-foreground">Manage your customer appointments</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingBookings.length})
          </TabsTrigger>
          <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming bookings</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
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
