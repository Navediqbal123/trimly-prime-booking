import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, DollarSign, Users, TrendingUp, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getBarberBookings, BookingData } from '@/lib/api';
import { toast } from 'sonner';

export default function BarberDashboard() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      
      const response = await getBarberBookings();
      
      if (response.success && response.data) {
        setBookings(response.data);
      } else {
        // Check if 403 (not approved barber)
        if (response.error?.includes('403') || response.error?.toLowerCase().includes('unauthorized') || response.error?.toLowerCase().includes('forbidden')) {
          setError('pending');
        } else {
          setError(response.error || 'Failed to load bookings');
        }
      }
      setLoading(false);
    };

    fetchBookings();
  }, []);

  // Calculate stats from real data
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.date === todayStr);
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending');
  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.service?.price || 0), 0);

  const stats = [
    { title: 'Total Bookings', value: bookings.length.toString(), icon: Calendar },
    { title: 'Revenue', value: `₹${totalRevenue}`, icon: DollarSign },
    { title: 'Upcoming', value: confirmedBookings.length.toString(), icon: Users },
    { title: 'Today', value: todayBookings.length.toString(), icon: TrendingUp },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  // Show pending approval message
  if (error === 'pending') {
    return (
      <div className="animate-fade-in">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mb-6">
            <Clock className="w-10 h-10 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Waiting for Admin Approval</h2>
          <p className="text-muted-foreground max-w-md">
            Your barber application is under review. Once approved, you'll be able to manage your shop and accept bookings.
          </p>
        </div>
      </div>
    );
  }

  // Show error if any other issue
  if (error) {
    return (
      <div className="animate-fade-in">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-xl font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
          Barber <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-muted-foreground">Overview of your barbershop performance</p>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
      >
        {stats.map((stat) => (
          <Card key={stat.title} className="border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Today's Bookings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Today's Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayBookings.length > 0 ? (
              <div className="space-y-4">
                {todayBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium">Customer</p>
                      <p className="text-sm text-muted-foreground">{booking.service?.name || 'Service'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{booking.time_slot}</p>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'confirmed'
                            ? 'bg-green-500/10 text-green-500'
                            : 'bg-yellow-500/10 text-yellow-500'
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No bookings for today</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
