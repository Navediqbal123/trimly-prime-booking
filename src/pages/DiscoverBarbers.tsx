import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

import {
  Search,
  Star,
  MapPin,
  Home as HomeIcon,
  Loader2,
  Scissors,
  Award,
  Layers,
  Heart,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

import {
  getApprovedBarbers,
  getNearbyBarbers,
  getBarberServices,
} from '@/lib/api';

import type { NearbyBarberData } from '@/lib/api';

import { shopImage, shopRating } from '@/lib/shopMedia';
import { getCurrentLocation, getLocationErrorMessage } from '@/lib/deviceLocation';


// ==========================================
// FILTER TYPE
// ==========================================

type Filter = 'all' | 'near' | 'top' | 'home';


// ==========================================
// SHOP ROW
// ==========================================

interface ShopRow {
  id: string;
  shop_name: string;
  location: string;
  hasHome: boolean;
}


// ==========================================
// DISCOVER BARBERS
// ==========================================

export default function DiscoverBarbers() {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // Near Me states
  const [nearbyBarbers, setNearbyBarbers] = useState<NearbyBarberData[]>([]);
  const [nearbyLoading, setNearbyLoading] = useState(false);


  // ==========================================
  // LOAD NEARBY BARBERS
  // ==========================================

  const loadNearbyBarbers = async () => {
    try {
      setNearbyLoading(true);

      const { latitude, longitude } = await getCurrentLocation();

      const res = await getNearbyBarbers(
        latitude,
        longitude,
        10
      );

      if (res.success && res.data) {
        setNearbyBarbers(res.data);
      } else {
        setNearbyBarbers([]);

        console.error(
          'Nearby barbers error:',
          res.error
        );
      }
    } catch (error) {
      console.error(
        'Near Me location error:',
        error
      );

      setNearbyBarbers([]);
      toast.error(getLocationErrorMessage(error));
    } finally {
      setNearbyLoading(false);
    }
  };


  // ==========================================
  // APPROVED BARBERS
  // ==========================================

  const {
    data: barbers = [],
    isLoading,
  } = useQuery({
    queryKey: ['approvedBarbersSearch'],

    queryFn: async () => {
      const res = await getApprovedBarbers();

      if (!res.success || !res.data) {
        return [] as {
          id: string;
          shop_name: string;
          location: string;
        }[];
      }

      return res.data.map((b) => ({
        id: b.id,
        shop_name: b.shop_name,
        location: b.location,
      }));
    },
  });


  // ==========================================
  // HOME SERVICE FLAGS
  // ==========================================

  const {
    data: homeServiceIds = new Set<string>(),
  } = useQuery({
    queryKey: [
      'barbersHomeServiceFlags',
      barbers.map((b) => b.id).join(','),
    ],

    enabled: barbers.length > 0,

    queryFn: async () => {
      const results = await Promise.all(
        barbers.map(async (b) => {
          const res = await getBarberServices(b.id);

          const hasHome =
            res.success && res.data
              ? res.data.some(
                  (s) => s.home_service
                )
              : false;

          return [b.id, hasHome] as const;
        })
      );

      return new Set(
        results
          .filter(([, h]) => h)
          .map(([id]) => id)
      );
    },
  });


  // ==========================================
  // NORMAL SHOP ROWS
  // ==========================================

  const rows: ShopRow[] = useMemo(
    () =>
      barbers.map((b) => ({
        ...b,
        hasHome: homeServiceIds.has(b.id),
      })),
    [barbers, homeServiceIds]
  );


  // ==========================================
  // NEARBY SHOP ROWS
  // ==========================================

  const nearbyRows: ShopRow[] = useMemo(
    () =>
      nearbyBarbers.map((b) => ({
        id: b.id,
        shop_name: b.shop_name,
        location: b.location,
        hasHome: homeServiceIds.has(b.id),
      })),
    [nearbyBarbers, homeServiceIds]
  );


  // ==========================================
  // FILTERED RESULTS
  // ==========================================

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    // Near Me uses the GPS/RPC result.
    // Supabase RPC already returns nearest shops first.
    const sourceRows =
      filter === 'near'
        ? nearbyRows
        : rows;

    return sourceRows.filter((b) => {

      // Search
      if (
        q &&
        !b.shop_name
          .toLowerCase()
          .includes(q) &&
        !b.location
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }


      // Top Rated
      if (
        filter === 'top' &&
        shopRating(b.id).rating < 4.7
      ) {
        return false;
      }


      // Home Service
      if (
        filter === 'home' &&
        !b.hasHome
      ) {
        return false;
      }


      return true;
    });
  }, [
    rows,
    nearbyRows,
    query,
    filter,
  ]);


  // ==========================================
  // FILTER CHIPS
  // ==========================================

  const chips: {
    id: Filter;
    label: string;
    icon: React.ComponentType<{
      className?: string;
    }>;
  }[] = [
    {
      id: 'all',
      label: 'All',
      icon: Layers,
    },

    {
      id: 'near',
      label: 'Near Me',
      icon: MapPin,
    },

    {
      id: 'top',
      label: 'Top Rated',
      icon: Award,
    },

    {
      id: 'home',
      label: 'Home Service',
      icon: HomeIcon,
    },
  ];


  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="min-h-screen w-full animate-fade-in bg-background pb-28 pt-1 text-foreground lg:pt-0">

      {/* Header */}
      <div className="mb-3">

        <h1 className="font-display text-[32px] font-bold leading-[1] tracking-[-1.4px] text-foreground sm:text-5xl">
          Find a{' '}
          <span className="text-[#ff7417]">
            Barber
          </span>
        </h1>

        <p className="mt-1.5 text-[14px] font-medium leading-tight text-muted-foreground sm:text-base">
          Discover best barber shops near you
        </p>

      </div>


      {/* Search */}
      <div className="relative mb-3 w-full">

        <div
          className="
            flex h-[54px] w-full items-center
            rounded-[21px]
            border border-border
            bg-card
            p-1.5
            shadow-none
          "
        >

          {/* Search Icon */}
          <div
            className="
              flex h-[41px] w-[41px] shrink-0 items-center justify-center
              rounded-[15px]
              bg-[#ff7417]/10
            "
          >
            <Search className="h-[21px] w-[21px] text-[#ff7417]" />
          </div>


          <Input
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            placeholder="Search barber shops..."
            className="
              h-full
              flex-1
              border-0
              bg-transparent
              px-3
              text-[15px]
              font-medium
              text-foreground
              shadow-none
              outline-none
              placeholder:text-muted-foreground
              focus-visible:border-0
              focus-visible:ring-0
              focus-visible:ring-offset-0
            "
          />


          {/* Filter Icon */}
          <div className="mr-0.5 hidden h-[38px] w-[45px] shrink-0 items-center justify-center border-l border-border pl-1 sm:flex">
            <SlidersHorizontal className="h-[19px] w-[19px] text-[#ff7417]" />
          </div>

        </div>
      </div>


      {/* Filter Chips */}
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {chips.map((c) => {

          const active = filter === c.id;
          const Icon = c.icon;

          return (
            <button
              key={c.id}
              type="button"

              onClick={async () => {

                // Near Me
                if (c.id === 'near') {
                  setFilter('near');
                  await loadNearbyBarbers();
                  return;
                }

                // Existing filters
                setFilter(c.id);
              }}

              className={cn(
                `
                  inline-flex h-[40px]
                  shrink-0
                  items-center
                  justify-center
                  gap-1.5
                  rounded-full
                  border
                  px-3.5
                  text-[13px]
                  font-semibold
                  transition-all
                  duration-200
                  active:scale-[0.97]
                `,

                active
                  ? `
                    border-orange-300
                    bg-[#ff7417]
                    text-white
                    shadow-[5px_6px_12px_rgba(255,116,23,0.28),inset_2px_2px_4px_rgba(255,255,255,0.28),inset_-2px_-2px_5px_rgba(190,70,0,0.22)]
                  `
                  : `
                    border-border
                    bg-secondary
                    text-foreground
                    shadow-none
                  `
              )}
            >

              <Icon
                className={cn(
                  'h-[15px] w-[15px] shrink-0',
                  active
                    ? 'text-white'
                    : 'text-foreground'
                )}
              />

              <span>
                {c.label}
              </span>

            </button>
          );
        })}

      </div>


      {/* Main Loading */}
      {isLoading ? (

        <div className="flex items-center justify-center py-16">

          <div
            className="
              flex h-14 w-14 items-center justify-center
              rounded-[19px]
              bg-card
              shadow-none
            "
          >
            <Loader2 className="h-6 w-6 animate-spin text-[#ff7417]" />
          </div>

        </div>

      ) : filter === 'near' && nearbyLoading ? (

        /* Near Me Loading */

        <div className="flex items-center justify-center py-16">

          <div
            className="
              flex h-14 w-14 items-center justify-center
              rounded-[19px]
              bg-card
              shadow-none
            "
          >
            <Loader2 className="h-6 w-6 animate-spin text-[#ff7417]" />
          </div>

        </div>

      ) : filtered.length === 0 ? (

        /* Empty State */

        <div
          className="
            rounded-[24px]
            border border-border
            bg-card
            p-8
            text-center
            shadow-none
          "
        >

          <div
            className="
              mx-auto mb-3
              flex h-14 w-14 items-center justify-center
              rounded-[19px]
              bg-[#fff1df]
              shadow-[4px_5px_9px_rgba(0,0,0,0.07),inset_2px_2px_4px_rgba(255,255,255,0.9)]
            "
          >
            <Scissors className="h-7 w-7 text-[#ff7417]" />
          </div>

          <p className="text-sm font-semibold text-muted-foreground">
            {filter === 'near'
              ? 'No nearby barbershops found.'
              : 'No barbershops match your search.'}
          </p>

        </div>

      ) : (

        /* Barber Shops */

        <div className="space-y-3">

          {filtered.map((b, i) => {

            const {
              rating,
              reviews,
            } = shopRating(b.id);

            return (

              <motion.div
                key={b.id}

                initial={{
                  opacity: 0,
                  y: 10,
                }}

                animate={{
                  opacity: 1,
                  y: 0,
                }}

                transition={{
                  delay: i * 0.03,
                  duration: 0.25,
                }}

                onClick={() =>
                  navigate(
                    `/barber/${b.id}`
                  )
                }

                className="
                  group
                  flex w-full
                  min-w-0
                  cursor-pointer
                  items-center
                  gap-2.5
                  rounded-[23px]
                  border border-border
                  bg-card
                  p-2
                  text-left
                  shadow-none
                  transition-all
                  duration-200
                  active:scale-[0.995]
                "
              >

                {/* Shop Image */}
                <div
                  className="
                    h-[76px]
                    w-[76px]
                    shrink-0
                    overflow-hidden
                    rounded-[18px]
                    bg-slate-100
                    shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08)]
                  "
                >

                  <img
                    src={shopImage(b.id)}
                    alt={b.shop_name}
                    loading="lazy"
                    className="
                      h-full
                      w-full
                      object-cover
                      transition-transform
                      duration-300
                      group-hover:scale-105
                    "
                  />

                </div>


                {/* Shop Information */}
                <div className="min-w-0 flex-1">

                  <h3 className="truncate pr-1 font-display text-[16px] font-bold leading-tight tracking-[-0.25px] text-foreground">
                    {b.shop_name}
                  </h3>


                  {/* Location */}
                  <div className="mt-1 flex min-w-0 items-center gap-1">

                    <MapPin className="h-[13px] w-[13px] shrink-0 text-[#ff7417]" />

                    <span className="min-w-0 truncate text-[12px] font-medium text-muted-foreground">
                      {b.location}
                    </span>

                  </div>


                  {/* Rating + Home Service */}
                  <div className="mt-1 flex min-w-0 items-center gap-1.5">

                    <Star className="h-[15px] w-[15px] shrink-0 fill-[#ffb300] text-[#ffb300]" />

                    <span className="text-[12px] font-bold text-foreground">
                      {rating.toFixed(1)}
                    </span>

                    <span className="text-[11px] font-medium text-muted-foreground">
                      ({reviews})
                    </span>


                    {b.hasHome && (

                      <span
                        className="
                          ml-0.5
                          inline-flex
                          min-w-0
                          max-w-[100px]
                          items-center
                          gap-1
                          rounded-full
                          bg-[#ff7417]/10
                          px-2
                          py-1
                        "
                      >

                        <HomeIcon className="h-[11px] w-[11px] shrink-0 text-[#ff7417]" />

                        <span className="truncate text-[8px] font-bold uppercase tracking-[0.4px] text-[#ff7417]">
                          Home
                        </span>

                      </span>

                    )}

                  </div>

                </div>


                {/* Right Actions */}
                <div className="flex w-[62px] shrink-0 flex-col items-center justify-between gap-2">

                  {/* Heart */}
                  <div
                    className="
                      flex h-[35px] w-[35px]
                      items-center justify-center
                      rounded-[14px]
                      bg-secondary
                      shadow-none
                    "
                  >

                    <Heart className="h-[18px] w-[18px] text-muted-foreground transition-transform duration-200 group-hover:scale-110" />

                  </div>


                  {/* Visit */}
                  <div
                    className="
                      flex h-[35px] w-full
                      items-center justify-center
                      gap-1
                      rounded-full
                      bg-[#ff7417]
                      px-1.5
                      text-[12px]
                      font-bold
                      text-white
                      shadow-[5px_6px_11px_rgba(255,116,23,0.27),inset_2px_2px_4px_rgba(255,255,255,0.28),inset_-2px_-2px_5px_rgba(190,70,0,0.22)]
                      transition-transform
                      duration-200
                      group-hover:scale-[1.02]
                    "
                  >

                    <span>
                      Visit
                    </span>

                    <ArrowRight className="h-[14px] w-[14px] shrink-0" />

                  </div>

                </div>

              </motion.div>
            );
          })}

        </div>
      )}

    </div>
  );
}
