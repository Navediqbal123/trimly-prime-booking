import { motion } from 'framer-motion';
import { Calendar, IndianRupee, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceData, BookingData, BarberDashboardStats } from '@/lib/api';
import { bookingAmount, buildServiceMap } from '@/lib/bookingAmount';
import { useCountUp } from '@/hooks/useCountUp';


interface StatsCardsProps {
  services: ServiceData[];
  bookings: BookingData[];
  /** Server-provided stats from GET /api/barber/dashboard (preferred when present) */
  stats?: BarberDashboardStats | null;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  index: number;
  formatAsCurrency?: boolean;
}

function StatCard({ title, value, prefix = '', icon: Icon, color, bgColor, index, formatAsCurrency }: StatCardProps) {
  const displayValue = useCountUp(value, {
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
        {/* Subtle gradient overlay on hover */}
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
            {prefix}{displayValue}
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function StatsCards({ services, bookings, stats: apiStats, isLoading }: StatsCardsProps) {
  const serviceMap = buildServiceMap(services);
  const statusOf = (b: BookingData) => String(b.status ?? '').toLowerCase().trim();

  const completed = bookings.filter((b) => statusOf(b) === 'completed');
  const totalBookings = apiStats?.total_bookings ?? bookings.length;
  const completedBookings = apiStats?.completed ?? completed.length;
  const pendingBookings = apiStats?.pending ?? bookings.filter((b) => statusOf(b) === 'pending').length;
  const approvedBookings =
    apiStats?.approved ?? bookings.filter((b) => statusOf(b) === 'approved').length;
  const cancelledBookings =
    apiStats?.cancelled ??
    bookings.filter((b) => ['cancelled', 'canceled', 'rejected'].includes(statusOf(b))).length;

  // Earnings come from the API when available, else from completed bookings priced via services
  const totalEarnings =
    apiStats?.total_earnings ?? completed.reduce((sum, b) => sum + bookingAmount(b, serviceMap), 0);


  const stats = [
    { 
      title: 'Total Bookings', 
      value: totalBookings, 
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    { 
      title: 'Completed', 
      value: completedBookings, 
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Approved',
      value: approvedBookings,
      icon: CheckCircle,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
    {
      title: 'Cancelled',
      value: cancelledBookings,
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
    { 
      title: 'Pending', 
      value: pendingBookings, 
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    { 
      title: 'Total Earnings', 
      value: totalEarnings, 
      prefix: '₹',
      icon: IndianRupee,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      formatAsCurrency: true,
    },
  ];


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
    >
      {stats.map((stat, index) => (
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
    </motion.div>
  );
}
