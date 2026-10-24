import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Scissors, Calendar, IndianRupee, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getAdminUsers, getApprovedBarbers, getAllBookings } from '@/lib/api';
import { toast } from 'sonner';
import { useCountUp } from '@/hooks/useCountUp';
import { AdminMenuButton } from '@/components/layout/AdminMenuButton';

interface DashboardStats {
  totalUsers: number | null;
  totalBarbers: number;
  totalBookings: number;
  totalRevenue: number;
}

interface StatCardProps {
  title: string;
  value: number | null;
  prefix?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  index: number;
  formatAsCurrency?: boolean;
}

function StatCard({ title, value, prefix = '', icon: Icon, color, bgColor, index, formatAsCurrency }: StatCardProps) {
  const displayValue = useCountUp(value ?? 0, {
    duration: 1200,
    delay: index * 100,
    formatter: (v) => formatAsCurrency ? v.toLocaleString('en-IN') : v.toString(),
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1,
        duration: 0.4,
        ease: "easeOut",
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
    >
      <Card className="border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 cursor-default overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <motion.div 
            className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <Icon className={`w-5 h-5 ${color}`} />
          </motion.div>
        </CardHeader>
        <CardContent className="relative z-10">
          <motion.div 
            className="text-3xl font-bold tracking-tight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.1 + 0.2 }}
          >
            {value === null ? '—' : `${prefix}${displayValue}`}
          </motion.div>
          <p className="text-xs text-muted-foreground mt-1">Real-time data</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="w-10 h-10 rounded-xl" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: null,
    totalBarbers: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const fetchStats = async (showRefreshState = false) => {
    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      const [usersRes, barbersRes, bookingsRes] = await Promise.all([
        getAdminUsers(),
        getApprovedBarbers(),
        getAllBookings(),
      ]);

      let totalUsers: number | null = null;
      let totalBarbers = 0;
      let totalBookings = 0;
      let totalRevenue = 0;

      if (usersRes.success && usersRes.data) {
        totalUsers = usersRes.data.length;
        setUsersError(null);
      } else {
        setUsersError(usersRes.error || 'Could not load registered users.');
        toast.error(usersRes.error || 'Failed to fetch user statistics');
      }

      if (barbersRes.success && barbersRes.data) {
        totalBarbers = barbersRes.data.length;
      }

      if (bookingsRes.success && bookingsRes.data) {
        totalBookings = bookingsRes.data.length;
        totalRevenue = bookingsRes.data
          .filter(b => b.status === 'completed' || b.status === 'pending' || b.status === 'confirmed')
          .reduce((sum, booking) => sum + (booking.service?.price || 0), 0);
      }

      setStats({
        totalUsers,
        totalBarbers,
        totalBookings,
        totalRevenue,
      });

      if (showRefreshState && usersRes.success) {
        toast.success('Dashboard refreshed');
      }
    } catch (error) {
      setUsersError('Failed to fetch dashboard stats. Please try refreshing.');
      toast.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statsCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    { 
      title: 'Total Barbers', 
      value: stats.totalBarbers, 
      icon: Scissors, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    { 
      title: 'Total Bookings', 
      value: stats.totalBookings, 
      icon: Calendar, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    { 
      title: 'Revenue', 
      value: stats.totalRevenue, 
      prefix: '₹',
      icon: IndianRupee, 
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      formatAsCurrency: true,
    },
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="page-black space-y-8"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <AdminMenuButton />
            <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
              Admin <span className="gradient-text">Dashboard</span>
            </h1>
          </div>
          <p className="text-muted-foreground">Platform overview and statistics</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => fetchStats(true)} 
          disabled={isRefreshing}
          className="transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {usersError && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          User statistics could not be loaded: {usersError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            prefix={stat.prefix}
            icon={stat.icon}
            color={stat.color}
            bgColor={stat.bgColor}
            index={index}
            formatAsCurrency={stat.formatAsCurrency}
          />
        ))}
      </div>
    </motion.div>
  );
}
