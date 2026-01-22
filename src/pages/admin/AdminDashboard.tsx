import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Scissors, Calendar, DollarSign, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAdminUsers, getApprovedBarbers, getAllBookings } from '@/lib/api';
import { toast } from 'sonner';

interface DashboardStats {
  totalUsers: number;
  totalBarbers: number;
  totalBookings: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalBarbers: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    
    try {
      // Fetch all data in parallel
      const [usersRes, barbersRes, bookingsRes] = await Promise.all([
        getAdminUsers(),
        getApprovedBarbers(),
        getAllBookings(),
      ]);

      let totalUsers = 0;
      let totalBarbers = 0;
      let totalBookings = 0;
      let totalRevenue = 0;

      if (usersRes.success && usersRes.data) {
        totalUsers = usersRes.data.length;
      }

      if (barbersRes.success && barbersRes.data) {
        totalBarbers = barbersRes.data.length;
      }

      if (bookingsRes.success && bookingsRes.data) {
        totalBookings = bookingsRes.data.length;
        // Calculate revenue from completed/pending bookings
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
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statsCards = [
    { 
      title: 'Total Users', 
      value: stats.totalUsers.toLocaleString(), 
      icon: Users, 
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    { 
      title: 'Total Barbers', 
      value: stats.totalBarbers.toLocaleString(), 
      icon: Scissors, 
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    { 
      title: 'Total Bookings', 
      value: stats.totalBookings.toLocaleString(), 
      icon: Calendar, 
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    { 
      title: 'Revenue', 
      value: `₹${stats.totalRevenue.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading dashboard stats...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            Admin <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted-foreground">Platform overview and statistics</p>
        </div>
        <Button variant="outline" onClick={fetchStats} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {statsCards.map((stat, index) => (
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
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Real-time data
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
