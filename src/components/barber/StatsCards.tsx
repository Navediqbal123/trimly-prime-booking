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
        y: 14,
        scale: 0.98,
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
        scale: 1.008,
      }}
      whileTap={{
        scale: 0.985,
      }}
      className="h-full"
    >
      <Card
        className="
          group
          relative
          h-full
          min-h-[118px]
          overflow-hidden
          rounded-[30px]
          border-0
          bg-white
          p-0
          shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]
          transition-all
          duration-300
          hover:shadow-[9px_10px_20px_rgba(0,0,0,0.12),-7px_-7px_17px_rgba(255,255,255,1)]
        "
      >
        <div
          className="
            relative
            flex    
            h-full
            min-h-[118px]
            items-center
            gap-4
            px-5
            py-4
            sm:px-6
          "
        >
          {/* Icon */}
          <motion.div
            whileHover={{
              scale: 1.05,
              rotate: 2,
            }}
            transition={{
              duration: 0.2,
            }}
            className={`
              flex
              h-[68px]
              w-[68px]
              shrink-0
              items-center
              justify-center
              rounded-full
              ${iconBg}
              ${iconColor}
              shadow-[inset_3px_3px_7px_rgba(255,255,255,0.95),inset_-4px_-4px_8px_rgba(0,0,0,0.06),5px_6px_12px_rgba(0,0,0,0.08)]
              sm:h-[72px]
              sm:w-[72px]
            `}
          >
            <Icon
              className="
                h-8
                w-8
                stroke-[2.2]
                drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]
              "
            />
          </motion.div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p
              className="
                mb-2
                truncate
                text-[14px]
                font-medium
                leading-tight
                text-slate-600
                sm:text-[16px]
              "
            >
              {title}
            </p>
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
                truncate
                text-[28px]
                font-bold
                leading-none
                tracking-tight
                text-slate-950
                sm:text-[34px]
              "
            >
              {prefix}
              {displayValue}
            </motion.div>
          </div>

          {/* 3D Arrow */}
          <motion.div
            whileHover={{
              scale: 1.08,
              x: 1,
            }}
            whileTap={{
              scale: 0.92,
            }}
            className="
              flex
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white
              text-slate-800
              shadow-[4px_5px_10px_rgba(0,0,0,0.09),-3px_-3px_8px_rgba(255,255,255,0.95)]
              transition-all
              duration-200
              group-hover:text-orange-500
              sm:h-12
              sm:w-12
            "
          >
            <ChevronRight
              className="
                h-6
                w-6
                stroke-[2.4]
              "
            />
          </motion.div>
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
    (b) => statusOf(b) === 'completed',
  );

  const totalBookings =
    apiStats?.total_bookings ?? bookings.length;

  const completedBookings =
    apiStats?.completed ?? completed.length;

  const pendingBookings =
    apiStats?.pending ??
    bookings.filter(
      (b) => statusOf(b) === 'pending',
    ).length;

  const approvedBookings =
    apiStats?.approved ??
    bookings.filter(
      (b) => statusOf(b) === 'approved',
    ).length;

  const cancelledBookings =
    apiStats?.cancelled ??
    bookings.filter((b) =>
      [
        'cancelled',
        'canceled',
        'rejected',
      ].includes(statusOf(b)),
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
      0,
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
      iconBg: 'bg-[#fff0e5]',
    },
    {
      title: 'Pending',
      value: pendingBookings,
      icon: Clock,
      iconColor: 'text-[#e58b00]',
      iconBg: 'bg-[#fff5dc]',
    },
    {
      title: 'Approved',
      value: approvedBookings,
      icon: CheckCircle,
      iconColor: 'text-[#0dbb69]',
      iconBg: 'bg-[#eafff4]',
    },
    {
      title: 'Completed',
      value: completedBookings,
      icon: CheckCircle,
      iconColor: 'text-[#1976ed]',
      iconBg: 'bg-[#e8f4ff]',
    },
    {
      title: 'Cancelled',
      value: cancelledBookings,
      icon: XCircle,
      iconColor: 'text-[#ed3159]',
      iconBg: 'bg-[#ffe9ee]',
    },
    {
      title: 'Total Earnings',
      value: totalEarnings,
      prefix: '₹',
      icon: IndianRupee,
      iconColor: 'text-[#7448e8]',
      iconBg: 'bg-[#f2edff]',
      formatAsCurrency: true,
    },
  ];

  void isLoading;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="
        grid
        grid-cols-2
        gap-3
        sm:gap-5
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