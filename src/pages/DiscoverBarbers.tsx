import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
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

  const { data: homeServiceIds = new Set<string>() } = useQuery({
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
              ? res.data.some((s) => s.home_service)
              : false;

          return [b.id, hasHome] as const;
        }),
      );

      return new Set(
        results
          .filter(([, h]) => h)
          .map(([id]) => id),
      );
    },
  });

  const rows: ShopRow[] = useMemo(
    () =>
      barbers.map((b) => ({
        ...b,
        hasHome: homeServiceIds.has(b.id),
      })),
    [barbers, homeServiceIds],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return rows.filter((b) => {
      if (
        q &&
        !b.shop_name.toLowerCase().includes(q) &&
        !b.location.toLowerCase().includes(q)
      ) {
        return false;
      }

      if (filter === 'top' && shopRating(b.id).rating < 4.7) {
        return false;
      }

      if (filter === 'home' && !b.hasHome) {
        return false;
      }

      return true;
    });
  }, [rows, query, filter]);

  const chips: {
    id: Filter;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    {
      id: 'all',
      label: 'All',
      icon: Layers,
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

  return (
    <div className="min-h-screen w-full animate-fade-in bg-white px-0 pb-28 pt-4 text-black lg:pt-0">
      {/* Header */}
      <div className="mb-5 px-0">
        <h1 className="font-display text-[34px] font-bold leading-[1.05] tracking-[-1.5px] text-[#111111] sm:text-5xl">
          Find a{' '}
          <span className="text-[#ff7417]">
            Barber
          </span>
        </h1>

        <p className="mt-2 text-[15px] font-medium leading-tight text-slate-500 sm:text-base">
          Discover best barber shops near you
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4 w-full">
        <div
          className="
            flex h-[64px] w-full items-center
            rounded-[25px]
            border border-orange-100
            bg-white
            p-2
            shadow-[7px_8px_17px_rgba(0,0,0,0.10),-5px_-5px_14px_rgba(255,255,255,0.95)]
          "
        >
          {/* Search icon clay area */}
          <div
            className="
              flex h-[48px] w-[48px] shrink-0 items-center justify-center
              rounded-[18px]
              bg-[#fff4e8]
              shadow-[inset_2px_2px_5px_rgba(255,255,255,0.9),inset_-3px_-3px_6px_rgba(230,110,20,0.12),3px_4px_8px_rgba(0,0,0,0.06)]
            "
          >
            <Search className="h-6 w-6 text-[#ff7417]" />
          </div>

          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search barber shops..."
            className="
              h-full
              flex-1
              border-0
              bg-transparent
              px-4
              text-[16px]
              font-medium
              text-slate-800
              shadow-none
              outline-none
              placeholder:text-slate-400
              focus-visible:border-0
              focus-visible:ring-0
              focus-visible:ring-offset-0
            "
          />

          {/* Filter icon */}
          <div className="mr-1 hidden h-[46px] w-[52px] shrink-0 items-center justify-center border-l border-slate-200 pl-2 sm:flex">
            <div
              className="
                flex h-[44px] w-[44px] items-center justify-center
                rounded-[16px]
                bg-white
                shadow-[4px_5px_10px_rgba(0,0,0,0.08),-3px_-3px_8px_rgba(255,255,255,0.95)]
              "
            >
              <SlidersHorizontal className="h-5 w-5 text-[#ff7417]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="mb-5 flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((c) => {
          const active = filter === c.id;
          const Icon = c.icon;

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={cn(
                `
                  inline-flex h-[48px]
                  shrink-0 items-center justify-center
                  gap-2
                  rounded-full
                  border
                  px-5
                  text-[15px]
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
                    shadow-[6px_7px_14px_rgba(255,116,23,0.28),inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(190,70,0,0.25)]
                  `
                  : `
                    border-slate-100
                    bg-white
                    text-slate-800
                    shadow-[5px_6px_13px_rgba(0,0,0,0.09),-4px_-4px_10px_rgba(255,255,255,0.95)]
                    hover:shadow-[6px_7px_15px_rgba(0,0,0,0.11),-4px_-4px_10px_rgba(255,255,255,0.95)]
                  `,
              )}
            >
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0',
                  active ? 'text-white' : 'text-slate-800',
                )}
              />

              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div
            className="
              flex h-16 w-16 items-center justify-center
              rounded-[22px]
              bg-white
              shadow-[6px_7px_15px_rgba(0,0,0,0.10),-5px_-5px_12px_rgba(255,255,255,0.95)]
            "
          >
            <Loader2 className="h-7 w-7 animate-spin text-[#ff7417]" />
          </div>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty State */
        <div
          className="
            rounded-[28px]
            border border-orange-100
            bg-white
            p-10
            text-center
            shadow-[7px_8px_17px_rgba(0,0,0,0.09),-5px_-5px_14px_rgba(255,255,255,0.95)]
          "
        >
          <div
            className="
              mx-auto mb-4
              flex h-16 w-16 items-center justify-center
              rounded-[22px]
              bg-[#fff3e7]
              shadow-[4px_5px_10px_rgba(0,0,0,0.08),inset_2px_2px_5px_rgba(255,255,255,0.9)]
            "
          >
            <Scissors className="h-8 w-8 text-[#ff7417]" />
          </div>

          <p className="text-sm font-semibold text-slate-600">
            No barbershops match your search.
          </p>
        </div>
      ) : (
        /* Barber Shops */
        <div className="space-y-4">
          {filtered.map((b, i) => {
            const { rating, reviews } = shopRating(b.id);

            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: i * 0.03,
                  duration: 0.3,
                }}
                onClick={() => navigate(`/barber/${b.id}`)}
                className="
                  group
                  flex w-full cursor-pointer
                  items-center
                  gap-3
                  rounded-[26px]
                  border border-orange-100
                  bg-white
                  p-3
                  text-left
                  transition-all
                  duration-200
                  active:scale-[0.995]
                  shadow-[7px_8px_17px_rgba(0,0,0,0.10),-5px_-5px_14px_rgba(255,255,255,0.95)]
                  hover:shadow-[8px_9px_19px_rgba(0,0,0,0.12),-5px_-5px_14px_rgba(255,255,255,0.95)]
                "
              >
                {/* Shop Image */}
                <div
                  className="
                    relative
                    h-[112px]
                    w-[31%]
                    min-w-[92px]
                    max-w-[250px]
                    shrink-0
                    overflow-hidden
                    rounded-[21px]
                    bg-slate-100
                    shadow-[inset_2px_2px_5px_rgba(0,0,0,0.08)]
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
                <div className="min-w-0 flex-1 self-stretch py-1">
                  <div className="flex h-full min-w-0 flex-col justify-center">
                    <h3 className="pr-1 font-display text-[19px] font-bold leading-tight tracking-[-0.4px] text-[#111111]">
                      {b.shop_name}
                    </h3>

                    {/* Location */}
                    <div className="mt-2 flex min-w-0 items-center gap-1.5">
                      <MapPin className="h-[16px] w-[16px] shrink-0 text-[#ff7417]" />

                      <span className="min-w-0 truncate text-[14px] font-medium text-slate-500">
                        {b.location}
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="mt-2 flex min-w-0 items-center gap-1.5">
                      <Star className="h-[18px] w-[18px] shrink-0 fill-[#ffb300] text-[#ffb300]" />

                      <span className="text-[15px] font-bold text-[#111111]">
                        {rating.toFixed(1)}
                      </span>

                      <span className="text-[13px] font-medium text-slate-500">
                        ({reviews})
                      </span>
                    </div>

                    {/* Home Service */}
                    {b.hasHome && (
                      <div className="mt-2 inline-flex w-fit max-w-full items-center gap-1.5 rounded-full bg-[#fff1e3] px-2.5 py-1 shadow-[2px_3px_7px_rgba(0,0,0,0.06),inset_1px_1px_3px_rgba(255,255,255,0.9)]">
                        <HomeIcon className="h-[14px] w-[14px] shrink-0 text-[#ff7417]" />

                        <span className="truncate text-[10px] font-bold uppercase tracking-wide text-[#ff7417]">
                          Home Service
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex h-full w-[76px] shrink-0 flex-col items-center justify-between gap-3 py-1">
                  {/* Heart */}
                  <div
                    className="
                      flex h-[44px] w-[44px]
                      items-center justify-center
                      rounded-[17px]
                      bg-white
                      shadow-[5px_6px_12px_rgba(0,0,0,0.09),-3px_-3px_9px_rgba(255,255,255,0.95)]
                    "
                  >
                    <Heart
                      className="
                        h-[22px] w-[22px]
                        text-slate-700
                        transition-all
                        duration-200
                        group-hover:scale-110
                      "
                    />
                  </div>

                  {/* Visit */}
                  <div
                    className="
                      flex h-[44px] w-full
                      items-center justify-center
                      gap-1.5
                      rounded-full
                      bg-[#ff7417]
                      px-2
                      text-[14px]
                      font-bold
                      text-white
                      shadow-[6px_7px_14px_rgba(255,116,23,0.28),inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(190,70,0,0.25)]
                      transition-transform
                      duration-200
                      group-hover:scale-[1.02]
                    "
                  >
                    <span>Visit</span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
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