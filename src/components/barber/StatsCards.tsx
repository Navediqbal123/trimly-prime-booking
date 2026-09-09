import { motion } from 'framer-motion';
import {
  Calendar,
  IndianRupee,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import {
  ServiceData,
  BookingData,
  BarberDashboardStats,
} from '@/lib/api';
import {
  bookingAmount,
  buildServiceMap,
} from '@/lib/bookingAmount';
import { useCountUp } from '@/hooks/useCountUp';

interface StatsCardsProps {
  services: ServiceData[];
  bookings: BookingData[];
  /** Server-provided stats from GET /api/barber/dashboard */
  stats?: BarberDashboardStats | null;
  isLoading?: boolean;
}

interface StatCardProps {
  title: string;
  value: number;
  prefix?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  index: number;
  formatAsCurrency?: boolean;
}

function StatCard({
  title,
  value,
  prefix = '',
  icon: Icon,
  iconColor,
  iconBg,
  index,
  formatAsCurrency,
}: StatCardProps) {
  const displayValue = useCountUp(value, {
    duration: 1200,
    delay: index * 100,
    formatter: (v) =>
      formatAsCurrency
        ? v.toLocaleString('en-IN')
        : v.toString(),
  });

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 16,
        scale: 0.97,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        delay: index * 0.07,
        duration: 0.4,
        ease: 'easeOut',
      }}
      whileHover={{
        y: -2,
        scale: 1.01,
      }}
      whileTap={{
        scale: 0.98,
      }}
      className="h-full"
    >
      <Card
        className="
          group
          relative
          h-full
          min-h-[108px]
          overflow-hidden
          rounded-2xl
          border
          border-orange-100/80
          bg-white/70
          shadow-[0_8px_24px_rgba(148,163,184,0.10)]
          backdrop-blur-xl
          transition-all
          duration-300
          hover:border-orange-200
          hover:bg-white/80
          hover:shadow-[0_12px_30px_rgba(251,146,60,0.16)]
        "
      >
        {/* Main soft orange ambient glow */}
        <div
          className="
            pointer-events-none
            absolute
            -right-10
            -top-10
            h-28
            w-28
            rounded-full
            bg-orange-200/25
            blur-3xl
            opacity-80
          "
        />

        {/* Secondary warm glow */}
        <div
          className="
            pointer-events-none
            absolute
            -bottom-10
            -left-10
            h-24
            w-28
            rounded-full
            bg-orange-100/25
            blur-3xl
          "
        />

        {/* Subtle glass highlight */}
        <div
          className="
            pointer-events-none
            absolute
            inset-x-4
            top-0
            h-px
            bg-white/90
          "
        />

        <div
          className="
            relative
            z-10
            flex
            min-h-[108px]
            h-full
            flex-col
            justify-between
            p-3.5
            sm:p-4
          "
        >
          {/* Top section */}
          <div className="flex items-start justify-between gap-2">
            <p
              className="
                max-w-[78px]
                text-[12px]
                font-medium
                leading-[1.25]
                text-slate-600
                sm:max-w-[100px]
                sm:text-[13px]
              "
            >
              {title}
            </p>

            <motion.div
              whileHover={{
                scale: 1.06,
                rotate: 3,
              }}
              transition={{
                duration: 0.2,
              }}
              className={`
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                ${iconBg}
                shadow-sm
              `}
            >
              <Icon
                className={`
                  h-[18px]
                  w-[18px]
                  ${iconColor}
                `}
              />
            </motion.div>
          </div>

          {/* Bottom section */}
          <div className="mt-3 flex items-end justify-between gap-2">
            <motion.div
              initial={{
                opacity: 0,
                y: 5,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.07 + 0.15,
                duration: 0.3,
              }}
              className="
                min-w-0
                truncate
                text-[24px]
                font-bold
                leading-none
                tracking-tight
                text-slate-950
                sm:text-[27px]
              "
            >
              {prefix}
              {displayValue}
            </motion.div>

            {/* Reference-style arrow circle */}
            <motion.div
              whileHover={{
                scale: 1.08,
              }}
              whileTap={{
                scale: 0.92,
              }}
              className="
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-slate-900/[0.06]
                text-slate-500
                transition-all
                duration-200
                group-hover:bg-orange-500/10
                group-hover:text-orange-500
              "
            >
              <ChevronRight className="h-4 w-4" />
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function StatsCards({
  services,
  bookings,
  stats: apiStats,
  isLoading,
}: StatsCardsProps) {
  const serviceMap = buildServiceMap(services);

  const statusOf = (b: BookingData) =>
    String(b.status ?? '')
      .toLowerCase()
      .trim();

  const completed = bookings.filter(
    (b) => statusOf(b) === 'completed'
  );

  const totalBookings =
    apiStats?.total_bookings ?? bookings.length;

  const completedBookings =
    apiStats?.completed ?? completed.length;

  const pendingBookings =
    apiStats?.pending ??
    bookings.filter(
      (b) => statusOf(b) === 'pending'
    ).length;

  const approvedBookings =
    apiStats?.approved ??
    bookings.filter(
      (b) => statusOf(b) === 'approved'
    ).length;

  const cancelledBookings =
    apiStats?.cancelled ??
    bookings.filter((b) =>
      [
        'cancelled',
        'canceled',
        'rejected',
      ].includes(statusOf(b))
    ).length;

  /*
   * Earnings:
   * Prefer the server-provided total.
   * Otherwise calculate from completed bookings.
   */
  const totalEarnings =
    apiStats?.total_earnings ??
    completed.reduce(
      (sum, b) =>
        sum + bookingAmount(b, serviceMap),
      0
    );

  /*
   * FINAL APPROVED ORDER
   *
   * 1. Total Bookings
   * 2. Pending
   * 3. Approved
   * 4. Completed
   * 5. Cancelled
   * 6. Total Earnings
   */
  const stats = [
    {
      title: 'Total Bookings',
      value: totalBookings,
      icon: Calendar,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100/80',
    },
    {
      title: 'Pending',
      value: pendingBookings,
      icon: Clock,
      iconColor: 'text-orange-500',
      iconBg: 'bg-orange-100/80',
    },
    {
      title: 'Approved',
      value: approvedBookings,
      icon: CheckCircle,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100/80',
    },
    {
      title: 'Completed',
      value: completedBookings,
      icon: CheckCircle,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100/80',
    },
    {
      title: 'Cancelled',
      value: cancelledBookings,
      icon: XCircle,
      iconColor: 'text-red-500',
      iconBg: 'bg-red-100/80',
    },
    {
      title: 'Total Earnings',
      value: totalEarnings,
      prefix: '₹',
      icon: IndianRupee,
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100/80',
      formatAsCurrency: true,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="
        grid
        grid-cols-2
        gap-3
        sm:gap-4
        lg:grid-cols-3
        xl:grid-cols-6
      "
    >
      {stats.map((stat, index) => (
        <StatCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          prefix={stat.prefix}
          icon={stat.icon}
          iconColor={stat.iconColor}
          iconBg={stat.iconBg}
          index={index}
          formatAsCurrency={stat.formatAsCurrency}
        />
      ))}
    </motion.div>
  );
}