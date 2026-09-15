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
import {
  bookingAmount,
  buildServiceMap,
} from '@/lib/bookingAmount';

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
          new Date(b.fullDate).getTime(),
      )
      .slice(-7);
  }, [bookings, services]);

  const totalEarnings = useMemo(
    () =>
      chartData.reduce(
        (sum, item) => sum + item.earnings,
        0,
      ),
    [chartData],
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <motion.div
        initial={{
          opacity: 0,
          scale: 0.95,
          y: 5,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        className="
          rounded-2xl
          border-0
          bg-white
          px-4
          py-3
          shadow-[6px_7px_14px_rgba(0,0,0,0.10),-5px_-5px_12px_rgba(255,255,255,0.95)]
        "
      >
        <p className="mb-1 text-xs font-medium text-slate-500">
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
          r={15}
          fill="rgba(255,116,23,0.08)"
        />

        <circle
          cx={cx}
          cy={cy}
          r={10}
          fill="rgba(255,116,23,0.14)"
        />

        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#ff7417"
          stroke="#ffffff"
          strokeWidth={4}
        />
      </g>
    );
  };

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        delay: 0.2,
        duration: 0.4,
      }}
    >
      <Card
        className="
          relative
          overflow-hidden
          rounded-[34px]
          border-0
          bg-white
          shadow-[8px_10px_20px_rgba(0,0,0,0.10),-7px_-7px_17px_rgba(255,255,255,0.95)]
        "
      >
        <CardContent className="relative p-4 sm:p-7">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-4">
              {/* Clay chart icon */}
              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-[#fff0df]
                  text-orange-500
                  shadow-[inset_3px_3px_7px_rgba(255,255,255,0.95),inset_-4px_-4px_8px_rgba(0,0,0,0.06),5px_6px_12px_rgba(0,0,0,0.08)]
                  sm:h-16
                  sm:w-16
                "
              >
                <TrendingUp className="h-7 w-7 stroke-[2.2]" />
              </div>

              <div className="min-w-0">
                <h2
                  className="
                    truncate
                    text-xl
                    font-bold
                    tracking-tight
                    text-slate-950
                    sm:text-2xl
                  "
                >
                  Earnings Overview
                </h2>

                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Your recent completed earnings
                </p>
              </div>
            </div>

            {/* 3D period button */}
            <div
              className="
                shrink-0
                rounded-[24px]
                border-0
                bg-white
                px-3
                py-2.5
                text-xs
                font-semibold
                text-slate-800
                shadow-[5px_6px_12px_rgba(0,0,0,0.09),-4px_-4px_10px_rgba(255,255,255,0.95)]
                sm:px-5
                sm:py-3.5
                sm:text-sm
              "
            >
              This Week⌄
            </div>
          </div>

          {chartData.length > 0 ? (
            <>
              {/* Chart */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: 0.3,
                  duration: 0.5,
                }}
                className="h-[280px] w-full sm:h-[340px]"
              >
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
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
                      stroke="#e5e7eb"
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
                        fill: 'rgba(255,116,23,0.035)',
                      }}
                      content={<CustomTooltip />}
                    />

                    {/* Clay-style earnings bars */}
                    <Bar
                      dataKey="earnings"
                      barSize={20}
                      radius={[10, 10, 4, 4]}
                      fill="#ffb36b"
                      fillOpacity={0.55}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />

                    {/* Earnings points */}
                    <Scatter
                      dataKey="earnings"
                      fill="#ff7417"
                      shape={<CustomDot />}
                      animationDuration={1200}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </motion.div>

              {/* Total Earnings */}
              <motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  delay: 0.55,
                  duration: 0.4,
                }}
                className="
                  mt-3
                  rounded-[28px]
                  border-0
                  bg-white
                  px-5
                  py-4
                  shadow-[6px_7px_15px_rgba(0,0,0,0.08),-5px_-5px_12px_rgba(255,255,255,0.95)]
                  sm:px-7
                  sm:py-5
                "
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Total Earnings
                    </p>

                    <p
                      className="
                        mt-1
                        text-3xl
                        font-bold
                        tracking-tight
                        text-slate-950
                        sm:text-4xl
                      "
                    >
                      ₹{totalEarnings.toLocaleString('en-IN')}
                    </p>
                  </div>

                  {/* Clay orange icon */}
                  <div
                    className="
                      flex
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#fff0df]
                      text-orange-500
                      shadow-[inset_3px_3px_7px_rgba(255,255,255,0.95),inset_-4px_-4px_8px_rgba(0,0,0,0.06),5px_6px_12px_rgba(0,0,0,0.08)]
                      sm:h-14
                      sm:w-14
                    "
                  >
                    <TrendingUp className="h-6 w-6 stroke-[2.2]" />
                  </div>
                </div>
              </motion.div>
            </>
          ) : (
            /* Empty State */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="
                flex
                h-[280px]
                flex-col
                items-center
                justify-center
                text-center
                text-slate-500
                sm:h-[300px]
              "
            >
              <div
                className="
                  mb-4
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-full
                  bg-[#fff0df]
                  text-orange-300
                  shadow-[inset_3px_3px_7px_rgba(255,255,255,0.95),inset_-4px_-4px_8px_rgba(0,0,0,0.05),5px_6px_12px_rgba(0,0,0,0.07)]
                "
              >
                <TrendingUp className="h-8 w-8" />
              </div>

              <p className="font-medium text-slate-700">
                No earnings data to display yet
              </p>

              <p className="mt-1 px-5 text-sm text-slate-500">
                Start accepting completed bookings to see
                your earnings.
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}