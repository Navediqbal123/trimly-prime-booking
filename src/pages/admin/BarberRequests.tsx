import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Store, MapPin, Check, X, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { approveBarber, getPendingBarbers, PendingBarberData } from '@/lib/api';

export default function BarberRequests() {
  const [requests, setRequests] = useState<PendingBarberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchPendingBarbers = async () => {
    setLoading(true);
    const response = await getPendingBarbers();
    
    if (response.success && response.data) {
      // Only show pending requests - filter out any approved ones
      setRequests(response.data.filter((r: any) => r.status === 'pending' || !r.status));
    } else {
      toast.error(response.error || 'Failed to fetch pending requests');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingBarbers();
  }, []);

  const handleApprove = async (request: PendingBarberData) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(request.id) || !uuidRegex.test(request.user_id)) {
      toast.error('Invalid ID format');
      return;
    }

    setLoadingId(request.id);
    const response = await approveBarber(request.id, request.user_id);
    
    if (response.success) {
      setRequests((prev) => prev.filter((r) => r.id !== request.id));
      toast.success('Barber approved successfully');
    } else {
      toast.error(response.error || 'Failed to approve barber');
    }
    setLoadingId(null);
  };

  const handleReject = (id: string) => {
    // No backend route for reject - just update UI
    setRequests((prev) => prev.filter((r) => r.id !== id));
    toast.success('Request rejected');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading pending requests...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="animate-fade-in"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
            Barber <span className="gradient-text">Requests</span>
          </h1>
          <p className="text-muted-foreground">Review and approve barber applications</p>
        </div>
        <Button variant="outline" onClick={fetchPendingBarbers} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {requests.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {requests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-1">{request.shop_name}</h3>
                
                <div className="space-y-2 text-sm mb-4 mt-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-primary" />
                    <span>{request.user?.name || 'Unknown Owner'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{request.location}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Submitted: {new Date(request.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => handleReject(request.id)} 
                    disabled={loadingId === request.id}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button 
                    className="flex-1" 
                    onClick={() => handleApprove(request)} 
                    disabled={loadingId === request.id}
                  >
                    {loadingId === request.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Pending Requests</h3>
          <p className="text-muted-foreground max-w-md">
            When barbers submit applications, they will appear here for approval.
          </p>
        </div>
      )}
    </motion.div>
  );
}
