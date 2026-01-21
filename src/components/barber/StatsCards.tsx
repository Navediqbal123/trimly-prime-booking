import { motion } from 'framer-motion';
import { Scissors, Calendar, IndianRupee, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ServiceData, BookingData } from '@/lib/api';

interface StatsCardsProps {
  services: ServiceData[];
  bookings: BookingData[];
}

export function StatsCards({ services, bookings }: StatsCardsProps) {
  // Calculate stats from real data
  const totalServices = services.length;
  const totalBookings = bookings.length;
  
  // Calculate total earnings from completed/pending/confirmed bookings
  const totalEarnings = bookings
    .filter(b => b.status === 'completed' || b.status === 'confirmed' || b.status === 'pending')
    .reduce((sum, b) => sum + (b.service?.price || 0), 0);
  
  // Count unique customers (by booking, since we don't have customer data)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter(b => b.date === todayStr);

  const stats = [
    { 
      title: 'Total Services', 
      value: totalServices.toString(), 
      icon: Scissors,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    { 
      title: 'Total Bookings', 
      value: totalBookings.toString(), 
      icon: Calendar,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    { 
      title: 'Total Earnings', 
      value: `₹${totalEarnings.toLocaleString('en-IN')}`, 
      icon: IndianRupee,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    { 
      title: 'Today\'s Bookings', 
      value: todayBookings.length.toString(), 
      icon: Users,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-border hover:border-primary/50 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}