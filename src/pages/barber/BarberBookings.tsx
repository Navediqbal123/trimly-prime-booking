import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Check, X, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getBarberBookings, updateBookingStatus, verifyBookingOtp, BookingData } from '@/lib/api';

const statusConfig: Record<string, { icon: typeof AlertCircle; label: string; className: string }> = {
  pending: { icon: AlertCircle, label: 'Pending', className: 'text-yellow-500 bg-yellow-500/10' },
  approved: { icon: CheckCircle, label: 'Approved', className: 'text-green-500 bg-green-500/10' },
  confirmed: { icon: CheckCircle, label: 'Confirmed', className: 'text-green-500 bg-green-500/10' },
  completed: { icon: CheckCircle, label: 'Completed', className: 'text-blue-500 bg-blue-500/10' },
  rejected: { icon: XCircle, label: 'Rejected', className: 'text-red-500 bg-red-500/10' },
  cancelled: { icon: XCircle, label: 'Cancelled', className: 'text-red-500 bg-red-500/10' },
};

export default function BarberBookings() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  const [acting, setActing] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const handleVerifyOtp = async (bookingId: string) => {
    const otp = (otpInputs[bookingId] || '').trim();
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }
    setVerifyingId(bookingId);
    try {
      const res = await verifyBookingOtp(bookingId, otp);
      if (res.success) {
        toast.success('OTP verified — booking completed');
        setOtpInputs((p) => ({ ...p, [bookingId]: '' }));
        await fetchBookings();
      } else {
        toast.error(res.error || 'Invalid OTP');
      }
    } finally {
      setVerifyingId(null);
    }
  };


  const fetchBookings = async () => {
    setLoading(true);
    const response = await getBarberBookings();
    if (response.success && response.data) {
      setBookings(response.data);
    } else {
      toast.error(response.error || 'Failed to fetch bookings');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleStatus = async (
    e: React.MouseEvent,
    id: string,
    status: 'approved' | 'rejected',
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (acting) return;
    setActing({ id, action: status });
    try {
      const res = await updateBookingStatus(id, status);
      if (res.success) {
        toast.success(status === 'approved' ? 'Booking accepted' : 'Booking rejected');
        await fetchBookings();
      } else {
        toast.error(res.error || 'Action failed');
      }
    } finally {
      setActing(null);
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === 'pending');
  const upcomingBookings = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed' || b.status === 'approved'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled' || b.status === 'rejected'
  );

  const renderBookingCard = (booking: BookingData) => (
    <BookingCard
      key={booking.id}
      booking={booking}
      acting={acting}
      onStatus={handleStatus}
      otpValue={otpInputs[booking.id] || ''}
      onOtpChange={(v) => setOtpInputs((p) => ({ ...p, [booking.id]: v }))}
      onVerify={() => handleVerifyOtp(booking.id)}
      verifying={verifyingId === booking.id}
    />
  );



  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            Customer <span className="gradient-text">Bookings</span>
            {pendingBookings.length > 0 && (
              <span className="ml-3 inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full bg-red-500 text-white text-sm font-bold align-middle">
                {pendingBookings.length} new
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">Manage your customer appointments</p>
        </div>
        <Button variant="outline" onClick={fetchBookings} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No upcoming bookings</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastBookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pastBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No past bookings</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
