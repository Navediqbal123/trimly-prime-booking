import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-7); // Last 7 entries

    return data;
  }, [bookings]);

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Earnings Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                formatter={(value: number) => [`₹${value}`, 'Earnings']}
              />
              <Bar 
                dataKey="earnings" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No earnings data to display yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}