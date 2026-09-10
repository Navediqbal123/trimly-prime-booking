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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ComposedChart,
  Scatter,
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
      toast.error(bRes.error || 'Failed to load earnings data');
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
      <div className="min-h-full bg-[#fffaf5] flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500 mb-4" />
        <p className="text-slate-500">
          Loading earnings...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative min-h-full bg-[#fffaf5] overflow-hidden px-1 sm:px-2 pb-10"
    >
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed -top-32 -right-28 w-80 h-80 rounded-full bg-orange-200/30 blur-3xl" />
      <div className="pointer-events-none fixed top-[35%] -left-32 w-72 h-72 rounded-full bg-purple-200/20 blur-3xl" />
      <div className="pointer-events-none fixed bottom-0 right-0 w-72 h-72 rounded-full bg-orange-100/30 blur-3xl" />

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-slate-900 mb-2">
              My <span className="text-orange-500">Earnings</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-500 max-w-[230px] leading-relaxed">
              Track your revenue from completed bookings
            </p>
          </div>

          <Button
            variant="outline"
            onClick={fetchData}
            disabled={loading}
            className="shrink-0 h-11 rounded-2xl border-orange-100 bg-white/75 backdrop-blur-xl text-slate-800 shadow-[0_8px_25px_rgba(249,115,22,0.08)] hover:bg-white hover:border-orange-200"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Earnings */}
          <Card className="relative overflow-hidden rounded-[22px] border border-orange-200/70 bg-white/70 backdrop-blur-xl shadow-[0_12px_35px_rgba(249,115,22,0.10)]">
            <div className="pointer-events-none absolute -right-10 -top-10 w-28 h-28 rounded-full bg-orange-200/25 blur-2xl" />

            <CardContent className="relative p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <IndianRupee className="w-5 h-5 text-emerald-500" />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Total Earnings
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    ₹{totalEarnings.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* This Week */}
          <Card className="relative overflow-hidden rounded-[22px] border border-purple-200/60 bg-white/70 backdrop-blur-xl shadow-[0_12px_35px_rgba(139,92,246,0.10)]">
            <div className="pointer-events-none absolute -right-10 -top-10 w-28 h-28 rounded-full bg-purple-200/25 blur-2xl" />

            <CardContent className="relative p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-purple-500" />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    This Week
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    ₹{weeklyEarnings.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Jobs */}
          <Card className="relative overflow-hidden rounded-[22px] border border-orange-200/60 bg-white/70 backdrop-blur-xl shadow-[0_12px_35px_rgba(249,115,22,0.08)]">
            <div className="pointer-events-none absolute -right-10 -top-10 w-28 h-28 rounded-full bg-orange-100/30 blur-2xl" />

            <CardContent className="relative p-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>

                <div>
                  <p className="text-sm text-slate-500">
                    Completed Jobs
                  </p>
                  <p className="text-2xl font-bold text-slate-900">
                    {completedBookings.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Chart */}
        <Card className="relative overflow-hidden rounded-[26px] border border-orange-200/70 bg-white/75 backdrop-blur-xl shadow-[0_15px_45px_rgba(249,115,22,0.10)]">
          <div className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-orange-200/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 -left-24 w-64 h-64 rounded-full bg-purple-100/15 blur-3xl" />

          <CardHeader className="relative flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
              Last 7 Days Revenue
            </CardTitle>

            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl border border-orange-100 bg-white/80 text-sm font-medium text-slate-700">
              This Week
            </div>
          </CardHeader>

          <CardContent className="relative pt-3">
            {chartData.some(
              (d) => d.amount > 0
            ) ? (
              <ResponsiveContainer
                width="100%"
                height={310}
              >
                <ComposedChart
                  data={chartData}
                  margin={{
                    top: 20,
                    right: 12,
                    left: -8,
                    bottom: 4,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="4 5"
                    stroke="rgba(148,163,184,0.22)"
                    vertical
                  />

                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: '#64748b',
                      fontSize: 12,
                    }}
                    axisLine={{
                      stroke: '#cbd5e1',
                    }}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: '#64748b',
                      fontSize: 12,
                    }}
                    axisLine={{
                      stroke: '#cbd5e1',
                    }}
                    tickLine={false}
                    width={42}
                  />

                  <Tooltip
                    cursor={{
                      fill: 'rgba(249,115,22,0.05)',
                    }}
                    contentStyle={{
                      background: 'rgba(255,255,255,0.94)',
                      border: '1px solid rgba(249,115,22,0.25)',
                      borderRadius: '16px',
                      boxShadow:
                        '0 15px 35px rgba(249,115,22,0.14)',
                      padding: '12px 16px',
                    }}
                    labelStyle={{
                      color: '#0f172a',
                      fontWeight: 600,
                      marginBottom: 4,
                    }}
                    formatter={(value: number) => [
                      `₹${value.toLocaleString()}`,
                      'Revenue',
                    ]}
                  />

                  <Bar
                    dataKey="amount"
                    fill="#fb923c"
                    fillOpacity={0.78}
                    radius={[9, 9, 3, 3]}
                    barSize={30}
                  />

                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#f97316"
                    strokeWidth={3}
                    dot={{
                      r: 5,
                      fill: '#f97316',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 7,
                      fill: '#f97316',
                      stroke: '#ffffff',
                      strokeWidth: 3,
                    }}
                    connectNulls
                  />

                  <Scatter
                    dataKey="amount"
                    fill="#f97316"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-14 text-slate-400">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-orange-50 flex items-center justify-center">
                  <IndianRupee className="w-7 h-7 text-orange-400" />
                </div>

                <p className="font-medium text-slate-600">
                  No completed bookings in the last 7 days
                </p>

                <p className="text-sm mt-1">
                  Revenue will appear here once bookings are completed
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Completed Bookings */}
        <Card className="relative overflow-hidden rounded-[26px] border border-orange-200/70 bg-white/75 backdrop-blur-xl shadow-[0_15px_45px_rgba(249,115,22,0.09)]">
          <div className="pointer-events-none absolute -right-24 -top-24 w-64 h-64 rounded-full bg-orange-200/15 blur-3xl" />

          <CardHeader className="relative pb-3">
            <CardTitle className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
              Recent Completed Bookings
            </CardTitle>
          </CardHeader>

          <CardContent className="relative">
            {completedBookings.length > 0 ? (
              <div className="space-y-0">
                {completedBookings
                  .slice(0, 10)
                  .map((b) => (
                    <div
                      key={b.id}
                      className="group flex items-center justify-between gap-4 py-4 border-b border-slate-200/70 last:border-0"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">
                          {bookingServiceNames(
                            b,
                            serviceMap
                          ).join(', ') || 'Service'}
                        </p>

                        <p className="text-sm text-slate-500 mt-1">
                          {b.date} • {b.time_slot}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold text-slate-900">
                          ₹{amountOf(b)}
                        </span>

                        <div className="w-7 h-7 rounded-full bg-orange-50 flex items-center justify-center">
                          <ChevronRight className="w-4 h-4 text-orange-400" />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-center py-8 text-slate-400">
                No completed bookings yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}