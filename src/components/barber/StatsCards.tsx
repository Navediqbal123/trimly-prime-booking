import { type ComponentType } from 'react';
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
 icon: ComponentType<{ className?: string }>;
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
          min-h-[96px]
          overflow-hidden
          rounded-[24px]
          border-0
          bg-white
          p-0
          shadow-[6px_7px_15px_rgba(0,0,0,0.09),-5px_-5px_13px_rgba(255,255,255,0.95)]
          transition-all
          duration-300
          hover:shadow-[8px_9px_18px_rgba(0,0,0,0.11),-6px_-6px_15px_rgba(255,255,255,1)]
          sm:min-h-[118px]
          sm:rounded-[30px]
          sm:shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]
        "
      >
        <div
          className="
            relative
            flex
            h-full
            min-h-[96px]
            items-center
            gap-2
            px-3
            py-3
            sm:min-h-[118px]
            sm:gap-4
            sm:px-6
            sm:py-4
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
              h-11
              w-11
              shrink-0
              items-center
              justify-center
              rounded-full
              ${iconBg}
              ${iconColor}
              shadow-[inset_2px_2px_5px_rgba(255,255,255,0.95),inset_-3px_-3px_6px_rgba(0,0,0,0.05),4px_5px_10px_rgba(0,0,0,0.07)]
              sm:h-[72px]
              sm:w-[72px]
              sm:shadow-[inset_3px_3px_7px_rgba(255,255,255,0.95),inset_-4px_-4px_8px_rgba(0,0,0,0.06),5px_6px_12px_rgba(0,0,0,0.08)]
            `}
          >
            <Icon
              className="
                h-5
                w-5
                stroke-[2.2]
                drop-shadow-[0_1px_1px_rgba(255,255,255,0.7)]
                sm:h-8
                sm:w-8
              "
            />
          </motion.div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p
              className="
                mb-1
                truncate
                text-[11px]
                font-semibold
                leading-tight
                text-slate-600
                sm:mb-2
                sm:text-[16px]
                sm:font-medium
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
                text-[21px]
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
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-white
              text-slate-800
              shadow-[3px_4px_8px_rgba(0,0,0,0.08),-2px_-2px_7px_rgba(255,255,255,0.95)]
              transition-all
              duration-200
              group-hover:text-orange-500
              sm:h-12
              sm:w-12
              sm:shadow-[4px_5px_10px_rgba(0,0,0,0.09),-3px_-3px_8px_rgba(255,255,255,0.95)]
            "
          >
            <ChevronRight
              className="
                h-4
                w-4
                stroke-[2.4]
                sm:h-6
                sm:w-6
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

  const totalEarnings =
    apiStats?.total_earnings ??
    completed.reduce(
      (sum, b) =>
        sum + bookingAmount(b, serviceMap),
      0,
    );

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