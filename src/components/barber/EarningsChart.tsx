import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { BookingData } from '@/lib/api';

interface EarningsChartProps {
  bookings: BookingData[];
}

export function EarningsChart({ bookings }: EarningsChartProps) {
  const chartData = useMemo(() => {
    // Group bookings by date and calculate earnings
    const earningsByDate: Record<string, number> = {};
    
    bookings
      .filter(b => b.status === 'completed' || b.status === 'confirmed' || b.status === 'pending')
      .forEach(booking => {
        const date = booking.date;
        const price = booking.service?.price || 0;
        earningsByDate[date] = (earningsByDate[date] || 0) + price;
      });

    // Convert to array and sort by date
    const data = Object.entries(earningsByDate)
      .map(([date, earnings]) => ({
        date: new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        earnings,
        fullDate: date,
      }))
      .sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
      .slice(-7); // Last 7 entries

    return data;
  }, [bookings]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-lg p-3 shadow-xl"
        >
          <p className="text-sm text-muted-foreground mb-1">{label}</p>
          <p className="text-lg font-bold text-primary">
            ₹{payload[0].value.toLocaleString('en-IN')}
          </p>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <Card className="border-border overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <motion.div
              initial={{ rotate: -20, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <TrendingUp className="w-5 h-5 text-primary" />
            </motion.div>
            <span>Earnings Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="hsl(var(--border))" 
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="date" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickFormatter={(value) => `₹${value}`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone"
                    dataKey="earnings" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#colorEarnings)"
                    animationDuration={1500}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-[300px] text-muted-foreground"
            >
              <TrendingUp className="w-12 h-12 mb-4 opacity-30" />
              <p>No earnings data to display yet</p>
              <p className="text-sm mt-1">Start accepting bookings to see your earnings</p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
