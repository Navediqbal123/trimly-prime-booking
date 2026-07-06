import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Star, Clock, Home as HomeIcon, Scissors, Loader2, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getApprovedBarbers, getBarberServices } from '@/lib/api';
import { shopImage, shopRating, shopDescription } from '@/lib/shopMedia';
import { useState, useEffect } from 'react';

export default function BarberProfile() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('service');
  const [selected, setSelected] = useState<string | null>(preselected);

  const { data: shop, isLoading: loadingShop } = useQuery({
    queryKey: ['approvedShopProfile', shopId],
    queryFn: async () => {
      const res = await getApprovedBarbers();
      if (!res.success || !res.data) return null;
      return res.data.find((b) => b.id === shopId) || null;
    },
    enabled: !!shopId,
  });

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['barberServices', shopId],
    queryFn: async () => {
      const res = await getBarberServices(shopId!);
      return res.success && res.data ? res.data : [];
    },
    enabled: !!shopId,
  });

  useEffect(() => {
    if (!selected && services.length > 0) setSelected(services[0].id);
  }, [services, selected]);

  if (loadingShop || loadingServices) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gold mb-3" />
        <p className="text-white/70">Loading profile…</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="py-16 text-center">
        <AlertCircle className="w-14 h-14 text-gold/60 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-4">Barber not found</h3>
        <Button onClick={() => navigate('/discover')} className="btn-gold">Back to Search</Button>
      </div>
    );
  }

  const { rating, reviews } = shopRating(shop.id);
  const description = shopDescription(shop.id);
  const svc = services.find((s) => s.id === selected);

  const goBook = () => {
    if (!selected) return;
    navigate(`/book/${shop.id}?service=${selected}`);
  };

  return (
    <div className="animate-fade-in pt-2 lg:pt-0 pb-8">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4 -ml-2 text-white/80 hover:text-white hover:bg-white/5"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-gold/30 mb-6"
      >
        <img
          src={shopImage(shop.id)}
          alt={shop.shop_name}
          className="w-full h-56 sm:h-72 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">{shop.shop_name}</h1>
          <div className="flex items-center gap-2 text-sm text-white/85">
            <MapPin className="w-4 h-4 text-gold" />
            <span className="truncate">{shop.location}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={cn('w-4 h-4', i <= Math.round(rating) ? 'fill-gold text-gold' : 'text-white/25')}
              />
            ))}
            <span className="ml-1.5 text-sm font-semibold text-white">{rating.toFixed(1)}</span>
            <span className="text-xs text-white/60">({reviews} reviews)</span>
          </div>
        </div>
      </motion.div>

      {/* Description */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60 mb-2">About</h2>
        <p className="text-sm text-white/80 leading-relaxed">{description}</p>
      </section>

      {/* Services */}
      <section className="mb-8">
        <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60 mb-3">Services</h2>
        {services.length === 0 ? (
          <div className="rounded-2xl p-8 text-center bg-[#0d0d0d] border border-gold/20">
            <Scissors className="w-9 h-9 text-gold/60 mx-auto mb-2" />
            <p className="text-sm text-white/60">No services listed yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {services.map((s, i) => {
              const active = selected === s.id;
              return (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setSelected(s.id)}
                  className={cn(
                    'w-full text-left rounded-2xl p-4 border-2 transition-all flex items-center justify-between gap-4 bg-white text-black',
                    active
                      ? 'border-gold shadow-[0_0_20px_-6px_hsl(var(--gold)/0.6)]'
                      : 'border-black/10 hover:border-gold/60',
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-black truncate">{s.name}</span>
                      {s.home_service && <HomeIcon className="w-3.5 h-3.5 text-gold shrink-0" />}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-black/60 mt-1">
                      <Clock className="w-3 h-3" /> {s.duration} min
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-lg font-bold text-black">₹{s.price}</span>
                    {active && (
                      <span className="w-6 h-6 rounded-full bg-gold flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-black" />
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>

      <Button
        onClick={goBook}
        disabled={!svc}
        className="w-full h-14 btn-gold font-semibold text-base rounded-xl disabled:opacity-40 shadow-[0_8px_30px_-8px_hsl(var(--gold)/0.6)]"
      >
        {svc ? <>Book {svc.name} · ₹{svc.price}</> : 'Select a service'}
      </Button>
    </div>
  );
}
