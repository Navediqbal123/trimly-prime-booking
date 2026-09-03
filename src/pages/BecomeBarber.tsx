import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Store,
  MapPin,
  Scissors,
  Loader2,
  Clock,
  Users,
  CalendarCheck,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { registerBarber } from '@/lib/api';
import barberHero from '@/assets/barber-hero.jpg';

export default function BecomeBarber() {
  const { updateLocalRole, isBarber, isBarberPending, refreshBarberStatus } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  // ONLY 2 fields as required by backend: shop_name and location
  const [formData, setFormData] = useState({
    shopName: '',
    location: '',
  });

  // Redirect approved barbers to their dashboard
  useEffect(() => {
    if (isBarber) {
      navigate('/barber-hub', { replace: true });
    }
  }, [isBarber, navigate]);

  // If user is already approved, don't render anything (redirect will happen)
  if (isBarber) {
    return null;
  }

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

    try {
      // Call backend API to register barber
      const response = await registerBarber({
        shop_name: formData.shopName,
        location: formData.location,
      });

      // Backend may return 200/201 with various shapes — treat any non-error as success
      if (response.success || response.data) {
        // Update local role to barber_pending immediately
        updateLocalRole('barber_pending');
        // Cache pending status in localStorage
        localStorage.setItem('trimly_barber_status', JSON.stringify({ role: 'barber_pending', status: 'pending' }));
        toast.success('Request submitted, waiting for admin approval');
        // Refresh after a short delay to let backend process
        setTimeout(() => refreshBarberStatus(), 3000);
      } else {
        toast.error(response.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Barber registration error:', err);
      toast.error('Something went wrong. Please try again.');
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
        {/* Premium hero */}
        <div className="relative overflow-hidden rounded-3xl mb-6 border border-gold/20 shadow-2xl">
          <img
            src={barberHero}
            alt="Luxury barber chair in a premium barbershop"
            width={1024}
            height={640}
            className="absolute inset-0 w-full h-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[hsl(0_0%_4%)] via-[hsl(0_0%_6%/0.92)] to-[hsl(0_0%_6%/0.35)]" />
          <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full blur-3xl bg-gold/20" />
          <div className="relative p-6 sm:p-8 max-w-[78%]">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-3 py-1 mb-4 backdrop-blur-sm">
              <Scissors className="w-3.5 h-3.5 text-gold" />
              <span className="text-[11px] tracking-[0.18em] uppercase text-gold/90">Trimly Partners</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-display font-bold leading-tight text-white">
              Open Your
              <br />
              <span className="gradient-gold-text">Barber Shop</span>
            </h1>
            <p className="mt-3 text-sm text-white/70 max-w-sm">
              Fill in the details below to get your shop approved on Trimly.
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Reach more customers', Icon: Users },
            { label: 'Manage bookings easily', Icon: CalendarCheck },
            { label: 'Grow your business', Icon: TrendingUp },
            { label: 'Get paid securely', Icon: ShieldCheck },
          ].map(({ label, Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-border bg-card p-3 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="text-xs font-medium leading-snug block">{label}</span>
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
