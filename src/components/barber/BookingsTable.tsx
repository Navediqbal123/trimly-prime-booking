import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  User,
  Check,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  BookingData,
  cancelBooking,
  updateBookingStatus,
} from '@/lib/api';
import { cn } from '@/lib/utils';

interface BookingsTableProps {
  bookings: BookingData[];
  onRefresh: () => void;
  loading: boolean;
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  pending: {
    label: 'Pending',
    className: 'text-[#d98a00] bg-[#fff4d6]',
  },
  approved: {
    label: 'Approved',
    className: 'text-[#0b9b5b] bg-[#eafff4]',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'text-[#0b9b5b] bg-[#eafff4]',
  },
  completed: {
    label: 'Completed',
    className: 'text-[#2878d7] bg-[#eaf3ff]',
  },
  rejected: {
    label: 'Rejected',
    className: 'text-[#e34b4b] bg-[#fff0f0]',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'text-[#e34b4b] bg-[#fff0f0]',
  },
};

const rowVariants = {
  hidden: {
    opacity: 0,
    x: -20,
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      duration: 0.2,
    },
  },
};

const clayCard =
  'rounded-[30px] border-0 bg-white shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]';

const softClay =
  'shadow-[4px_5px_11px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.95)]';

export function BookingsTable({
  bookings,
  onRefresh,
  loading,
}: BookingsTableProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(
    null,
  );

  const [acting, setActing] = useState<{
    id: string;
    action: 'approved' | 'rejected';
  } | null>(null);

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);

    const response = await cancelBooking(bookingId);

    if (response.success) {
      toast.success('Booking cancelled successfully');
      onRefresh();
    } else {
      toast.error(
        response.error || 'Failed to cancel booking',
      );
    }

    setCancellingId(null);
  };

  const handleStatus = async (
    e: React.MouseEvent,
    id: string,
    status: 'approved' | 'rejected',
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (acting) return;

    setActing({
      id,
      action: status,
    });

    try {
      const res = await updateBookingStatus(id, status);

      if (res.success) {
        toast.success(
          status === 'approved'
            ? 'Booking accepted'
            : 'Booking rejected',
        );

        onRefresh();
      } else {
        toast.error(res.error || 'Action failed');
      }
    } finally {
      setActing(null);
    }
  };

  const pendingCount = bookings.filter(
    (b) => b.status === 'pending',
  ).length;

  return (
    <Card className={`${clayCard} overflow-hidden`}>
      {/* Header */}
      <CardHeader
        className="
          flex
          flex-col
          gap-4
          p-4
          sm:flex-row
          sm:items-center
          sm:justify-between
          sm:p-6
        "
      >
        <CardTitle className="flex items-center gap-3">
          <div
            className="
              flex
              h-12
              w-12
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[#fff0e5]
              text-orange-500
              shadow-[inset_3px_3px_7px_rgba(255,255,255,0.95),inset_-4px_-4px_8px_rgba(0,0,0,0.06),5px_6px_12px_rgba(0,0,0,0.08)]
            "
          >
            <Calendar className="h-6 w-6" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">
                Customer Bookings
              </h2>

              {pendingCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="
                    rounded-full
                    bg-[#fff0f0]
                    px-2.5
                    py-1
                    text-[11px]
                    font-bold
                    text-[#e34b4b]
                    shadow-[inset_2px_2px_4px_rgba(255,255,255,0.95),inset_-2px_-2px_4px_rgba(0,0,0,0.04)]
                  "
                >
                  {pendingCount} new
                </motion.span>
              )}

              {bookings.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="
                    rounded-full
                    bg-[#fff0e5]
                    px-2.5
                    py-1
                    text-[11px]
                    font-bold
                    text-orange-500
                    shadow-[inset_2px_2px_4px_rgba(255,255,255,0.95),inset_-2px_-2px_4px_rgba(0,0,0,0.04)]
                  "
                >
                  {bookings.length}
                </motion.span>
              )}
            </div>

            <p className="mt-1 text-xs font-normal text-slate-500 sm:text-sm">
              Manage and respond to customer appointments
            </p>
          </div>
        </CardTitle>

        {/* Refresh */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="
            h-11
            rounded-[18px]
            border-0
            bg-white
            px-4
            text-slate-700
            shadow-[5px_6px_12px_rgba(0,0,0,0.09),-4px_-4px_10px_rgba(255,255,255,0.95)]
            transition-all
            duration-200
            hover:bg-white
            hover:text-orange-500
            hover:scale-105
            active:scale-95
          "
        >
          <RefreshCw
            className={cn(
              'mr-2 h-4 w-4',
              loading && 'animate-spin',
            )}
          />
          Refresh
        </Button>
      </CardHeader>

      <CardContent className="px-3 pb-4 sm:px-6 sm:pb-6">
        {bookings.length > 0 ? (
          <div
            className="
              overflow-x-auto
              rounded-[22px]
              bg-white
              shadow-[inset_2px_2px_6px_rgba(0,0,0,0.04),inset_-2px_-2px_6px_rgba(255,255,255,0.95)]
            "
          >
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100">
                  <TableHead className="px-4 py-3 text-xs font-bold text-slate-600 sm:text-sm">
                    Customer
                  </TableHead>

                  <TableHead className="px-4 py-3 text-xs font-bold text-slate-600 sm:text-sm">
                    Service
                  </TableHead>

                  <TableHead className="px-4 py-3 text-xs font-bold text-slate-600 sm:text-sm">
                    Price
                  </TableHead>

                  <TableHead className="px-4 py-3 text-xs font-bold text-slate-600 sm:text-sm">
                    Date
                  </TableHead>

                  <TableHead className="px-4 py-3 text-xs font-bold text-slate-600 sm:text-sm">
                    Time Slot
                  </TableHead>

                  <TableHead className="px-4 py-3 text-xs font-bold text-slate-600 sm:text-sm">
                    Status
                  </TableHead>

                  <TableHead className="px-4 py-3 text-right text-xs font-bold text-slate-600 sm:text-sm">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                <AnimatePresence mode="popLayout">
                  {bookings.map((booking, index) => {
                    const status =
                      booking.status as keyof typeof statusConfig;

                    const config =
                      statusConfig[status] ||
                      statusConfig.pending;

                    const isCancelled =
                      booking.status === 'cancelled' ||
                      booking.status === 'completed';

                    const serviceList =
                      booking.services_list &&
                      booking.services_list.length > 0
                        ? booking.services_list
                        : booking.services &&
                            booking.services.length > 0
                          ? booking.services
                          : booking.service
                            ? [booking.service]
                            : [];

                    const serviceNames =
                      serviceList
                        .map((s) => s.name)
                        .filter(Boolean)
                        .join(', ') ||
                      `#${booking.service_id?.slice(0, 8) ?? ''}`;

                    const calculatedPrice =
                      serviceList.reduce(
                        (sum, s) =>
                          sum + Number(s.price ?? 0),
                        0,
                      );

                    const bookingPrice =
                      Number(booking.total_amount ?? 0) ||
                      calculatedPrice;

                    return (
                      <motion.tr
                        key={booking.id}
                        custom={index}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="
                          border-b
                          border-slate-100
                          transition-colors
                          hover:bg-orange-50/40
                        "
                      >
                        {/* Customer */}
                        <TableCell className="px-4 py-3">
                          <div className="flex min-w-[150px] items-center gap-2.5">
                            <motion.div
                              className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-[#eaf3ff]
                                text-[#2878d7]
                                shadow-[inset_2px_2px_5px_rgba(255,255,255,0.95),inset_-3px_-3px_6px_rgba(0,0,0,0.05),4px_5px_10px_rgba(0,0,0,0.07)]
                              "
                              whileHover={{
                                scale: 1.1,
                              }}
                            >
                              <User className="h-4 w-4" />
                            </motion.div>

                            <span className="max-w-[180px] truncate text-sm font-semibold text-slate-800">
                              {booking.user?.full_name ||
                                booking.user?.name ||
                                booking.user?.email ||
                                `#${booking.id.slice(0, 8)}`}
                            </span>
                          </div>
                        </TableCell>

                        {/* Service */}
                        <TableCell className="px-4 py-3">
                          <span className="text-sm font-medium text-slate-700">
                            {serviceNames}
                          </span>
                        </TableCell>

                        {/* Price */}
                        <TableCell className="px-4 py-3">
                          <span className="font-bold text-slate-900">
                            ₹
                            {bookingPrice.toLocaleString(
                              'en-IN',
                            )}
                          </span>
                        </TableCell>

                        {/* Date */}
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-600">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            {new Date(
                              booking.date,
                            ).toLocaleDateString('en-IN')}
                          </div>
                        </TableCell>

                        {/* Time */}
                        <TableCell className="px-4 py-3">
                          <div className="flex items-center gap-1.5 whitespace-nowrap text-sm text-slate-600">
                            <Clock className="h-4 w-4 text-orange-500" />
                            {booking.time_slot}
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-4 py-3">
                          <motion.span
                            className={cn(
                              'inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold',
                              config.className,
                              softClay,
                            )}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{
                              type: 'spring',
                              stiffness: 500,
                            }}
                          >
                            {config.label}
                          </motion.span>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-4 py-3 text-right">
                          {booking.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              {(() => {
                                const isThis =
                                  acting?.id ===
                                  booking.id;

                                const isRej =
                                  isThis &&
                                  acting?.action ===
                                    'rejected';

                                const isApp =
                                  isThis &&
                                  acting?.action ===
                                    'approved';

                                return (
                                  <>
                                    {/* Reject */}
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={isThis}
                                      onClick={(e) =>
                                        handleStatus(
                                          e,
                                          booking.id,
                                          'rejected',
                                        )
                                      }
                                      className="
                                        h-9
                                        rounded-[14px]
                                        border-0
                                        bg-[#fff0f0]
                                        px-3
                                        text-[#e34b4b]
                                        shadow-[4px_5px_10px_rgba(0,0,0,0.07),-3px_-3px_8px_rgba(255,255,255,0.95)]
                                        transition-all
                                        duration-200
                                        hover:bg-[#fff0f0]
                                        hover:text-[#d93636]
                                        hover:scale-105
                                        active:scale-95
                                        disabled:opacity-60
                                      "
                                    >
                                      {isRej ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <X className="mr-1 h-4 w-4" />
                                          Reject
                                        </>
                                      )}
                                    </Button>

                                    {/* Accept */}
                                    <Button
                                      type="button"
                                      size="sm"
                                      disabled={isThis}
                                      onClick={(e) =>
                                        handleStatus(
                                          e,
                                          booking.id,
                                          'approved',
                                        )
                                      }
                                      className="
                                        h-9
                                        rounded-[14px]
                                        border-0
                                        bg-[#eafff4]
                                        px-3
                                        text-[#0b9b5b]
                                        shadow-[4px_5px_10px_rgba(0,0,0,0.07),-3px_-3px_8px_rgba(255,255,255,0.95)]
                                        transition-all
                                        duration-200
                                        hover:bg-[#eafff4]
                                        hover:text-[#07834d]
                                        hover:scale-105
                                        active:scale-95
                                        disabled:opacity-60
                                      "
                                    >
                                      {isApp ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <>
                                          <Check className="mr-1 h-4 w-4" />
                                          Accept
                                        </>
                                      )}
                                    </Button>
                                  </>
                                );
                              })()}
                            </div>
                          ) : !isCancelled ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleCancel(booking.id)
                              }
                              disabled={
                                cancellingId === booking.id
                              }
                              className="
                                h-9
                                rounded-[14px]
                                border-0
                                bg-[#fff0f0]
                                px-3
                                text-[#e34b4b]
                                shadow-[4px_5px_10px_rgba(0,0,0,0.07),-3px_-3px_8px_rgba(255,255,255,0.95)]
                                transition-all
                                duration-200
                                hover:bg-[#fff0f0]
                                hover:text-[#d93636]
                                hover:scale-105
                                active:scale-95
                              "
                            >
                              {cancellingId === booking.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="mr-1 h-4 w-4" />
                                  Cancel
                                </>
                              )}
                            </Button>
                          ) : null}
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="
              flex
              flex-col
              items-center
              justify-center
              py-14
              text-center
              text-slate-500
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
                bg-[#fff0e5]
                text-orange-400
                shadow-[inset_3px_3px_7px_rgba(255,255,255,0.95),inset_-4px_-4px_8px_rgba(0,0,0,0.05),5px_6px_12px_rgba(0,0,0,0.07)]
              "
            >
              <Calendar className="h-8 w-8" />
            </div>

            <p className="font-semibold text-slate-700">
              No bookings yet.
            </p>

            <p className="mt-1 max-w-md px-5 text-sm text-slate-500">
              When customers book your services, they will
              appear here.
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
