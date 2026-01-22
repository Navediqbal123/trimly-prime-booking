import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, XCircle, Loader2, RefreshCw, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { BookingData, cancelBooking } from '@/lib/api';
import { cn } from '@/lib/utils';

interface BookingsTableProps {
  bookings: BookingData[];
  onRefresh: () => void;
  loading: boolean;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'text-yellow-500 bg-yellow-500/10',
  },
  confirmed: {
    label: 'Confirmed',
    className: 'text-green-500 bg-green-500/10',
  },
  completed: {
    label: 'Completed',
    className: 'text-blue-500 bg-blue-500/10',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'text-red-500 bg-red-500/10',
  },
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
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
    transition: { duration: 0.2 }
  },
};

export function BookingsTable({ bookings, onRefresh, loading }: BookingsTableProps) {
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (bookingId: string) => {
    setCancellingId(bookingId);
    const response = await cancelBooking(bookingId);
    
    if (response.success) {
      toast.success('Booking cancelled successfully');
      onRefresh();
    } else {
      toast.error(response.error || 'Failed to cancel booking');
    }
    setCancellingId(null);
  };

  return (
    <Card className="border-border overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Customer Bookings
          {bookings.length > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full"
            >
              {bookings.length}
            </motion.span>
          )}
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh} 
          disabled={loading}
          className="transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time Slot</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                  {bookings.map((booking, index) => {
                    const status = booking.status as keyof typeof statusConfig;
                    const config = statusConfig[status] || statusConfig.pending;
                    const isCancelled = booking.status === 'cancelled' || booking.status === 'completed';

                    return (
                      <motion.tr
                        key={booking.id}
                        custom={index}
                        variants={rowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <motion.div 
                              className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
                              whileHover={{ scale: 1.1 }}
                            >
                              <User className="w-4 h-4 text-primary" />
                            </motion.div>
                            <span className="font-medium">Customer</span>
                          </div>
                        </TableCell>
                        <TableCell>{booking.service?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {new Date(booking.date).toLocaleDateString('en-IN')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {booking.time_slot}
                          </div>
                        </TableCell>
                        <TableCell>
                          <motion.span 
                            className={cn('px-2 py-1 rounded-full text-xs font-medium inline-block', config.className)}
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            {config.label}
                          </motion.span>
                        </TableCell>
                        <TableCell className="text-right">
                          {!isCancelled && (
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleCancel(booking.id)}
                              disabled={cancellingId === booking.id}
                              className="text-destructive hover:text-destructive transition-all duration-200 hover:scale-105"
                            >
                              {cancellingId === booking.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Cancel
                                </>
                              )}
                            </Button>
                          )}
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
            className="text-center py-12 text-muted-foreground"
          >
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No bookings yet.</p>
            <p className="text-sm mt-1">When customers book your services, they will appear here.</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
