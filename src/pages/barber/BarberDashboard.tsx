import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { 
  getBarberBookings, 
  getMyServices, 
  getMyBarberProfile,
  BookingData, 
  ServiceData 
} from '@/lib/api';
import { StatsCards } from '@/components/barber/StatsCards';
import { EarningsChart } from '@/components/barber/EarningsChart';
import { ServicesTable } from '@/components/barber/ServicesTable';
import { BookingsTable } from '@/components/barber/BookingsTable';

export default function BarberDashboard() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    
    // Check barber profile first
    const profileResponse = await getMyBarberProfile();
    
    if (!profileResponse.success) {
      if (profileResponse.error?.includes('403') || 
          profileResponse.error?.toLowerCase().includes('unauthorized') || 
          profileResponse.error?.toLowerCase().includes('forbidden') ||
          profileResponse.error?.toLowerCase().includes('pending')) {
        setError('pending');
      } else {
        setError(profileResponse.error || 'Failed to load profile');
      }
      setLoading(false);
      return;
    }

    // If barber status is pending, show waiting message
    if (profileResponse.data?.status === 'pending') {
      setError('pending');
      setLoading(false);
      return;
    }

    // Fetch bookings and services in parallel
    const [bookingsRes, servicesRes] = await Promise.all([
      getBarberBookings(),
      getMyServices(),
    ]);

    if (bookingsRes.success && bookingsRes.data) {
      setBookings(bookingsRes.data);
    }

    if (servicesRes.success && servicesRes.data) {
      setServices(servicesRes.data);
    }

    setLoading(false);
  };

  const refreshBookings = async () => {
    setBookingsLoading(true);
    const response = await getBarberBookings();
    if (response.success && response.data) {
      setBookings(response.data);
    } else {
      toast.error(response.error || 'Failed to refresh bookings');
    }
    setBookingsLoading(false);
  };

  const refreshServices = async () => {
    setServicesLoading(true);
    const response = await getMyServices();
    if (response.success && response.data) {
      setServices(response.data);
    } else {
      toast.error(response.error || 'Failed to refresh services');
    }
    setServicesLoading(false);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

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
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
          Barber <span className="gradient-text">Dashboard</span>
        </h1>
        <p className="text-muted-foreground">Overview of your barbershop performance</p>
      </div>

      {/* Stats Cards */}
      <StatsCards services={services} bookings={bookings} />

      {/* Earnings Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <EarningsChart bookings={bookings} />
      </motion.div>

      {/* Services Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <ServicesTable 
          services={services} 
          onRefresh={refreshServices} 
          loading={servicesLoading} 
        />
      </motion.div>

      {/* Bookings Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <BookingsTable 
          bookings={bookings} 
          onRefresh={refreshBookings} 
          loading={bookingsLoading} 
        />
      </motion.div>
    </div>
  );
}