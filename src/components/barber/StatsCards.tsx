import { motion } from 'framer-motion';
import { Scissors, Calendar, IndianRupee, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceData, BookingData } from '@/lib/api';
import { useCountUp } from '@/hooks/useCountUp';

interface StatsCardsProps {
  services: ServiceData[];
  bookings: BookingData[];
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

export function StatsCards({ services, bookings, isLoading }: StatsCardsProps) {
  // Calculate stats from real data
  const totalServices = services.length;
  const totalBookings = bookings.length;
  
  // Active bookings (pending or confirmed)
  const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length;
  
  // Cancelled bookings
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
  
  // Calculate total earnings from completed/pending/confirmed bookings
  const totalEarnings = bookings
    .filter(b => b.status === 'completed' || b.status === 'confirmed' || b.status === 'pending')
    .reduce((sum, b) => sum + (b.service?.price || 0), 0);

  const stats = [
    { 
      title: 'Total Bookings', 
      value: totalBookings, 
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    { 
      title: 'Active Bookings', 
      value: activeBookings, 
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    { 
      title: 'Cancelled', 
      value: cancelledBookings, 
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
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
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
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
