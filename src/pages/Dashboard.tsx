import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Scissors,
  Loader2,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Sparkles,
  Star,
  Home,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getApprovedBarbers, getBarberServices } from '@/lib/api';
import { shopImage } from '@/lib/shopMedia';
import { supabase } from '@/lib/supabase';
import { listAllShopMedia } from '@/lib/shopMediaStore';
import { DashboardShopCard } from '@/components/DashboardShopCard';
import type { ApprovedBarberData } from '@/lib/api';

type ShopFilter = 'all' | 'top-rated' | 'recommended' | 'premium' | 'home-service';
const EMPTY_BARBERS: ApprovedBarberData[] = [];
const EMPTY_SHOP_IDS = new Set<string>();

interface Barber {
  id: string;
  shop_name: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  address?: string;
  locality?: string;
  city?: string;
  village?: string;
  town?: string;
  state?: string;
  pincode?: string;
  pin_code?: string;
  postal_code?: string;
  zip_code?: string;
}

const adBanners = [
  {
    id: 1,
    tag: 'PREMIUM GROOMING',
    title: 'Fresh Style',
    highlight: 'Everyday',
    description: 'Book top-rated barbers near you',
    button: 'Book Now',
    background:
      'linear-gradient(135deg, #dc96dd 0%, #ffe1c4 52%, #ffd0a4 100%)',
  },
  {
    id: 2,
    tag: 'TRIMLY SPECIAL',
    title: 'Look Sharp',
    highlight: 'Feel Better',
    description: 'Discover premium grooming near you',
    button: 'visit Now',
    background:
      'linear-gradient(135deg, #a6c96c 0%, #e4d898 52%, #305570 100%)',
  },
  {
    id: 3,
    tag: 'BARBER PROMOTION',
    title: 'Your Style',
    highlight: 'Your Choice',
    description: 'Find your perfect barber in seconds',
    button: 'Book Now',
    background:
      'linear-gradient(135deg, #fff3e8 0%, #ffe0c5 50%, #ffcda7 100%)',
  },
   {
    id: 4,
    tag: 'EXPERIENCEED BARBERS',
    title: 'CUSTOM STYLR',
    highlight: 'NEW LOOK',
    description: 'Find your  barber in seconds',
    background:
      'linear-gradient(130deg, #e25353 0%, #ffe0c5 50%, #3dc3d4 100%)',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ShopFilter>('all');
  const [activeBanner, setActiveBanner] = useState(0);
  const bannerTouchStart = useRef<{ x: number; y: number } | null>(null);

  const { data: shops, isLoading } = useQuery({
    queryKey: ['approvedBarbersHome'],
    queryFn: async (): Promise<{
      list: ApprovedBarberData[];
      error: string | null;
    }> => {
      const res = await getApprovedBarbers();

      if (!res.success || !res.data) {
        return {
          list: [],
          error: res.error || 'Failed to load shops',
        };
      }

      return {
        list: res.data,
        error: null,
      };
    },
    refetchOnWindowFocus: true,
  });

  const barbers = shops?.list ?? EMPTY_BARBERS;
  const loadError = shops?.error ?? null;

  const { data: homeServiceResults, isLoading: homeServiceLoading } = useQuery({
    queryKey: ['barbersHomeServiceFlags', barbers.map((barber) => barber.id).join(',')],
    enabled: barbers.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        barbers.map(async (barber) => {
          const response = await getBarberServices(barber.id);
          if (!response.success || !response.data) {
            console.error(
              `Could not verify home service availability for shop ${barber.id}:`,
              response.error,
            );
            return { id: barber.id, hasHomeService: false, failed: true };
          }
          return {
            id: barber.id,
            hasHomeService: response.data.some((service) => service.home_service),
            failed: false,
          };
        }),
      );
      return {
        shopIds: new Set(
          results.filter((result) => result.hasHomeService).map((result) => result.id),
        ),
        failedCount: results.filter((result) => result.failed).length,
      };
    },
  });
  const homeServiceIds = homeServiceResults?.shopIds ?? EMPTY_SHOP_IDS;

  const { data: reviews = [] } = useQuery({
    queryKey: ['barberRatings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('barber_id, rating');

      if (error) throw error;

      return data || [];
    },
    staleTime: 30_000,
  });

  const { data: mediaMap = {} } = useQuery({
    queryKey: ['shopMediaMap'],
    queryFn: listAllShopMedia,
    staleTime: 30_000,
  });

  const reviewStats = useMemo(() => {
    const stats = new Map<string, { rating: number; reviewCount: number }>();
    for (const review of reviews) {
      const current = stats.get(review.barber_id) ?? { rating: 0, reviewCount: 0 };
      const value = Number(review.rating);
      if (!Number.isFinite(value)) continue;
      current.rating += value;
      current.reviewCount += 1;
      stats.set(review.barber_id, current);
    }
    for (const [barberId, stat] of stats) {
      stats.set(barberId, {
        ...stat,
        rating: stat.reviewCount ? stat.rating / stat.reviewCount : 0,
      });
    }
    return stats;
  }, [reviews]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % adBanners.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [activeBanner]);

  const currentBanner = adBanners[activeBanner];

  /* Direct barber shop search */
  const filteredBarbers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return barbers;

    return barbers.filter((barber) => {
      return (
        barber.shop_name.toLowerCase().includes(query) ||
        barber.location?.toLowerCase().includes(query) ||
        barber.locality?.toLowerCase().includes(query) ||
        barber.city?.toLowerCase().includes(query) ||
        barber.description?.toLowerCase().includes(query)
      );
    });
  }, [barbers, searchQuery]);

  const displayedBarbers = useMemo(() => {
    const results = filteredBarbers.map((barber, index) => ({
      barber,
      index,
      stats: reviewStats.get(barber.id) ?? { rating: 0, reviewCount: 0 },
    }));

    if (activeFilter === 'home-service') {
      return results.filter(({ barber }) => homeServiceIds.has(barber.id));
    }
    if (activeFilter === 'top-rated') {
      return results.sort((a, b) => b.stats.rating - a.stats.rating || a.index - b.index);
    }
    return results;
  }, [activeFilter, filteredBarbers, homeServiceIds, reviewStats]);

  const openShop = (shopId: string, image: string) => {
    const params = new URLSearchParams({ image });
    navigate(`/barber/${shopId}?${params.toString()}`);
  };

  const openBarberProfile = (shopId: string) => {
    navigate(`/barber/${shopId}/profile`);
  };

  const handleBookNow = () => {
    document
      .getElementById('featured-shops')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const filters: {
    id: Exclude<ShopFilter, 'all'>;
    label: string;
    icon: typeof Star;
    unavailable?: string;
  }[] = [
    { id: 'top-rated', label: 'Top Rated', icon: Star },
    {
      id: 'recommended',
      label: 'Recommended',
      icon: Sparkles,
      unavailable: 'Recommendation data is not available yet.',
    },
    {
      id: 'premium',
      label: 'Premium',
      icon: Crown,
      unavailable: 'Premium status is not available yet.',
    },
    { id: 'home-service', label: 'Home Service', icon: Home },
  ];

  return (
    <div className="min-h-screen w-full animate-fade-in bg-background pb-4 pt-16 text-foreground transition-colors duration-200 lg:pt-0">

      {/* =========================================================
          SEARCH BAR
      ========================================================= */}
      <div className="mb-4">
        <div
          className="
            flex h-[54px] w-full items-center
            rounded-[22px]
            border border-border
            bg-card
            px-2.5
          "
        >
          <div
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-[14px]
              bg-[#ff7417]/10
              text-[#ff7417]
            "
          >
            <Search
              className="h-4 w-4"
              strokeWidth={2.5}
            />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search for barber shops..."
            className="
              min-w-0
              flex-1
              bg-transparent
              px-2.5
              text-sm
              font-medium
              text-foreground
              outline-none
              placeholder:text-muted-foreground
            "
          />

          <div className="mx-1 h-7 w-px bg-border" />

          <button
            type="button"
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-[14px]
              border border-border
              bg-secondary
              text-foreground
              transition-transform
              active:scale-95
            "
            aria-label="Search filters"
          >
            <SlidersHorizontal
              className="h-[18px] w-[18px]"
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>

      {/* =========================================================
          ADVERTISEMENT BANNER
      ========================================================= */}
      <motion.section
        key={currentBanner.id}
        initial={{ opacity: 0.7, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="
          relative
          mb-4
          h-[160px]
          w-full
          touch-pan-y
          overflow-hidden
          rounded-[25px]
          border border-border/60
        "
        style={{ background: currentBanner.background }}
        onTouchStart={(event) => {
          const target = event.target;
          if (target instanceof Element && target.closest('button')) {
            bannerTouchStart.current = null;
            return;
          }
          const touch = event.touches[0];
          bannerTouchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = bannerTouchStart.current;
          const touch = event.changedTouches[0];
          bannerTouchStart.current = null;
          if (!start || !touch) return;

          const deltaX = touch.clientX - start.x;
          const deltaY = touch.clientY - start.y;
          if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
            setActiveBanner(
              (current) =>
                (current + (deltaX < 0 ? 1 : -1) + adBanners.length) %
                adBanners.length,
            );
          }
        }}
      >
        <div className="absolute -right-10 -top-14 h-32 w-32 rounded-full bg-white/10" />

        <div className="absolute -right-3 bottom-[-45px] h-36 w-36 rounded-full bg-[#ff7417]/10" />

        <div className="absolute left-[48%] top-[-25px] h-20 w-20 rounded-full bg-[#ffb56f]/15" />

        <div className="absolute right-[-5px] bottom-[-25px] hidden h-40 w-40 sm:block">
          <div className="absolute bottom-0 right-5 h-28 w-20 rounded-t-[50px] rounded-b-[18px] bg-black/85" />

          <div className="absolute right-9 top-5 h-[72px] w-[72px] rounded-full bg-[#c58b65]" />

          <div className="absolute right-4 top-1 h-11 w-24 rotate-[-8deg] rounded-[50%] bg-[#3b2418]" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-start p-4 pb-8 sm:p-5 sm:pb-8">
          <div>
            <div
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-white/75
                px-2.5
                py-1
              "
            >
              <Sparkles className="h-3 w-3 text-[#ff7417]" />

              <span className="text-[9px] font-bold tracking-wide text-[#a76a3d]">
                {currentBanner.tag}
              </span>
            </div>

            <h2
              className="
                mt-0
                font-display
                text-[25px]
                font-bold
                leading-[0.95]
                tracking-[-0.7px]
                text-[#24152c]
                sm:text-3xl
              "
            >
              {currentBanner.title}
              <br />

              <span className="text-[#ff7417]">
                {currentBanner.highlight}
              </span>
            </h2>

            <p className="mt-1.5 max-w-[240px] text-[11px] font-medium text-[#4b4350] sm:text-xs">
              {currentBanner.description}
            </p>
          </div>

          {/* Book Now - final adjusted position */}
          <Button
            onClick={handleBookNow}
            className="
              mt-0
              h-7
              w-fit
              self-start
              rounded-full
              border-0
              bg-[#ff7417]
              px-3.5
              text-[10px]
              font-bold
              text-white
              hover:bg-[#ff7417]
              active:scale-95
            "
          >
            {currentBanner.button}

            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>

        {/* Banner dots */}
        <div className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          {adBanners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setActiveBanner(index)}
              aria-label={`Show banner ${index + 1}`}
              className={`rounded-full transition-all ${
                activeBanner === index
                  ? 'h-2.5 w-2.5 bg-[#ff7417] shadow-[1px_2px_4px_rgba(255,116,23,0.35)]'
                  : 'h-2 w-2 bg-slate-300'
              }`}
            />
          ))}
        </div>
      </motion.section>

      <div
        role="group"
        aria-label="Filter barber shops"
        className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {filters.map(({ id, label, icon: Icon, unavailable }) => {
          const active = activeFilter === id;
          return (
            <button
              key={id}
              type="button"
              disabled={Boolean(unavailable)}
              aria-pressed={active}
              title={unavailable}
              onClick={() => setActiveFilter(id)}
              className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border-0 px-4 text-xs font-bold text-white shadow-[inset_2px_2px_4px_rgba(255,255,255,0.30),inset_-2px_-2px_4px_rgba(165,55,0,0.22),0_4px_9px_rgba(205,75,0,0.22)] transition-all active:translate-y-px sm:px-5 sm:text-sm ${
                active
                  ? 'bg-gradient-to-b from-[#ff7417] to-[#e85d00] ring-2 ring-[#ff963f]/50 ring-offset-2 ring-offset-background'
                  : 'bg-gradient-to-b from-[#ff963f] to-[#ff7417] hover:brightness-105'
              } disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:brightness-100`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
      {activeFilter === 'home-service' &&
        (homeServiceResults?.failedCount ?? 0) > 0 && (
          <p role="status" className="-mt-3 mb-4 text-xs text-muted-foreground">
            Home service availability could not be verified for{' '}
            {homeServiceResults?.failedCount} shop
            {homeServiceResults?.failedCount === 1 ? '' : 's'}.
          </p>
        )}

      {/* =========================================================
          BARBER SHOPS
      ========================================================= */}
      <section id="featured-shops">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2
              className="
                font-display
                text-[29px]
                font-bold
                leading-none
                tracking-[-1px]
                text-foreground
                sm:text-4xl
              "
            >
              Barber Shops
            </h2>

            <p className="mt-1 text-xs font-medium text-muted-foreground sm:text-sm">
              {searchQuery || activeFilter !== 'all'
                ? `${displayedBarbers.length} shop${
                    displayedBarbers.length === 1 ? '' : 's'
                  } found`
                : 'Choose a shop to view services'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/discover')}
            className="
              flex
              shrink-0
              items-center
              gap-1
              text-sm
              font-bold
              text-[#ff7417]
              sm:text-base
            "
          >
            See All
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-[#ff7417]" />
          </div>
        ) : activeFilter === 'home-service' && homeServiceLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-7 w-7 animate-spin text-[#ff7417]" />
          </div>
        ) : displayedBarbers.length === 0 ? (
          <div
            className="
              rounded-[25px]
              border border-border
              bg-card
              p-8
              text-center
            "
          >
            <Scissors className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />

            <p className="text-sm font-semibold text-muted-foreground">
              {searchQuery || activeFilter !== 'all'
                ? 'No barber shop found.'
                : 'No barber shops available yet.'}
            </p>

            {loadError && (
              <p className="mt-0 break-words text-xs text-red-500">
                {loadError}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayedBarbers.map(({ barber: b, stats }, i) => {
              const uploaded = mediaMap[b.id] || [];

              const gallery =
                uploaded.length > 0
                  ? uploaded
                  : [shopImage(b.id)];

              return (
                <DashboardShopCard
                  key={b.id}
                  shop={b}
                  rating={stats.rating}
                  reviewCount={stats.reviewCount}
                  gallery={gallery}
                  animationIndex={i}
                  onVisit={openShop}
                  onOpenProfile={openBarberProfile}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
} 