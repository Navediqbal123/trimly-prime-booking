import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Scissors, Loader2, ArrowRight, Sparkles, MapPin, Star } from 'lucide-react';
import { useProtectedUser } from '@/contexts/ProtectedUserContext';
import { Button } from '@/components/ui/button';
import { getApprovedBarbers } from '@/lib/api';
import { shopImage, shopRating } from '@/lib/shopMedia';
import { listAllShopMedia } from '@/lib/shopMediaStore';
import { ShopImageCarousel } from '@/components/ShopImageCarousel';

interface Barber {
  id: string;
  shop_name: string;
  location: string;
}

export default function Dashboard() {
  const { user } = useProtectedUser();
  const navigate = useNavigate();

  const { data: barbers = [], isLoading } = useQuery({
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

  const { data: mediaMap = {} } = useQuery({
    queryKey: ['shopMediaMap'],
    queryFn: listAllShopMedia,
    staleTime: 30_000,
  });

  const scrollToShops = () => {
    document.getElementById('featured-shops')?.scrollIntoView({ behavior: 'smooth' });
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
            onClick={scrollToShops}
            className="btn-gold h-12 px-6 rounded-full font-semibold hover:scale-105 transition-transform"
          >
            Discover Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.section>

      {/* Featured Barber Shops */}
      <section id="featured-shops">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-2xl font-display font-bold">Barber Shops</h2>
            <p className="text-sm text-white/90">Choose a shop to view services</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : barbers.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <Scissors className="w-10 h-10 text-white/90 mx-auto mb-3" />
            <p className="text-white/90 text-sm">No barber shops available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {barbers.map((b, i) => {
              const { rating, reviews } = shopRating(b.id);
              const uploaded = mediaMap[b.id] || [];
              const gallery = uploaded.length > 0 ? uploaded : [shopImage(b.id)];
              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.35, ease: 'easeOut' }}
                  className="bg-white rounded-2xl overflow-hidden text-left border border-black/10 hover:shadow-lg transition-all flex flex-col"
                >
                  <div className="relative h-40 overflow-hidden">
                    <ShopImageCarousel
                      images={gallery}
                      alt={b.shop_name}
                      className="absolute inset-0 w-full h-full"
                    />
                    <div className="absolute top-2 right-2 inline-flex items-center gap-1 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-full z-10">
                      <Star className="w-3 h-3 fill-gold text-gold" />
                      <span className="text-[11px] font-semibold text-white">{rating.toFixed(1)}</span>
                      <span className="text-[10px] text-white/70">({reviews})</span>
                    </div>
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-display font-semibold text-lg mb-1 line-clamp-1 text-black">
                      {b.shop_name}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-black/60 line-clamp-1">
                      <MapPin className="w-3 h-3" /> {b.location}
                    </p>
                    <Button
                      onClick={() => navigate(`/barber/${b.id}`)}
                      className="mt-4 w-full h-11 bg-black text-white hover:bg-black/90 rounded-xl font-medium transition-colors"
                    >
                      Visit
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}


