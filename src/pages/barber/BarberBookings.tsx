import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getBarberBookings, BookingData } from '@/lib/api';

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
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchBookings = async () => {
    setLoading(true);
    const response = await getBarberBookings();
    
    if (response.success && response.data) {
      setBookings(response.data);
    } else {
      toast.error(response.error || 'Failed to fetch bookings');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  );

  const BookingCard = ({ booking }: { booking: BookingData }) => {
    const status = booking.status as keyof typeof statusConfig;
    const config = statusConfig[status] || statusConfig.pending;
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
              <p className="font-medium">Customer</p>
              <p className="text-sm text-muted-foreground">Booking #{booking.id.slice(0, 8)}</p>
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
          <p className="text-primary font-medium">{booking.service?.name || 'Service'}</p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(booking.date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{booking.time_slot}</span>
            </div>
          </div>
          {booking.home_service && (
            <div className="text-sm text-green-500">🏠 Home Service</div>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-lg font-bold">₹{booking.service?.price || 0}</span>
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            Customer <span className="gradient-text">Bookings</span>
          </h1>
          <p className="text-muted-foreground">Manage your customer appointments</p>
        </div>
        <Button variant="outline" onClick={fetchBookings} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
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
