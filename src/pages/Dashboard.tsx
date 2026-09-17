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
  MapPin,
  Star,
  Sparkles,
} from 'lucide-react';
import { useProtectedUser } from '@/contexts/ProtectedUserContext';
import { Button } from '@/components/ui/button';
import { getApprovedBarbers } from '@/lib/api';
import { shopImage } from '@/lib/shopMedia';
import { supabase } from '@/lib/supabase';
import { listAllShopMedia } from '@/lib/shopMediaStore';
import { ShopImageCarousel } from '@/components/ShopImageCarousel';

interface Barber {
  id: string;
  shop_name: string;
  location: string;
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
      'linear-gradient(135deg, #fff4e7 0%, #ffe1c4 52%, #ffd0a4 100%)',
  },
  {
    id: 2,
    tag: 'TRIMLY SPECIAL',
    title: 'Look Sharp',
    highlight: 'Feel Better',
    description: 'Discover premium grooming near you',
    button: 'Book Now',
    background:
      'linear-gradient(135deg, #fff7ed 0%, #ffe7d0 52%, #ffd5b5 100%)',
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
];

export default function Dashboard() {
  const { user } = useProtectedUser();
  const navigate = useNavigate();

  const displayedImages = useRef<Record<string, string>>({});

  const [searchQuery, setSearchQuery] = useState('');
  const [activeBanner, setActiveBanner] = useState(0);

  const { data: shops, isLoading } = useQuery({
    queryKey: ['approvedBarbersHome'],
    queryFn: async (): Promise<{
      list: Barber[];
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
        list: res.data.map((b) => ({
          id: b.id,
          shop_name: b.shop_name,
          location: b.location,
        })),
        error: null,
      };
    },
    refetchOnWindowFocus: true,
  });

  const barbers = shops?.list ?? [];
  const loadError = shops?.error ?? null;

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

  /* Auto change advertisement banner */
  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveBanner((current) => (current + 1) % adBanners.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const currentBanner = adBanners[activeBanner];

  /* Direct barber shop search */
  const filteredBarbers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return barbers;

    return barbers.filter((barber) => {
      return (
        barber.shop_name.toLowerCase().includes(query) ||
        barber.location.toLowerCase().includes(query)
      );
    });
  }, [barbers, searchQuery]);

  const openShop = (shopId: string, image: string) => {
    const params = new URLSearchParams({ image });
    navigate(`/barber/${shopId}?${params.toString()}`);
  };

  const handleBookNow = () => {
    document
      .getElementById('featured-shops')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full bg-white animate-fade-in pb-4">
      {/* =========================================================
          TOP HEADER
      ========================================================= */}
      <div className="flex items-center justify-between px-1 pt-1 pb-4">
        <button
          type="button"
          className="
            flex h-12 w-12 items-center justify-center
            rounded-[17px]
            bg-white
            text-black
            shadow-[5px_6px_12px_rgba(0,0,0,0.10),-4px_-4px_10px_rgba(255,255,255,0.95)]
            transition-transform
            active:scale-95
          "
          aria-label="Open menu"
        >
          <span className="flex flex-col gap-1.5">
            <span className="h-[3px] w-7 rounded-full bg-black" />
            <span className="h-[3px] w-7 rounded-full bg-black" />
            <span className="h-[3px] w-7 rounded-full bg-black" />
          </span>
        </button>

        <h1
          className="
            font-display
            text-[38px]
            font-bold
            leading-none
            tracking-[-1.5px]
            text-black
          "
        >
          Trimly
        </h1>

        <button
          type="button"
          onClick={() => navigate('/notifications')}
          className="
            relative
            flex h-12 w-12 items-center justify-center
            rounded-[17px]
            bg-white
            text-black
            shadow-[5px_6px_12px_rgba(0,0,0,0.10),-4px_-4px_10px_rgba(255,255,255,0.95)]
            transition-transform
            active:scale-95
          "
          aria-label="Notifications"
        >
          <div className="relative">
            <svg
              viewBox="0 0 24 24"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 21h4"
              />
            </svg>

            <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full bg-[#ff7417] shadow-[2px_2px_5px_rgba(255,116,23,0.35)]" />
          </div>
        </button>
      </div>

      {/* =========================================================
          SEARCH BAR
      ========================================================= */}
      <div className="mb-4">
        <div
          className="
            flex min-h-[64px] w-full items-center
            rounded-[25px]
            border border-orange-100
            bg-white
            px-3
            shadow-[6px_7px_16px_rgba(0,0,0,0.10),-5px_-5px_14px_rgba(255,255,255,0.95)]
          "
        >
          <div
            className="
              flex h-11 w-11 shrink-0 items-center justify-center
              rounded-[17px]
              bg-[#fff3e8]
              text-[#ff7417]
              shadow-[3px_4px_8px_rgba(255,116,23,0.14),inset_2px_2px_4px_rgba(255,255,255,0.9)]
            "
          >
            <Search className="h-6 w-6" strokeWidth={2.5} />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search for barber shops..."
            className="
              min-w-0 flex-1
              bg-transparent
              px-3
              text-sm
              font-medium
              text-black
              outline-none
              placeholder:text-slate-400
              sm:text-base
            "
          />

          <div className="mx-1 h-9 w-px bg-slate-200" />

          <button
            type="button"
            className="
              flex h-11 w-11 shrink-0 items-center justify-center
              rounded-[17px]
              bg-white
              text-slate-600
              shadow-[3px_4px_8px_rgba(0,0,0,0.08)]
              transition-transform
              active:scale-95
            "
            aria-label="Search filters"
          >
            <SlidersHorizontal className="h-5 w-5" strokeWidth={2.5} />
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
          mb-7
          min-h-[205px]
          w-full
          overflow-hidden
          rounded-[27px]
          border border-orange-100
          shadow-[8px_10px_20px_rgba(0,0,0,0.12),-6px_-6px_16px_rgba(255,255,255,0.95)]
        "
        style={{ background: currentBanner.background }}
      >
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-14 h-36 w-36 rounded-full bg-white/30" />
        <div className="absolute -right-3 bottom-[-50px] h-40 w-40 rounded-full bg-[#ff7417]/10" />
        <div className="absolute left-[48%] top-[-25px] h-24 w-24 rounded-full bg-[#ffb56f]/15" />

        {/* Barber-style decorative silhouette */}
        <div className="absolute right-[-8px] bottom-[-25px] hidden h-44 w-44 sm:block">
          <div className="absolute bottom-0 right-6 h-32 w-24 rounded-t-[55px] rounded-b-[20px] bg-black/85 shadow-[inset_5px_5px_8px_rgba(255,255,255,0.10)]" />
          <div className="absolute right-10 top-5 h-20 w-20 rounded-full bg-[#c58b65] shadow-[inset_5px_5px_8px_rgba(255,255,255,0.25)]" />
          <div className="absolute right-5 top-1 h-12 w-24 rotate-[-8deg] rounded-[50%] bg-[#3b2418]" />
        </div>

        <div className="relative z-10 flex min-h-[205px] flex-col justify-between p-5 sm:p-6">
          <div>
            <div
              className="
                inline-flex items-center gap-1.5
                rounded-full
                bg-white/65
                px-3 py-1
                shadow-[2px_3px_6px_rgba(0,0,0,0.06)]
              "
            >
              <Sparkles className="h-3.5 w-3.5 text-[#ff7417]" />
              <span className="text-[10px] font-bold tracking-wide text-[#a76a3d]">
                {currentBanner.tag}
              </span>
            </div>

            <h2 className="mt-3 font-display text-[29px] font-bold leading-[0.98] tracking-[-0.8px] text-black sm:text-4xl">
              {currentBanner.title}
              <br />
              <span className="text-[#ff7417]">
                {currentBanner.highlight}
              </span>
            </h2>

            <p className="mt-2 max-w-[250px] text-xs font-medium text-slate-600 sm:text-sm">
              {currentBanner.description}
            </p>
          </div>

          <Button
            onClick={handleBookNow}
            className="
              mt-3
              h-10
              w-fit
              rounded-full
              border-0
              bg-[#ff7417]
              px-5
              text-sm
              font-bold
              text-white
              shadow-[5px_6px_12px_rgba(255,116,23,0.30),inset_2px_2px_5px_rgba(255,255,255,0.28),inset_-3px_-3px_6px_rgba(190,70,0,0.22)]
              hover:bg-[#ff7417]
              active:scale-95
            "
          >
            {currentBanner.button}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        {/* Banner dots */}
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-2">
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

      {/* =========================================================
          BARBER SHOPS
      ========================================================= */}
      <section id="featured-shops">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2
              className="
                font-display
                text-[32px]
                font-bold
                leading-none
                tracking-[-1px]
                text-black
                sm:text-4xl
              "
            >
              Barber Shops
            </h2>

            <p className="mt-2 text-xs font-medium text-slate-500 sm:text-sm">
              {searchQuery
                ? `${filteredBarbers.length} shop${
                    filteredBarbers.length === 1 ? '' : 's'
                  } found`
                : 'Choose a shop to view services'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/discover')}
            className="
              flex shrink-0 items-center gap-1
              text-sm font-bold
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
        ) : filteredBarbers.length === 0 ? (
          <div
            className="
              rounded-[25px]
              bg-white
              p-8
              text-center
              shadow-[6px_7px_16px_rgba(0,0,0,0.08),-5px_-5px_13px_rgba(255,255,255,0.95)]
            "
          >
            <Scissors className="mx-auto mb-3 h-10 w-10 text-slate-300" />

            <p className="text-sm font-semibold text-slate-600">
              {searchQuery
                ? 'No barber shop found.'
                : 'No barber shops available yet.'}
            </p>

            {loadError && (
              <p className="mt-2 break-words text-xs text-red-500">
                {loadError}
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBarbers.map((b, i) => {
              const barberReviews = reviews.filter(
                (review) => review.barber_id === b.id
              );

              const reviewCount = barberReviews.length;

              const rating =
                reviewCount > 0
                  ? barberReviews.reduce(
                      (sum, review) => sum + review.rating,
                      0
                    ) / reviewCount
                  : 0;

              const uploaded = mediaMap[b.id] || [];
              const gallery =
                uploaded.length > 0 ? uploaded : [shopImage(b.id)];

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.04,
                    duration: 0.35,
                    ease: 'easeOut',
                  }}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    openShop(
                      b.id,
                      displayedImages.current[b.id] || gallery[0]
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();

                      openShop(
                        b.id,
                        displayedImages.current[b.id] || gallery[0]
                      );
                    }
                  }}
                  className="
                    flex cursor-pointer
                    flex-col
                    overflow-hidden
                    rounded-[25px]
                    border border-orange-100
                    bg-white
                    text-left
                    shadow-[6px_7px_16px_rgba(0,0,0,0.09),-5px_-5px_13px_rgba(255,255,255,0.95)]
                    transition-all
                    hover:-translate-y-0.5
                    hover:shadow-[8px_10px_20px_rgba(0,0,0,0.12),-5px_-5px_13px_rgba(255,255,255,0.95)]
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#ff7417]
                  "
                >
                  <div className="relative h-44 overflow-hidden">
                    <ShopImageCarousel
                      images={gallery}
                      alt={b.shop_name}
                      className="absolute inset-0 h-full w-full"
                      onImageChange={(image) => {
                        displayedImages.current[b.id] = image;
                      }}
                    />

                    <div
                      className="
                        absolute right-3 top-3
                        inline-flex items-center gap-1
                        rounded-full
                        bg-black/75
                        px-2.5 py-1.5
                        backdrop-blur-sm
                        shadow-[2px_3px_6px_rgba(0,0,0,0.18)]
                        z-10
                      "
                    >
                      <Star className="h-3.5 w-3.5 fill-[#ffc107] text-[#ffc107]" />

                      <span className="text-xs font-bold text-white">
                        {rating.toFixed(1)}
                      </span>

                      <span className="text-[10px] text-white/70">
                        ({reviewCount})
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="mb-1 line-clamp-1 font-display text-lg font-bold text-black">
                      {b.shop_name}
                    </h3>

                    <p className="flex items-center gap-1 line-clamp-1 text-xs font-medium text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#ff7417]" />
                      {b.location}
                    </p>

                    <Button
                      onClick={(event) => {
                        event.stopPropagation();

                        openShop(
                          b.id,
                          displayedImages.current[b.id] || gallery[0]
                        );
                      }}
                      className="
                        mt-4
                        h-11
                        w-full
                        rounded-[17px]
                        border-0
                        bg-[#ff7417]
                        font-bold
                        text-white
                        shadow-[5px_6px_12px_rgba(255,116,23,0.25),inset_2px_2px_5px_rgba(255,255,255,0.28),inset_-3px_-3px_6px_rgba(190,70,0,0.20)]
                        hover:bg-[#ff7417]
                        active:scale-[0.98]
                      "
                    >
                      Visit
                      <ArrowRight className="ml-1 h-4 w-4" />
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