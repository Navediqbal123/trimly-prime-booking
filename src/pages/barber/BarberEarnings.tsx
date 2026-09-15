import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  Loader2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

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
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const clayCard =
  'shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]';

const orangeClay =
  'bg-[#ff7417] text-white shadow-[6px_7px_14px_rgba(255,116,23,0.28),inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(190,70,0,0.25)]';

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
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-white">
        <Loader2 className="h-9 w-9 animate-spin text-orange-500" />

        <p className="mt-4 text-sm font-medium text-slate-500">
          Loading earnings...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-full overflow-hidden bg-white px-4 py-5 pb-10 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-5">
          <h1 className="whitespace-nowrap text-[32px] font-black leading-none tracking-[-0.045em] text-slate-950 sm:text-5xl lg:text-6xl">
            My{' '}
            <span className="text-[#ff7417] drop-shadow-[2px_3px_1px_rgba(255,116,23,0.22)]">
              Earnings
            </span>
          </h1>

          <p className="mt-2 whitespace-nowrap text-sm font-semibold text-slate-500 sm:text-lg">
            Track your revenue from completed bookings
          </p>

          {/* Full Width Refresh */}
          <motion.div
            whileHover={{
              y: -1,
              scale: 1.01,
            }}
            whileTap={{
              y: 2,
              scale: 0.985,
            }}
            onClick={() => {
              if (!loading) {
                void fetchData();
              }
            }}
            className={`mt-5 flex h-14 w-full cursor-pointer items-center justify-center gap-3 rounded-[22px] text-base font-extrabold transition-all duration-200 sm:h-16 sm:text-xl ${orangeClay}`}
          >
            <RefreshCw
              className={`h-6 w-6 sm:h-7 sm:w-7 ${
                loading ? 'animate-spin' : ''
              }`}
            />

            {loading ? 'Refreshing...' : 'Refresh'}
          </motion.div>
        </div>

        {/* Earnings Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

          {/* Total Earnings */}
          <motion.div
            whileHover={{ y: -2 }}
            className={`rounded-[28px] border border-slate-100 bg-white p-5 ${clayCard}`}
          >
            <div className="flex items-center gap-4">

              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-emerald-100 bg-[#e7fbf2]"
                style={{
                  boxShadow:
                    '5px 6px 12px rgba(0,0,0,0.08),-4px -4px 10px rgba(255,255,255,0.95),inset 2px 2px 4px rgba(255,255,255,0.70)',
                }}
              >
                <IndianRupee className="h-7 w-7 text-emerald-500" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500 sm:text-base">
                  Total Earnings
                </p>

                <p className="mt-0.5 whitespace-nowrap text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  ₹{totalEarnings.toLocaleString()}
                </p>
              </div>

            </div>
          </motion.div>

          {/* This Week */}
          <motion.div
            whileHover={{ y: -2 }}
            className={`rounded-[28px] border border-slate-100 bg-white p-5 ${clayCard}`}
          >
            <div className="flex items-center gap-4">

              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-purple-100 bg-[#f2eaff]"
                style={{
                  boxShadow:
                    '5px 6px 12px rgba(0,0,0,0.08),-4px -4px 10px rgba(255,255,255,0.95),inset 2px 2px 4px rgba(255,255,255,0.70)',
                }}
              >
                <TrendingUp className="h-7 w-7 text-purple-500" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500 sm:text-base">
                  This Week
                </p>

                <p className="mt-0.5 whitespace-nowrap text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  ₹{weeklyEarnings.toLocaleString()}
                </p>
              </div>

            </div>
          </motion.div>

          {/* Completed Jobs */}
          <motion.div
            whileHover={{ y: -2 }}
            className={`rounded-[28px] border border-slate-100 bg-white p-5 ${clayCard}`}
          >
            <div className="flex items-center gap-4">

              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] border border-blue-100 bg-[#eaf4ff]"
                style={{
                  boxShadow:
                    '5px 6px 12px rgba(0,0,0,0.08),-4px -4px 10px rgba(255,255,255,0.95),inset 2px 2px 4px rgba(255,255,255,0.70)',
                }}
              >
                <Calendar className="h-7 w-7 text-blue-500" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-500 sm:text-base">
                  Completed Jobs
                </p>

                <p className="mt-0.5 whitespace-nowrap text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {completedBookings.length}
                </p>
              </div>

            </div>
          </motion.div>

        </div>

        {/* Earnings Overview */}
        <div
          className={`mt-5 overflow-hidden rounded-[30px] border border-slate-100 bg-white p-4 sm:p-6 ${clayCard}`}
        >

          {/* Chart Header */}
          <div className="mb-4 flex items-start justify-between gap-3">

            <div className="min-w-0">
              <h2 className="font-display text-[25px] font-bold tracking-tight text-slate-950 sm:text-3xl">
                Earnings Overview
              </h2>

              <p className="mt-1 text-sm font-medium text-slate-500 sm:text-base">
                Your recent completed earnings
              </p>
            </div>

            {/* This Week */}
            <motion.div
              whileHover={{
                y: -1,
                scale: 1.02,
              }}
              whileTap={{
                y: 2,
                scale: 0.97,
              }}
              className="flex shrink-0 items-center gap-2 rounded-[20px] bg-[#fff0df] px-4 py-3 text-xs font-extrabold text-slate-950 shadow-[5px_6px_13px_rgba(255,116,23,0.18),inset_2px_2px_4px_rgba(255,255,255,0.85),inset_-3px_-3px_5px_rgba(255,116,23,0.10)] sm:px-5 sm:text-sm"
            >
              This Week
              <ChevronDown className="h-4 w-4" />
            </motion.div>

          </div>

          {/* Chart */}
          {chartData.some(
            (d) => d.amount > 0
          ) ? (
            <div className="h-[270px] w-full sm:h-[330px]">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={chartData}
                  margin={{
                    top: 12,
                    right: 4,
                    left: -12,
                    bottom: 4,
                  }}
                  barCategoryGap="28%"
                >

                  <CartesianGrid
                    strokeDasharray="4 5"
                    stroke="rgba(148,163,184,0.20)"
                    vertical={true}
                  />

                  <XAxis
                    dataKey="date"
                    tick={{
                      fill: '#64748b',
                      fontSize: 11,
                    }}
                    axisLine={{
                      stroke: '#cbd5e1',
                    }}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fill: '#64748b',
                      fontSize: 11,
                    }}
                    axisLine={{
                      stroke: '#cbd5e1',
                    }}
                    tickLine={false}
                    width={42}
                    tickFormatter={(value) =>
                      `₹${value}`
                    }
                  />

                  <Tooltip
                    cursor={{
                      fill: 'rgba(255,116,23,0.05)',
                    }}
                    contentStyle={{
                      background: '#ffffff',
                      border:
                        '1px solid rgba(255,116,23,0.18)',
                      borderRadius: '18px',
                      boxShadow:
                        '6px 8px 18px rgba(0,0,0,0.10)',
                      padding: '10px 14px',
                    }}
                    labelStyle={{
                      color: '#0f172a',
                      fontWeight: 700,
                      marginBottom: 4,
                    }}
                    formatter={(value: number) => [
                      `₹${value.toLocaleString()}`,
                      'Earnings',
                    ]}
                  />

                  <Bar
                    dataKey="amount"
                    fill="#ffad63"
                    radius={[
                      14,
                      14,
                      5,
                      5,
                    ]}
                    barSize={30}
                  />

                </BarChart>
              </ResponsiveContainer>

            </div>
          ) : (
            <div className="flex h-[270px] flex-col items-center justify-center text-center sm:h-[330px]">

              <div
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#fff0e5]"
                style={{
                  boxShadow:
                    '5px 6px 12px rgba(0,0,0,0.08),-4px -4px 10px rgba(255,255,255,0.95)',
                }}
              >
                <IndianRupee className="h-7 w-7 text-orange-400" />
              </div>

              <p className="font-bold text-slate-700">
                No completed bookings in the last 7 days
              </p>

              <p className="mt-1 text-sm text-slate-400">
                Revenue will appear here once bookings are completed
              </p>

            </div>
          )}

          {/* Total Earnings Footer */}
          <div
            className="mt-3 flex items-center justify-between rounded-[26px] border border-slate-100 bg-white px-5 py-4 sm:px-6 sm:py-5"
            style={{
              boxShadow:
                '5px 6px 13px rgba(0,0,0,0.08),-4px -4px 10px rgba(255,255,255,0.95)',
            }}
          >

            <div>
              <p className="text-sm font-bold text-slate-700 sm:text-base">
                Total Earnings
              </p>

              <p className="mt-1 whitespace-nowrap text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                ₹{totalEarnings.toLocaleString()}
              </p>
            </div>

            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff0df] text-slate-950 sm:h-14 sm:w-14"
              style={{
                boxShadow:
                  '5px 6px 12px rgba(255,116,23,0.15),-3px -3px 8px rgba(255,255,255,0.95)',
              }}
            >
              <TrendingUp className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>

          </div>

        </div>

        {/* Recent Completed Bookings */}
        <div
          className={`mt-5 overflow-hidden rounded-[30px] border border-slate-100 bg-white ${clayCard}`}
        >

          <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
            <h2 className="font-display text-xl font-bold text-slate-950 sm:text-2xl">
              Recent Completed Bookings
            </h2>
          </div>

          {completedBookings.length > 0 ? (
            <div className="px-5 sm:px-6">

              {completedBookings
                .slice(0, 10)
                .map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 py-4 last:border-0"
                  >

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-950 sm:text-base">
                        {bookingServiceNames(
                          b,
                          serviceMap
                        ).join(', ') || 'Service'}
                      </p>

                      <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
                        {b.date} • {b.time_slot}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">

                      <span className="text-sm font-black text-slate-950 sm:text-base">
                        ₹{amountOf(b)}
                      </span>

                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff0e5]"
                        style={{
                          boxShadow:
                            '3px 4px 8px rgba(0,0,0,0.07),-2px -2px 6px rgba(255,255,255,0.95)',
                        }}
                      >
                        <ChevronRight className="h-4 w-4 text-orange-500" />
                      </div>

                    </div>

                  </div>
                ))}

            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              No completed bookings yet
            </p>
          )}

        </div>

      </div>
    </motion.div>
  );
}