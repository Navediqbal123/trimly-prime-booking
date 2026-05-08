import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Scissors, Loader2, Clock, Home, ArrowRight, Star, Sparkles } from 'lucide-react';
import { useProtectedUser } from '@/contexts/ProtectedUserContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';

interface ServiceWithBarber {
  id: string;
  barber_id: string;
  name: string;
  price: number;
  duration: number;
  home_service: boolean;
  barbers: {
    id: string;
    shop_name: string;
    location: string;
  } | null;
}

interface Barber {
  id: string;
  shop_name: string;
  location: string;
}

export default function Dashboard() {
  const { user } = useProtectedUser();
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<ServiceWithBarber | null>(null);

  const handleBookNow = () => {
    if (selectedService?.barbers?.id) {
      navigate(`/book/${selectedService.barbers.id}`);
      setSelectedService(null);
    }
  };

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['allServicesHome'],
    queryFn: async (): Promise<ServiceWithBarber[]> => {
      const { data, error } = await supabase
        .from('services')
        .select('id, barber_id, name, price, duration, home_service, barbers(id, shop_name, location, status)')
        .eq('barbers.status', 'approved');
      if (error) throw error;
      return (data || [])
        .filter((s: any) => s.barbers)
        .map((s: any) => ({
          id: s.id,
          barber_id: s.barber_id,
          name: s.name,
          price: s.price,
          duration: s.duration,
          home_service: s.home_service,
          barbers: {
            id: s.barbers.id,
            shop_name: s.barbers.shop_name,
            location: s.barbers.location,
          },
        }));
    },
  });

  const { data: barbers = [], isLoading: loadingBarbers } = useQuery({
    queryKey: ['approvedBarbersHome'],
    queryFn: async (): Promise<Barber[]> => {
      const { data, error } = await supabase
        .from('barbers')
        .select('id, shop_name, location')
        .eq('status', 'approved')
        .limit(10);
      if (error) throw error;
      return data || [];
    },
  });

  const scrollToServices = () => {
    document.getElementById('featured-services')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="animate-fade-in space-y-10">
      {/* Hero Banner */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl glass-card p-6 lg:p-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/5 to-gold/20 opacity-90" />
        <div
          className="absolute -right-20 -top-20 w-72 h-72 rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--gold) / 0.6), transparent 70%)' }}
        />
        <div
          className="absolute -left-10 -bottom-10 w-72 h-72 rounded-full opacity-50 blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.7), transparent 70%)' }}
        />
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full glass-panel">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            <span className="text-xs font-medium tracking-wide text-gold">Premium Grooming</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold leading-tight mb-3 text-white">
            Your Perfect <span className="gradient-gold-text">Trim</span>,
            <br />
            Anytime.
          </h1>
          <p className="text-sm sm:text-base text-white mb-6 max-w-md">
            {user?.full_name?.split(' ')[0] ? `Welcome back, ${user.full_name.split(' ')[0]}. ` : ''}
            Book elite barbers near you in seconds.
          </p>
          <Button
            onClick={scrollToServices}
            className="btn-gold h-12 px-6 rounded-full font-semibold hover:scale-105 transition-transform"
          >
            Discover Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.section>

      {/* Featured Services */}
      <section id="featured-services">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Featured Services</h2>
            <p className="text-sm text-muted-foreground">Swipe to explore</p>
          </div>
        </div>

        {loadingServices ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : services.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Scissors className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No services available yet.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto overflow-y-visible pb-4 pt-2 pl-1 pr-4 snap-x scrollbar-thin">
            {services.map((service, i) => (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                whileHover={{ y: -4 }}
                onClick={() => setSelectedService(service)}
                className="snap-start shrink-0 w-44 sm:w-52 glass-card rounded-2xl p-4 text-left group hover:border-gold/50 transition-all"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br from-primary/30 to-gold/20 border border-gold/20">
                  <Scissors className="w-6 h-6 text-gold" />
                </div>
                <h3 className="font-display font-semibold text-base mb-1 line-clamp-1 text-white group-hover:text-gold transition-colors">
                  {service.name}
                </h3>
                {service.barbers && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
                    {service.barbers.shop_name}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-display font-bold gradient-gold-text">₹{service.price}</span>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {service.duration}m
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* Discover Barbers */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Discover Barbers</h2>
            <p className="text-sm text-muted-foreground">Top professionals near you</p>
          </div>
          <button
            onClick={() => navigate('/discover')}
            className="text-xs font-medium text-gold hover:underline"
          >
            See all
          </button>
        </div>

        {loadingBarbers ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : barbers.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="text-muted-foreground text-sm">No barbers available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {barbers.map((b, i) => (
              <motion.button
                key={b.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                whileHover={{ y: -4 }}
                onClick={() => navigate(`/book/${b.id}`)}
                className="glass-card rounded-2xl overflow-hidden text-left hover:border-gold/50 transition-all group"
              >
                <div className="relative h-28 bg-gradient-to-br from-primary/50 via-primary/30 to-gold/30 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-background/40 border-2 border-gold flex items-center justify-center">
                    <span className="font-display font-bold text-lg text-white">
                      {b.shop_name?.[0]?.toUpperCase() || 'B'}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/60 border border-gold/40">
                    <Star className="w-3 h-3 text-gold fill-gold" />
                    <span className="text-[10px] font-semibold text-white">4.9</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-display font-semibold text-sm line-clamp-1 text-white group-hover:text-gold transition-colors">
                    {b.shop_name}
                  </h3>
                  <p className="text-[11px] text-white/70 mt-0.5">Master Stylist</p>
                  {b.location && (
                    <div className="flex items-center gap-1 text-[11px] text-white/70 mt-1">
                      <MapPin className="w-3 h-3" />
                      <span className="line-clamp-1">{b.location}</span>
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* Service Details Modal */}
      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="sm:max-w-md border-border bg-card p-0 overflow-hidden">
          <AnimatePresence>
            {selectedService && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="relative h-40 bg-gradient-to-br from-primary/40 via-primary/10 to-gold/30 flex items-center justify-center">
                  <Scissors className="w-16 h-16 text-gold/70" />
                </div>
                <div className="p-6">
                  <DialogHeader className="text-left mb-4">
                    <DialogTitle className="text-2xl font-display gradient-gold-text">
                      {selectedService.name}
                    </DialogTitle>
                    {selectedService.barbers && (
                      <DialogDescription className="text-base text-foreground/80 font-medium">
                        {selectedService.barbers.shop_name}
                      </DialogDescription>
                    )}
                  </DialogHeader>

                  {selectedService.barbers?.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedService.barbers.location}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="glass-panel rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">Price</p>
                      <p className="text-2xl font-display font-bold gradient-gold-text">
                        ₹{selectedService.price}
                      </p>
                    </div>
                    <div className="glass-panel rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Duration
                      </p>
                      <p className="text-2xl font-display font-bold">
                        {selectedService.duration}
                        <span className="text-sm font-normal text-muted-foreground ml-1">min</span>
                      </p>
                    </div>
                  </div>

                  {selectedService.home_service && (
                    <div className="flex items-center gap-2 text-sm text-primary mb-4 bg-primary/10 px-3 py-2 rounded-lg">
                      <Home className="w-4 h-4" />
                      <span>Home service available</span>
                    </div>
                  )}

                  <Button
                    className="w-full h-12 btn-gold font-semibold"
                    disabled={!selectedService.barbers?.id}
                    onClick={handleBookNow}
                  >
                    Book Now
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </div>
  );
}
