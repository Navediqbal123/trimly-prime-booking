import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Scissors, Loader2, Clock, Home } from 'lucide-react';
import { useProtectedUser } from '@/contexts/ProtectedUserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { getApprovedBarbers, getPendingBarbers, getBarberServices } from '@/lib/api';

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

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Dashboard() {
  const { user } = useProtectedUser();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedService, setSelectedService] = useState<ServiceWithBarber | null>(null);

  const handleBookNow = () => {
    if (selectedService?.barbers?.id) {
      navigate(`/book/${selectedService.barbers.id}`);
      setSelectedService(null);
    }
  };

  const { data: services = [], isLoading: loading } = useQuery({
    queryKey: ['allServices'],
    queryFn: async (): Promise<ServiceWithBarber[]> => {
      const { data, error } = await supabase
        .from('services')
        .select('id, barber_id, name, price, duration, home_service, barbers(id, shop_name, location)')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Failed to fetch services:', error);
        return [];
      }
      return (data as unknown as ServiceWithBarber[]) ?? [];
    },
  });

  const q = searchQuery.toLowerCase();
  const filteredServices = q
    ? services.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.barbers?.shop_name.toLowerCase().includes(q) ||
          s.barbers?.location.toLowerCase().includes(q),
      )
    : services;

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl lg:text-4xl font-display font-bold mb-2"
        >
          Welcome back, <span className="gradient-text">{user?.full_name?.split(' ')[0] || 'User'}</span>
        </motion.h1>
        <p className="text-muted-foreground">Browse services and book your next appointment.</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search services, shops, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-card border-border"
          />
        </div>
      </motion.div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading services...</p>
        </div>
      )}

      {!loading && (
        <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <motion.div
              key={service.id}
              variants={item}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-card border border-border rounded-2xl overflow-hidden group cursor-pointer hover:border-primary/50 transition-all duration-300 hover:glow-card"
              onClick={() => setSelectedService(service)}
            >
              <div className="relative h-32 overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Scissors className="w-12 h-12 text-primary/40" />
              </div>
              <div className="p-5">
                <h3 className="text-xl font-display font-semibold mb-1 group-hover:text-primary transition-colors">
                  {service.name}
                </h3>
                {service.barbers && (
                  <p className="text-sm font-medium text-foreground/80 mb-2">{service.barbers.shop_name}</p>
                )}
                {service.barbers?.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{service.barbers.location}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-display font-bold gradient-text">₹{service.price}</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{service.duration} min</span>
                  </div>
                </div>
                <Button
                  className="w-full group-hover:glow-primary transition-all"
                  onClick={(e) => { e.stopPropagation(); setSelectedService(service); }}
                >
                  View Details
                </Button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {!loading && filteredServices.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Scissors className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchQuery ? 'No services found matching your search.' : 'No services available yet.'}
          </p>
        </motion.div>
      )}

      <Dialog open={!!selectedService} onOpenChange={(open) => !open && setSelectedService(null)}>
        <DialogContent className="sm:max-w-md border-border bg-card p-0 overflow-hidden">
          <AnimatePresence>
            {selectedService && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <div className="relative h-40 bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center">
                  <Scissors className="w-16 h-16 text-primary/50" />
                </div>
                <div className="p-6">
                  <DialogHeader className="text-left mb-4">
                    <DialogTitle className="text-2xl font-display gradient-text">
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
                    <div className="bg-background/50 border border-border rounded-xl p-4">
                      <p className="text-xs text-muted-foreground mb-1">Price</p>
                      <p className="text-2xl font-display font-bold gradient-text">
                        ₹{selectedService.price}
                      </p>
                    </div>
                    <div className="bg-background/50 border border-border rounded-xl p-4">
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
                    className="w-full h-12 glow-primary"
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