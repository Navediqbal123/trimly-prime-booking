import { useState } from 'react';
import { motion } from 'framer-motion';
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
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Customer Bookings
        </CardTitle>
        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
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
                {bookings.map((booking) => {
                  const status = booking.status as keyof typeof statusConfig;
                  const config = statusConfig[status] || statusConfig.pending;
                  const isCancelled = booking.status === 'cancelled' || booking.status === 'completed';

                  return (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
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
                        <span className={cn('px-2 py-1 rounded-full text-xs font-medium', config.className)}>
                          {config.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {!isCancelled && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleCancel(booking.id)}
                            disabled={cancellingId === booking.id}
                            className="text-destructive hover:text-destructive"
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No bookings yet. When customers book your services, they will appear here.
          </div>
        )}
      </CardContent>
    </Card>
  );
}