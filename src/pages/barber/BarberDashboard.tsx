import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { DashboardSkeleton } from '@/components/barber/DashboardSkeleton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function BarberDashboard() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAllData = async (showRefreshState = false) => {
    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    // Try to get profile - if it fails, still show dashboard with empty data
    const profileResponse = await getMyBarberProfile();
    
    if (!profileResponse.success) {
      // For any profile error, show dashboard with empty state instead of blocking
      console.warn('Profile fetch failed, showing empty dashboard:', profileResponse.error);
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
    setIsRefreshing(false);
    if (showRefreshState) toast.success('Dashboard refreshed');
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

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center py-16 text-center"
      >
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h3 className="text-xl font-semibold mb-2">Error Loading Dashboard</h3>
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => fetchAllData()}>
          Try Again
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            Barber <span className="gradient-text">Hub</span>
          </h1>
          <p className="text-muted-foreground">Manage your shop, services, and appointments</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => fetchAllData(true)} 
          disabled={isRefreshing}
          className="transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <StatsCards services={services} bookings={bookings} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <EarningsChart bookings={bookings} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <ServicesTable services={services} onRefresh={refreshServices} loading={servicesLoading} />
      </motion.div>

      <motion.div variants={itemVariants}>
        <BookingsTable bookings={bookings} onRefresh={refreshBookings} loading={bookingsLoading} />
      </motion.div>
    </motion.div>
  );
}
