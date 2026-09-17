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
          SEARCH BAR
      ========================================================= */}
      <div className="mb-4">
        <div
          className="
            flex h-[54px] w-full items-center
            rounded-[22px]
            border border-orange-100
            bg-white
            px-2.5
            shadow-[5px_6px_14px_rgba(0,0,0,0.09),-4px_-4px_11px_rgba(255,255,255,0.95)]
          "
        >
          <div
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-[14px]
              bg-[#fff3e8]
              text-[#ff7417]
              shadow-[3px_4px_7px_rgba(255,116,23,0.12),inset_2px_2px_4px_rgba(255,255,255,0.9)]
            "
          >
            <Search
              className="h-5 w-5"
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
              text-black
              outline-none
              placeholder:text-slate-400
            "
          />

          <div className="mx-1 h-7 w-px bg-slate-200" />

          <button
            type="button"
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-[14px]
              bg-white
              text-slate-600
              shadow-[3px_4px_7px_rgba(0,0,0,0.07)]
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
          mb-7
          h-[165px]
          w-full
          overflow-hidden
          rounded-[25px]
          border border-orange-100
          shadow-[7px_8px_17px_rgba(0,0,0,0.11),-5px_-5px_14px_rgba(255,255,255,0.95)]
        "
        style={{ background: currentBanner.background }}
      >
        {/* Decorative circles */}
        <div className="absolute -right-10 -top-14 h-32 w-32 rounded-full bg-white/30" />
        <div className="absolute -right-3 bottom-[-45px] h-36 w-36 rounded-full bg-[#ff7417]/10" />
        <div className="absolute left-[48%] top-[-25px] h-20 w-20 rounded-full bg-[#ffb56f]/15" />

        {/* Barber decorative shape */}
        <div className="absolute right-[-5px] bottom-[-25px] hidden h-40 w-40 sm:block">
          <div className="absolute bottom-0 right-5 h-28 w-20 rounded-t-[50px] rounded-b-[18px] bg-black/85" />

          <div className="absolute right-9 top-5 h-[72px] w-[72px] rounded-full bg-[#c58b65]" />

          <div className="absolute right-4 top-1 h-11 w-24 rotate-[-8deg] rounded-[50%] bg-[#3b2418]" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5">

          <div>
            <div
              className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-white/70
                px-2.5
                py-1
                shadow-[2px_3px_6px_rgba(0,0,0,0.05)]
              "
            >
              <Sparkles className="h-3 w-3 text-[#ff7417]" />

              <span className="text-[9px] font-bold tracking-wide text-[#a76a3d]">
                {currentBanner.tag}
              </span>
            </div>

            <h2
              className="
                mt-2
                font-display
                text-[25px]
                font-bold
                leading-[0.95]
                tracking-[-0.7px]
                text-black
                sm:text-3xl
              "
            >
              {currentBanner.title}
              <br />

              <span className="text-[#ff7417]">
                {currentBanner.highlight}
              </span>
            </h2>

            <p className="mt-1.5 max-w-[240px] text-[11px] font-medium text-slate-600 sm:text-xs">
              {currentBanner.description}
            </p>
          </div>

          {/* Smaller left-positioned button */}
          <Button
            onClick={handleBookNow}
            className="
              mt-1
              h-8
              w-fit
              self-start
              rounded-full
              border-0
              bg-[#ff7417]
              px-4
              text-[11px]
              font-bold
              text-white
              shadow-[4px_5px_10px_rgba(255,116,23,0.28),inset_2px_2px_4px_rgba(255,255,255,0.28),inset_-2px_-2px_5px_rgba(190,70,0,0.22)]
              hover:bg-[#ff7417]
              active:scale-95
            "
          >
            {currentBanner.button}

            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
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
                uploaded.length > 0
                  ? uploaded
                  : [shopImage(b.id)];

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
                    flex
                    cursor-pointer
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
                        absolute
                        right-3
                        top-3
                        z-10
                        inline-flex
                        items-center
                        gap-1
                        rounded-full
                        bg-black/75
                        px-2.5
                        py-1.5
                        shadow-[2px_3px_6px_rgba(0,0,0,0.18)]
                        backdrop-blur-sm
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