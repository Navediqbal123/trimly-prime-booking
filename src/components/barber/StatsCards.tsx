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
          min-h-[104px]
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
            min-h-[104px]
            flex-col
            justify-center
            px-3
            py-3
            sm:min-h-[118px]
            sm:px-5
            sm:py-4
          "
        >
          {/* Title */}
          <div
            className="
              pr-9
              text-[11px]
              font-bold
              leading-tight
              whitespace-nowrap
              text-slate-700
              sm:pr-12
              sm:text-[15px]
            "
          >
            {title}
          </div>

          {/* Number */}
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
              mt-2
              whitespace-nowrap
              text-[22px]
              font-extrabold
              leading-none
              tracking-tight
              text-slate-950
              sm:mt-2
              sm:text-[32px]
            "
          >
            {prefix}
            {displayValue}
          </motion.div>

          {/* Small Clay Icon */}
          <motion.div
            whileHover={{
              scale: 1.06,
              rotate: 2,
            }}
            transition={{
              duration: 0.2,
            }}
            className={`
              absolute
              right-3
              top-3
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              ${iconBg}
              ${iconColor}
              shadow-[inset_2px_2px_4px_rgba(255,255,255,0.95),inset_-2px_-2px_5px_rgba(0,0,0,0.07),3px_4px_8px_rgba(0,0,0,0.08)]
              sm:right-5
              sm:top-4
              sm:h-12
              sm:w-12
              sm:shadow-[inset_2px_2px_5px_rgba(255,255,255,0.95),inset_-3px_-3px_6px_rgba(0,0,0,0.07),4px_5px_10px_rgba(0,0,0,0.08)]
            `}
          >
            <Icon
              className="
                h-[18px]
                w-[18px]
                stroke-[2.5]
                drop-shadow-[0_1px_1px_rgba(255,255,255,0.65)]
                sm:h-[23px]
                sm:w-[23px]
              "
            />
          </motion.div>

          {/* Colorful 3D Arrow */}
          <motion.div
            whileHover={{
              scale: 1.08,
              x: 1,
            }}
            whileTap={{
              scale: 0.92,
            }}
            className="
              absolute
              bottom-3
              right-3
              flex
              h-6
              w-6
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#fff0e5]
              text-[#e85d04]
              shadow-[inset_1px_1px_3px_rgba(255,255,255,0.95),inset_-2px_-2px_3px_rgba(0,0,0,0.08),2px_3px_6px_rgba(0,0,0,0.10)]
              transition-all
              duration-200
              sm:bottom-4
              sm:right-5
              sm:h-8
              sm:w-8
              sm:shadow-[inset_2px_2px_4px_rgba(255,255,255,0.95),inset_-2px_-2px_4px_rgba(0,0,0,0.08),3px_4px_7px_rgba(0,0,0,0.10)]
            "
          >
            <ChevronRight
              className="
                h-[14px]
                w-[14px]
                stroke-[2.8]
                sm:h-[17px]
                sm:w-[17px]
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
      iconColor: 'text-[#d94801]',
      iconBg: 'bg-[#fff0e5]',
    },
    {
      title: 'Pending',
      value: pendingBookings,
      icon: Clock,
      iconColor: 'text-[#c96b00]',
      iconBg: 'bg-[#fff5dc]',
    },
    {
      title: 'Approved',
      value: approvedBookings,
      icon: CheckCircle,
      iconColor: 'text-[#07834b]',
      iconBg: 'bg-[#eafff4]',
    },
    {
      title: 'Completed',
      value: completedBookings,
      icon: CheckCircle,
      iconColor: 'text-[#125bb5]',
      iconBg: 'bg-[#e8f4ff]',
    },
    {
      title: 'Cancelled',
      value: cancelledBookings,
      icon: XCircle,
      iconColor: 'text-[#c91f45]',
      iconBg: 'bg-[#ffe9ee]',
    },
    {
      title: 'Total Earnings',
      value: totalEarnings,
      prefix: '₹',
      icon: IndianRupee,
      iconColor: 'text-[#5b2bbd]',
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
