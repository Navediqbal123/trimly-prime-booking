import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Scissors, Loader2, Clock, ArrowRight, Sparkles } from 'lucide-react';
import { useProtectedUser } from '@/contexts/ProtectedUserContext';
import { Button } from '@/components/ui/button';
import { getApprovedBarbers, getBarberServices, getMyServices } from '@/lib/api';

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

  const goToBooking = (service: ServiceWithBarber) => {
    if (service.barbers?.id) {
      navigate(`/book/${service.barbers.id}?service=${service.id}`);
    }
  };


  const { data: barbers = [], isLoading: loadingBarbers } = useQuery({
    queryKey: ['approvedBarbersHome'],
    queryFn: async (): Promise<Barber[]> => {
      const res = await getApprovedBarbers();
      if (!res.success || !res.data) return [];
      return res.data.map((b) => ({
        id: b.id,
        shop_name: b.shop_name,
        location: b.location,
      }));
    },
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['allServicesHome', barbers.map((b) => b.id).join(',')],
    queryFn: async (): Promise<ServiceWithBarber[]> => {
      const barberMap = new Map(barbers.map((b) => [b.id, b]));

      // 1) Try the global /api/services endpoint first
      const allRes = await getMyServices();
      let collected: Array<{
        id: string;
        barber_id: string;
        name: string;
        price: number;
        duration: number;
        home_service: boolean;
      }> = [];

      if (allRes.success && Array.isArray(allRes.data) && allRes.data.length > 0) {
        collected = allRes.data;
      } else if (barbers.length > 0) {
        // 2) Fallback: fan out per approved barber
        const results = await Promise.all(
          barbers.map(async (b) => {
            const res = await getBarberServices(b.id);
            return res.success && res.data ? res.data : [];
          }),
        );
        collected = results.flat();
      }

      // Only keep services that belong to an APPROVED barber
      return collected
        .filter((s) => barberMap.has(s.barber_id))
        .map((s) => {
          const b = barberMap.get(s.barber_id)!;
          return {
            id: s.id,
            barber_id: s.barber_id,
            name: s.name,
            price: s.price,
            duration: s.duration,
            home_service: s.home_service,
            barbers: { id: b.id, shop_name: b.shop_name, location: b.location },
          };
        });
    },
  });

  const scrollToServices = () => {
    document.getElementById('featured-services')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="animate-fade-in space-y-10 pt-6 lg:pt-0">
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
            <p className="text-sm text-white/90">Swipe to explore</p>
          </div>
        </div>

        {loadingServices ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : services.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Scissors className="w-10 h-10 text-white/90 mx-auto mb-3" />
            <p className="text-white/90 text-sm">No services available yet.</p>
          </div>
        ) : (
          <div
            className="flex gap-4 overflow-x-auto overflow-y-visible pb-4 pt-2 pl-1 pr-4 snap-x snap-mandatory scrollbar-thin scroll-smooth -mx-1"
            style={{ WebkitOverflowScrolling: 'touch', scrollBehavior: 'smooth' }}
          >
            {services.map((service, i) => (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, duration: 0.35, ease: 'easeOut' }}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => goToBooking(service)}
                className="snap-start shrink-0 w-44 sm:w-52 bg-white rounded-2xl p-4 text-left group border border-black/10 hover:border-black hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 bg-white border border-black/20">
                  <Scissors className="w-6 h-6 text-black" />
                </div>
                <h3 className="font-display font-semibold text-base mb-1 line-clamp-1 text-black">
                  {service.name}
                </h3>
                {service.barbers && (
                  <p className="text-xs text-black/70 line-clamp-1 mb-2">
                    {service.barbers.shop_name}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-display font-bold text-black">₹{service.price}</span>
                  <div className="flex items-center gap-1 text-[11px] text-black/70">
                    <Clock className="w-3 h-3" />
                    {service.duration}m
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* Discover Barbers section intentionally hidden — approved barbers are only visible in admin panel */}
    </div>
  );
}

