import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  Loader2,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import {
  getBarberBookings,
  getMyServices,
  BookingData,
  ServiceData,
} from '@/lib/api';

import {
  bookingAmount,
  bookingServiceNames,
  buildServiceMap,
} from '@/lib/bookingAmount';

import {
  format,
  subDays,
  isAfter,
  parseISO,
} from 'date-fns';

import {
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
} from 'recharts';

export default function BarberEarnings() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    const [bRes, sRes] = await Promise.all([
      getBarberBookings(),
      getMyServices(),
    ]);

    if (bRes.success && bRes.data) {
      setBookings(bRes.data);
    } else {
      toast.error(
        bRes.error || 'Failed to load earnings data'
      );
    }

    if (sRes.success && sRes.data) {
      setServices(sRes.data);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const serviceMap = useMemo(
    () => buildServiceMap(services),
    [services]
  );

  const amountOf = (b: BookingData) =>
    bookingAmount(b, serviceMap);

  const completedBookings = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === 'completed'
      ),
    [bookings]
  );

  const totalEarnings = useMemo(
    () =>
      completedBookings.reduce(
        (sum, b) => sum + amountOf(b),
        0
      ),
    [completedBookings, serviceMap]
  );

  const last7Days = useMemo(() => {
    const now = new Date();

    return completedBookings.filter((b) => {
      try {
        return isAfter(
          parseISO(b.date),
          subDays(now, 7)
        );
      } catch {
        return false;
      }
    });
  }, [completedBookings]);

  const weeklyEarnings = useMemo(
    () =>
      last7Days.reduce(
        (sum, b) => sum + amountOf(b),
        0
      ),
    [last7Days, serviceMap]
  );

  const chartData = useMemo(() => {
    const days: Record<string, number> = {};

    for (let i = 6; i >= 0; i--) {
      const d = format(
        subDays(new Date(), i),
        'MMM dd'
      );

      days[d] = 0;
    }

    last7Days.forEach((b) => {
      try {
        const d = format(
          parseISO(b.date),
          'MMM dd'
        );

        if (days[d] !== undefined) {
          days[d] += amountOf(b);
        }
      } catch {}
    });

    return Object.entries(days).map(
      ([date, amount]) => ({
        date,
        amount,
      })
    );
  }, [last7Days, serviceMap]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary/10 shadow-none">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>

          <p className="mt-4 font-semibold text-muted-foreground">
            Loading earnings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full min-w-0 bg-background pb-10 text-foreground"
    >
      <div className="w-full min-w-0 space-y-5">
        {/* ================= HEADER ================= */}
        <div className="w-full min-w-0">
          <h1 className="flex min-w-0 items-center gap-2 text-[36px] font-black leading-tight tracking-[-1.5px] text-foreground sm:text-4xl lg:text-5xl">
            <span className="shrink-0">
              My
            </span>

            <span className="shrink-0 text-primary">
              Earnings
            </span>
          </h1>

          <p className="mt-2 w-full whitespace-nowrap text-[13px] font-semibold text-muted-foreground sm:text-base">
            Track your revenue from completed bookings
          </p>
        </div>

        {/* ================= REFRESH ================= */}
        <Button
          type="button"
          onClick={fetchData}
          disabled={loading}
          className="flex h-11 w-full rounded-[18px] bg-primary font-bold text-primary-foreground shadow-none hover:bg-primary/90"
        >
          <RefreshCw
            className={`mr-2 h-5 w-5 ${
              loading ? 'animate-spin' : ''
            }`}
          />

          Refresh
        </Button>

        {/* ================= STATS ================= */}
        <div className="grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-3">
          {/* TOTAL EARNINGS */}
          <Card className="w-full min-w-0 overflow-hidden rounded-[28px] border border-border bg-card text-card-foreground shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shadow-none">
                  <IndianRupee className="h-7 w-7" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-muted-foreground">
                    Total Earnings
                  </p>

                  <p className="truncate text-2xl font-black text-foreground sm:text-3xl">
                    ₹{totalEarnings.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* THIS WEEK */}
          <Card className="w-full min-w-0 overflow-hidden rounded-[28px] border border-border bg-card text-card-foreground shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-violet-500/15 text-violet-700 dark:text-violet-300 shadow-none">
                  <TrendingUp className="h-7 w-7" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-muted-foreground">
                    This Week
                  </p>

                  <p className="truncate text-2xl font-black text-foreground sm:text-3xl">
                    ₹{weeklyEarnings.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* COMPLETED JOBS */}
          <Card className="w-full min-w-0 overflow-hidden rounded-[28px] border border-border bg-card text-card-foreground shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-blue-500/15 text-blue-700 dark:text-blue-300 shadow-none">
                  <Calendar className="h-7 w-7" />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-muted-foreground">
                    Completed Jobs
                  </p>

                  <p className="text-3xl font-black text-foreground">
                    {completedBookings.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================= EARNINGS OVERVIEW ================= */}
        <Card className="w-full min-w-0 overflow-hidden rounded-[28px] border border-border bg-card text-card-foreground shadow-none">
          <CardHeader className="flex w-full min-w-0 flex-row items-center justify-between gap-3 p-5 pb-2 sm:p-6">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[17px] bg-[#ff7417]/15 text-[#ff7417] shadow-none">
                  <TrendingUp className="h-5 w-5" />
                </div>

                <div className="min-w-0">
                  <CardTitle className="truncate text-xl font-black text-foreground sm:text-2xl">
                    Earnings Overview
                  </CardTitle>

                </div>
              </div>
            </div>

            <div className="shrink-0 rounded-[18px] bg-primary/10 px-3 py-2.5 text-xs font-bold text-primary shadow-none sm:px-4 sm:text-sm">
              This Week⌄
            </div>
          </CardHeader>

          <CardContent className="w-full min-w-0 p-4 pt-3 sm:p-6 sm:pt-4">
            {chartData.some(
              (d) => d.amount > 0
            ) ? (
              <div className="w-full min-w-0">
                <ResponsiveContainer
                  width="100%"
                  height={300}
                >
                  <ComposedChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 8,
                      left: -10,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 5"
                      stroke="rgba(148,163,184,0.20)"
                      vertical
                    />

                    <XAxis
                      dataKey="date"
                      tick={{
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                      dy={8}
                    />

                    <YAxis
                      tick={{
                        fill: 'hsl(var(--muted-foreground))',
                        fontSize: 11,
                      }}
                      axisLine={false}
                      tickLine={false}
                      width={46}
                      tickFormatter={(value) =>
                        `₹${Number(value).toLocaleString('en-IN')}`
                      }
                    />

                    <Tooltip
                      cursor={{
                        fill: 'rgba(255,116,23,0.04)',
                      }}
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '18px',
                        boxShadow: 'none',
                        padding: '10px 14px',
                      }}
                      labelStyle={{
                        color: 'hsl(var(--foreground))',
                        fontWeight: 700,
                        marginBottom: 4,
                      }}
                      formatter={(value: number) => [
                        `₹${Number(value).toLocaleString('en-IN')}`,
                        'Earnings',
                      ]}
                    />

                    <Bar
                      dataKey="amount"
                      fill="#ffb36b"
                      fillOpacity={0.58}
                      radius={[10, 10, 4, 4]}
                      barSize={22}
                      animationDuration={1000}
                    />

                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#ff7417"
                      strokeWidth={3}
                      dot={{
                        r: 5,
                        fill: '#ff7417',
                        stroke: 'hsl(var(--card))',
                        strokeWidth: 2,
                      }}
                      activeDot={{
                        r: 7,
                        fill: '#ff7417',
                        stroke: 'hsl(var(--card))',
                        strokeWidth: 3,
                      }}
                      connectNulls
                      animationDuration={1000}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex min-h-[260px] w-full flex-col items-center justify-center rounded-[22px] bg-secondary">
                <div className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#ff7417]/15 text-[#ff7417] shadow-none">
                  <IndianRupee className="h-7 w-7" />
                </div>

                <p className="mt-4 text-center font-bold text-muted-foreground">
                  No completed bookings in the last 7 days
                </p>

                <p className="mt-1 text-center text-xs text-muted-foreground/70">
                  Revenue will appear here once bookings are completed
                </p>
              </div>
            )}

            {/* TOTAL EARNINGS FOOTER */}
            <div className="mt-3 flex w-full items-center justify-between gap-3 rounded-[22px] bg-secondary p-4 shadow-none">
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground">
                  Total Earnings
                </p>

                <p className="text-2xl font-black text-foreground sm:text-3xl">
                  ₹{totalEarnings.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[16px] bg-[#ff7417]/15 text-[#ff7417] shadow-none">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ================= RECENT COMPLETED ================= */}
        <Card className="w-full min-w-0 overflow-hidden rounded-[28px] border border-border bg-card text-card-foreground shadow-none">
          <CardHeader className="p-5 pb-3 sm:p-6">
            <CardTitle className="text-xl font-black text-foreground sm:text-2xl">
              Recent Completed Bookings
            </CardTitle>
          </CardHeader>

          <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
            {completedBookings.length > 0 ? (
              <div className="w-full min-w-0">
                {completedBookings
                  .slice(0, 10)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="flex w-full min-w-0 items-center justify-between gap-3 border-b border-border py-4 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-foreground sm:text-base">
                          {bookingServiceNames(
                            b,
                            serviceMap
                          ).join(', ') ||
                            'Service'}
                        </p>

                        <p className="mt-1 truncate text-xs font-medium text-muted-foreground sm:text-sm">
                          {b.date} • {b.time_slot}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-black text-foreground sm:text-base">
                          ₹{amountOf(b)}
                        </span>

                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff7417]/15 text-[#ff7417] shadow-none">
                          <ChevronRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="font-semibold text-muted-foreground/70">
                  No completed bookings yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}