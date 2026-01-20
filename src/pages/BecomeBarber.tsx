import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Store,
  MapPin,
  Scissors,
  CheckCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { registerBarber } from '@/lib/api';

export default function BecomeBarber() {
  const { updateLocalRole, isBarberPending } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // ONLY 2 fields as required by backend: shop_name and location
  const [formData, setFormData] = useState({
    shopName: '',
    location: '',
  });

  // If user is already pending, show status
  if (isBarberPending) {
    return (
      <div className="animate-fade-in">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-yellow-500" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Application Pending</h2>
            <p className="text-muted-foreground mb-6">
              Your barber application is under review. We'll notify you once it's approved.
            </p>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.shopName.trim() || !formData.location.trim()) {
      toast.error('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Call backend API to register barber
    // Send ONLY shop_name and location as per API spec
    const response = await registerBarber({
      shop_name: formData.shopName,
      location: formData.location,
    });

    if (response.success) {
      // Update local role to barber_pending
      updateLocalRole('barber_pending');
      toast.success('Request submitted, waiting for admin approval');
    } else {
      toast.error(response.error || 'Failed to submit application');
    }

    setLoading(false);
  };

  return (
    <div className="animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">Become a Barber</h1>
          <p className="text-muted-foreground">
            Join our platform and start accepting bookings
          </p>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[
            'Reach more customers',
            'Manage bookings easily',
            'Grow your business',
            'Get paid securely',
          ].map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Form - ONLY shop_name and location */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">Shop Information</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="shopName">Shop / Salon Name *</Label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="shopName"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="Classic Cuts Barbershop"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="Delhi, Mumbai, etc."
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Scissors className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
