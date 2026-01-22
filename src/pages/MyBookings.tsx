import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { getMyBookings, cancelBooking, BookingData } from '@/lib/api';
import { toast } from 'sonner';

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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    const response = await getMyBookings();
    
    if (response.success && response.data) {
      setBookings(response.data);
    } else {
      toast.error(response.error || 'Failed to fetch bookings');
    }
    setLoading(false);
  };

  const handleCancelBooking = async (bookingId: string) => {
    setCancellingId(bookingId);
    const response = await cancelBooking(bookingId);
    
    if (response.success) {
      toast.success('Booking cancelled successfully');
      fetchBookings(); // Refresh list
    } else {
      toast.error(response.error || 'Failed to cancel booking');
    }
    setCancellingId(null);
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
        whileHover={{ y: -2 }}
        className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300"
      >
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-semibold">{booking.barber?.shop_name || 'Barber Shop'}</h3>
              <p className="text-sm text-primary">{booking.service?.name || 'Service'}</p>
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
              <span>{booking.time_slot}</span>
            </div>
            {booking.service?.price && (
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground">₹{booking.service.price}</span>
              </div>
            )}
          </div>

          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <div className="flex gap-2 mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-destructive hover:bg-destructive/10"
                onClick={() => handleCancelBooking(booking.id)}
                disabled={cancellingId === booking.id}
              >
                {cancellingId === booking.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading your bookings...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            My <span className="gradient-text">Bookings</span>
          </h1>
          <p className="text-muted-foreground">Manage your appointments</p>
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
              <Button className="mt-4" onClick={() => navigate('/discover')}>
                Book Now
              </Button>
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
