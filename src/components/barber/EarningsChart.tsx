import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart,
  Bar,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { BookingData, ServiceData } from '@/lib/api';
import { bookingAmount, buildServiceMap } from '@/lib/bookingAmount';

interface EarningsChartProps {
  bookings: BookingData[];
  services?: ServiceData[];
}

export function EarningsChart({
  bookings,
  services = [],
}: EarningsChartProps) {
  const chartData = useMemo(() => {
    const serviceMap = buildServiceMap(services);

    const earningsByDate: Record<string, number> = {};

    bookings
      .filter((b) => b.status === 'completed')
      .forEach((booking) => {
        const date = booking.date;
        if (!date) return;

        earningsByDate[date] =
          (earningsByDate[date] || 0) +
          bookingAmount(booking, serviceMap);
      });

    return Object.entries(earningsByDate)
      .map(([date, earnings]) => ({
        date: new Date(date).toLocaleDateString('en-IN', {
          month: 'short',
          day: 'numeric',
        }),
        earnings,
        fullDate: date,
      }))
      .sort(
        (a, b) =>
          new Date(a.fullDate).getTime() -
          new Date(b.fullDate).getTime()
      )
      .slice(-7);
  }, [bookings, services]);

  const totalEarnings = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.earnings, 0);
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="rounded-xl border border-orange-100 bg-white/95 px-4 py-3 shadow-xl backdrop-blur-xl"
      >
        <p className="mb-1 text-xs font-medium text-muted-foreground">
          {label}
        </p>

        <p className="text-lg font-bold text-orange-500">
          ₹{Number(payload[0].value).toLocaleString('en-IN')}
        </p>
      </motion.div>
    );
  };

  const CustomDot = (props: any) => {
    const { cx, cy } = props;

    if (cx === undefined || cy === undefined) {
      return null;
    }

    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={14}
          fill="rgba(255, 145, 45, 0.10)"
        />

        <circle
          cx={cx}
          cy={cy}
          r={9}
          fill="rgba(255, 145, 45, 0.18)"
        />

        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#ff8a2b"
          stroke="#ffffff"
          strokeWidth={3}
        />
      </g>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <Card className="relative overflow-hidden rounded-3xl border border-orange-100/80 bg-white/85 shadow-sm backdrop-blur-xl">
        {/* Soft ambient orange glow */}
        <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-orange-200/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-orange-100/30 blur-3xl" />

        <CardContent className="relative z-10 p-4 sm:p-6">
          {/* Header */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 shadow-sm">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>

              <div>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  Earnings Overview
                </h2>

                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  Your recent completed earnings
                </p>
              </div>
            </div>

            {/* Period display */}
            <div className="shrink-0 rounded-xl border border-orange-100 bg-white/70 px-3 py-2 text-sm font-medium text-foreground shadow-sm">
              This Week
            </div>
          </div>

          {chartData.length > 0 ? (
            <>
              {/* Chart */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="h-[300px] w-full sm:h-[340px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={chartData}
                    margin={{
                      top: 24,
                      right: 8,
                      left: 0,
                      bottom: 8,
                    }}
                  >
                    <CartesianGrid
                      stroke="rgba(226, 232, 240, 0.65)"
                      strokeDasharray="3 4"
                      vertical
                    />

                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />

                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) =>
                        `₹${Number(value).toLocaleString('en-IN')}`
                      }
                      width={48}
                    />

                    <Tooltip
                      cursor={{
                        fill: 'rgba(255, 145, 45, 0.04)',
                      }}
                      content={<CustomTooltip />}
                    />

                    {/* Translucent orange earnings columns */}
                    <Bar
                      dataKey="earnings"
                      barSize={18}
                      radius={[10, 10, 0, 0]}
                      fill="#ffb36b"
                      fillOpacity={0.28}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />

                    {/* Glowing orange earnings dots */}
                    <Scatter
                      dataKey="earnings"
                      fill="#ff8a2b"
                      shape={<CustomDot />}
                      animationDuration={1200}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Total Earnings Footer */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.4 }}
                className="mt-3 rounded-2xl border border-orange-100/80 bg-white/65 px-4 py-4 shadow-sm backdrop-blur-xl sm:px-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Earnings
                    </p>

                    <p className="mt-1 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                      ₹{totalEarnings.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="hidden h-12 w-12 items-center justify-center rounded-full bg-orange-50 sm:flex">
                    <TrendingUp className="h-5 w-5 text-orange-500" />
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-[300px] flex-col items-center justify-center text-center text-muted-foreground"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50">
                <TrendingUp className="h-8 w-8 text-orange-300" />
              </div>

              <p className="font-medium">
                No earnings data to display yet
              </p>

              <p className="mt-1 text-sm">
                Start accepting completed bookings to see your earnings.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}