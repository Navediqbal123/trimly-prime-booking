import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Scissors,
  User,
  Store,
  Phone,
  Mail,
  MapPin,
  FileText,
  Image,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { registerBarber } from '@/lib/api';

export default function BecomeBarber() {
  const { user, updateLocalRole, isBarberPending } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    location: '',
  });

  // If user is already pending, show status
  if (isBarberPending) {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-2xl p-8 text-center"
        >
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-4">
            Application Submitted!
          </h1>
          <p className="text-muted-foreground mb-6">
            Your barber request is under review. We'll notify you once your application has been approved.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.shopName || !formData.location) {
      toast.error('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Call backend API to register barber
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
    <div className="animate-fade-in max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
          Become a <span className="gradient-text">Barber</span>
        </h1>
        <p className="text-muted-foreground">
          Join our network of professional barbers and grow your business
        </p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        {/* Benefits */}
        <div className="grid grid-cols-2 gap-4 mb-8 pb-8 border-b border-border">
          {[
            { icon: Scissors, text: 'Showcase your skills' },
            { icon: User, text: 'Reach more customers' },
            { icon: Store, text: 'Manage your shop' },
            { icon: CheckCircle, text: 'Easy booking system' },
          ].map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-primary/5"
            >
              <item.icon className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </div>

        {/* Form */}
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
      </motion.div>
    </div>
  );
}
