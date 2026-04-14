import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, TrendingUp, Calendar, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getBarberBookings, BookingData } from '@/lib/api';
import { format, subDays, isAfter, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function BarberEarnings() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const res = await getBarberBookings();
    if (res.success && res.data) {
      setBookings(res.data);
    } else {
      toast.error(res.error || 'Failed to load earnings data');
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const completedBookings = useMemo(
    () => bookings.filter(b => b.status === 'completed'),
    [bookings]
  );

  const totalEarnings = useMemo(
    () => completedBookings.reduce((sum, b) => sum + (b.service?.price || 0), 0),
    [completedBookings]
  );

  const last7Days = useMemo(() => {
    const now = new Date();
    return completedBookings.filter(b => {
      try { return isAfter(parseISO(b.date), subDays(now, 7)); } catch { return false; }
    });
  }, [completedBookings]);

  const weeklyEarnings = useMemo(
    () => last7Days.reduce((sum, b) => sum + (b.service?.price || 0), 0),
    [last7Days]
  );

  const chartData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), 'MMM dd');
      days[d] = 0;
    }
    last7Days.forEach(b => {
      try {
        const d = format(parseISO(b.date), 'MMM dd');
        if (days[d] !== undefined) days[d] += b.service?.price || 0;
      } catch {}
    });
    return Object.entries(days).map(([date, amount]) => ({ date, amount }));
  }, [last7Days]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading earnings...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">
            My <span className="gradient-text">Earnings</span>
          </h1>
          <p className="text-muted-foreground">Track your revenue from completed bookings</p>
        </div>
        <Button variant="outline" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">₹{totalEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">₹{weeklyEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Jobs</p>
                <p className="text-2xl font-bold">{completedBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Last 7 Days Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.some(d => d.amount > 0) ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`₹${value}`, 'Revenue']}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No completed bookings in the last 7 days</p>
              <p className="text-sm mt-1">Revenue will appear here once bookings are completed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent completed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Completed Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {completedBookings.length > 0 ? (
            <div className="space-y-3">
              {completedBookings.slice(0, 10).map(b => (
                <div key={b.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <p className="font-medium">{b.service?.name || 'Service'}</p>
                    <p className="text-sm text-muted-foreground">
                      {b.date} • {b.time_slot}
                    </p>
                  </div>
                  <span className="font-bold text-green-500">₹{b.service?.price || 0}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No completed bookings yet</p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
