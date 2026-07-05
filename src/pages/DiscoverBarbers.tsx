import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Star, MapPin, Home as HomeIcon, Loader2, Scissors, Award, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { getApprovedBarbers, getBarberServices } from '@/lib/api';
import { shopImage, shopRating } from '@/lib/shopMedia';

type Filter = 'all' | 'top' | 'home';

interface ShopRow {
  id: string;
  shop_name: string;
  location: string;
  hasHome: boolean;
}

export default function DiscoverBarbers() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const { data: barbers = [], isLoading } = useQuery({
    queryKey: ['approvedBarbersSearch'],
    queryFn: async () => {
      const res = await getApprovedBarbers();
      if (!res.success || !res.data) return [] as { id: string; shop_name: string; location: string }[];
      return res.data.map((b) => ({ id: b.id, shop_name: b.shop_name, location: b.location }));
    },
  });

  const { data: homeServiceIds = new Set<string>() } = useQuery({
    queryKey: ['barbersHomeServiceFlags', barbers.map((b) => b.id).join(',')],
    enabled: barbers.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        barbers.map(async (b) => {
          const res = await getBarberServices(b.id);
          const hasHome = res.success && res.data ? res.data.some((s) => s.home_service) : false;
          return [b.id, hasHome] as const;
        }),
      );
      return new Set(results.filter(([, h]) => h).map(([id]) => id));
    },
  });

  const rows: ShopRow[] = useMemo(
    () => barbers.map((b) => ({ ...b, hasHome: homeServiceIds.has(b.id) })),
    [barbers, homeServiceIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((b) => {
      if (q && !b.shop_name.toLowerCase().includes(q) && !b.location.toLowerCase().includes(q)) return false;
      if (filter === 'top' && shopRating(b.id).rating < 4.7) return false;
      if (filter === 'home' && !b.hasHome) return false;
      return true;
    });
  }, [rows, query, filter]);

  const chips: { id: Filter; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: 'All', icon: Layers },
    { id: 'top', label: 'Top Rated', icon: Award },
    { id: 'home', label: 'Home Service', icon: HomeIcon },
  ];

  return (
    <div className="animate-fade-in pt-4 lg:pt-0">
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-display font-bold mb-1">
          Find a <span className="gradient-gold-text">Barber</span>
        </h1>
        <p className="text-sm text-white/70">Discover premium barbershops near you.</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/80 pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search barber shops…"
          className="h-14 pl-12 pr-4 rounded-2xl bg-[#0d0d0d] border border-gold/40 text-white placeholder:text-white/40 focus-visible:ring-gold/50 focus-visible:border-gold text-base"
        />
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        {chips.map((c) => {
          const active = filter === c.id;
          const Icon = c.icon;
          return (
            <button
              key={c.id}
              onClick={() => setFilter(c.id)}
              className={cn(
                'shrink-0 inline-flex items-center gap-2 px-4 h-10 rounded-full text-sm font-medium border transition-all',
                active
                  ? 'bg-gold text-black border-gold shadow-[0_0_18px_-4px_hsl(var(--gold)/0.7)]'
                  : 'bg-[#0d0d0d] text-white/85 border-gold/25 hover:border-gold/60',
              )}
            >
              <Icon className="w-4 h-4" />
              {c.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gold" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Scissors className="w-10 h-10 text-gold mx-auto mb-3" />
          <p className="text-white/80">No barbershops match your search.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b, i) => {
            const { rating, reviews } = shopRating(b.id);
            return (
              <motion.button
                key={b.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03, duration: 0.3 }}
                onClick={() => navigate(`/barber/${b.id}`)}
                className="w-full text-left rounded-2xl bg-[#0d0d0d] border border-gold/25 hover:border-gold/70 transition-all p-3 flex items-center gap-4 group"
              >
                <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-gold/30">
                  <img
                    src={shopImage(b.id)}
                    alt={b.shop_name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-white truncate">{b.shop_name}</h3>
                  <div className="flex items-center gap-1 text-xs text-white/60 mt-0.5">
                    <MapPin className="w-3 h-3 shrink-0 text-gold" />
                    <span className="truncate">{b.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                    <span className="text-xs font-semibold text-white">{rating.toFixed(1)}</span>
                    <span className="text-[11px] text-white/50">({reviews})</span>
                    {b.hasHome && (
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gold/90">
                        <HomeIcon className="w-3 h-3" /> Home
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
