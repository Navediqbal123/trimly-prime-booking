import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  RefreshCw,
  Scissors,
  LayoutDashboard,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  getBarberBookings,
  getMyServices,
  getMyBarberProfile,
  getBarberDashboardStats,
  BookingData,
  ServiceData,
  BarberDashboardStats,
} from '@/lib/api';
import { StatsCards } from '@/components/barber/StatsCards';
import { EarningsChart } from '@/components/barber/EarningsChart';
import { DashboardSkeleton } from '@/components/barber/DashboardSkeleton';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: 'easeOut' as const,
    },
  },
};

const clayButton =
  'border border-border bg-card text-foreground shadow-sm hover:bg-secondary hover:text-primary';

const refreshButton =
  'border-0 bg-primary text-primary-foreground shadow-[5px_6px_12px_rgba(255,116,23,0.24),inset_2px_2px_4px_rgba(255,255,255,0.18)] hover:bg-primary/90 hover:text-primary-foreground';

export default function BarberDashboard() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [stats, setStats] =
    useState<BarberDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] =
    useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAllData = async (
    showRefreshState = false,
  ) => {
    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }

    setError(null);

    // Resolve internal barber_id (never the auth user id) to scope bookings
    const profileResponse =
      await getMyBarberProfile();

    const barberId = profileResponse.success
      ? profileResponse.data?.id
      : undefined;

    if (!profileResponse.success) {
      console.warn(
        'Profile fetch failed, showing empty dashboard:',
        profileResponse.error,
      );
    }

    // Fetch bookings and services in parallel
    const [
      bookingsRes,
      servicesRes,
      statsRes,
    ] = await Promise.all([
      getBarberBookings(),
      getMyServices(),
      getBarberDashboardStats(),
    ]);

    if (statsRes.success && statsRes.data) {
      setStats(statsRes.data);
    } else {
      console.warn(
        'Dashboard stats fetch failed, using booking-derived stats:',
        statsRes.error,
      );
      setStats(null);
    }

    if (bookingsRes.success && bookingsRes.data) {
      const list = Array.isArray(
        bookingsRes.data,
      )
        ? bookingsRes.data
        : [];

      setBookings(
        barberId
          ? list.filter(
              (b) =>
                !b.barber_id ||
                b.barber_id === barberId,
            )
          : list,
      );
    }

    if (servicesRes.success && servicesRes.data) {
      setServices(servicesRes.data);
    } else if (!servicesRes.success) {
      console.error(
        'Services fetch failed:',
        servicesRes.error,
      );

      toast.error(
        servicesRes.error ||
          'Failed to load services',
      );
    }

    setLoading(false);
    setIsRefreshing(false);

    if (showRefreshState) {
      toast.success('Dashboard refreshed');
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex min-h-[60vh] flex-col items-center justify-center bg-background px-5 py-16 text-center text-foreground"
      >
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive shadow-sm">
          <AlertCircle className="h-9 w-9" />
        </div>

        <h3 className="mb-2 text-xl font-bold text-foreground">
          Error Loading Dashboard
        </h3>

        <p className="max-w-md text-sm text-muted-foreground">
          {error}
        </p>

        <Button
          variant="outline"
          className={`${clayButton} mt-5 h-11 rounded-[18px] px-5 transition-all duration-200 hover:scale-105 active:scale-95`}
          onClick={() => fetchAllData()}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
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
      className="min-h-full space-y-6 bg-background pb-28 text-foreground"
    >
      {/* Dashboard Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
            <LayoutDashboard className="h-7 w-7" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              Barber{' '}
              <span className="text-primary">Hub</span>
            </h1>

            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Manage your shop, services, and appointments
            </p>
          </div>
        </div>

        {/* Refresh */}
        <Button
          variant="outline"
          onClick={() => fetchAllData(true)}
          disabled={isRefreshing}
          className={`${refreshButton} h-11 w-full rounded-[18px] px-5 font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.02] active:translate-y-[2px] active:scale-[0.97] sm:w-auto`}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 stroke-[2.8] drop-shadow-[0_1px_1px_rgba(0,0,0,0.15)] ${isRefreshing ? 'animate-spin' : ''}`}
          />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={itemVariants}>
        <StatsCards
          services={services}
          bookings={bookings}
          stats={stats}
        />
      </motion.div>

      {/* Earnings */}
      <motion.div variants={itemVariants}>
        <EarningsChart
          bookings={bookings}
          services={services}
        />
      </motion.div>

      {/* Small Dashboard Footer Accent */}
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-center gap-2 pt-2 text-xs font-medium text-muted-foreground"
      >
        <Scissors className="h-3.5 w-3.5 text-primary" />
        <span>Trimlyhub Barber Dashboard</span>
      </motion.div>
    </motion.div>
  );
}
