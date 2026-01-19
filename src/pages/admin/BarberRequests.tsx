import { useState } from 'react';
import { motion } from 'framer-motion';
import { Store, Phone, Mail, MapPin, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { approveBarber } from '@/lib/api';

interface BarberRequest {
  id: string;
  owner_name: string;
  shop_name: string;
  email: string;
  phone: string;
  address: string;
  image_url: string;
  description: string;
}

const mockRequests: BarberRequest[] = [
  {
    id: '1',
    owner_name: 'Alex Johnson',
    shop_name: 'Sharp Styles Barbershop',
    email: 'alex@example.com',
    phone: '+1 555 123 4567',
    address: '456 Oak Street, City',
    image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500',
    description: 'Modern barbershop specializing in contemporary styles and fades.',
  },
  {
    id: '2',
    owner_name: 'Marcus Williams',
    shop_name: 'Elite Cuts Studio',
    email: 'marcus@example.com',
    phone: '+1 555 987 6543',
    address: '789 Pine Avenue, Downtown',
    image_url: 'https://images.unsplash.com/photo-1493256338651-d82f7acb2b38?w=500',
    description: 'Premium grooming services for the modern gentleman.',
  },
];

export default function BarberRequests() {
  const [requests, setRequests] = useState<BarberRequest[]>(mockRequests);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoadingId(id);
    const response = await approveBarber(id);
    
    if (response.success) {
      setRequests((prev) => prev.filter((r) => r.id !== id));
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

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
          Barber <span className="gradient-text">Requests</span>
        </h1>
        <p className="text-muted-foreground">Review and approve barber applications</p>
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
              <div className="h-40 overflow-hidden">
                <img src={request.image_url} alt={request.shop_name} className="w-full h-full object-cover" />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-1">{request.shop_name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{request.description}</p>
                
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex items-center gap-2"><Store className="w-4 h-4 text-primary" />{request.owner_name}</div>
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{request.email}</div>
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{request.phone}</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{request.address}</div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => handleReject(request.id)} disabled={loadingId === request.id}>
                    <X className="w-4 h-4 mr-2" />Reject
                  </Button>
                  <Button className="flex-1" onClick={() => handleApprove(request.id)} disabled={loadingId === request.id}>
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
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No pending barber requests</p>
        </div>
      )}
    </div>
  );
}
