import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Star,
  Clock,
  Home as HomeIcon,
  Scissors,
  Loader2,
  AlertCircle,
  Check,
  ArrowRight,
  Heart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getApprovedBarbers, getBarberServices } from '@/lib/api';
import { shopImage, shopRating, shopDescription } from '@/lib/shopMedia';
import { listShopMedia } from '@/lib/shopMediaStore';
import { useState, useEffect } from 'react';

export default function BarberProfile() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get('service');
  const selectedImage = searchParams.get('image');

  const [selectedIds, setSelectedIds] = useState<string[]>(
    preselected ? preselected.split(',').filter(Boolean) : [],
  );
  const [liked, setLiked] = useState(false);

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

  const { data: shopMedia = [] } = useQuery({
    queryKey: ['shopMedia', shopId],
    queryFn: () => listShopMedia(shopId ?? ''),
    enabled: !!shopId && !selectedImage,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (selectedIds.length === 0 && services.length > 0) {
      setSelectedIds([services[0].id]);
    }
  }, [services, selectedIds.length]);

  if (loadingShop || loadingServices) {
    return (
      <div className="flex flex-col items-center justify-center bg-white py-20">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-orange-500" />
        <p className="text-slate-500">Loading profile…</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="bg-white py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-14 w-14 text-orange-400" />
        <h3 className="mb-4 text-xl font-semibold text-black">Barber not found</h3>
        <Button
          onClick={() => navigate('/discover')}
          className="rounded-full bg-[#ff7417] text-white shadow-[5px_6px_12px_rgba(255,116,23,0.25),inset_1px_1px_3px_rgba(255,255,255,0.3)] hover:bg-[#ff7417]"
        >
          Back to Search
        </Button>
      </div>
    );
  }

  const { rating, reviews } = shopRating(shop.id);
  const description = shopDescription(shop.id);
  const heroImage = selectedImage || shopMedia[0] || shopImage(shop.id);

  const fullAddress = [
    shop.address || shop.location,
    shop.locality,
    shop.city || shop.village || shop.town,
    shop.state,
    shop.pincode || shop.pin_code || shop.postal_code || shop.zip_code,
  ]
    .filter(Boolean)
    .join(', ');

  const chosen = services.filter((s) => selectedIds.includes(s.id));
  const total = chosen.reduce((sum, s) => sum + (Number(s.price) || 0), 0);

  const toggle = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const goBook = () => {
    if (chosen.length === 0) return;
    navigate(`/book/${shop.id}?service=${selectedIds.join(',')}`);
  };

  return (
    <div className="min-h-full w-full bg-white pb-32">
      {/* Back button */}
      <div className="mb-3 pt-1">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="
            h-11 w-11 rounded-full p-0
            bg-white text-black
            shadow-[5px_6px_12px_rgba(0,0,0,0.10),-4px_-4px_9px_rgba(255,255,255,0.95)]
            hover:bg-white hover:text-black
          "
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </div>

      {/* Full-bright shop image */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="
          relative w-full overflow-hidden rounded-[30px]
          border border-orange-100 bg-white
          shadow-[7px_8px_17px_rgba(0,0,0,0.10),-6px_-6px_15px_rgba(255,255,255,0.95)]
        "
      >
        <img
          src={heroImage}
          alt={shop.shop_name}
          className="block aspect-[16/10] w-full object-cover"
        />
      </motion.div>

      {/* Shop name + like */}
      <section className="relative mt-5">
        <div className="pr-20">
          <h1 className="font-display text-[36px] font-bold leading-[1.02] tracking-[-1.4px] text-black sm:text-4xl">
            {shop.shop_name}
          </h1>

          {/* Rating */}
          <div className="mt-3 flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={cn(
                  'h-7 w-7',
                  i <= Math.round(rating)
                    ? 'fill-[#ffc107] text-[#ffc107]'
                    : 'text-slate-400',
                )}
              />
            ))}
            <span className="ml-2 text-[22px] font-bold text-black">
              {rating.toFixed(1)}
            </span>
            <span className="text-[17px] font-medium text-slate-500">
              ({reviews} reviews)
            </span>
          </div>
        </div>

        {/* Like button */}
        <button
          type="button"
          onClick={() => setLiked((prev) => !prev)}
          aria-label={liked ? 'Unlike shop' : 'Like shop'}
          className="
            absolute right-0 top-0 flex h-16 w-16 items-center justify-center
            rounded-full border-0 bg-white
            shadow-[6px_7px_15px_rgba(239,68,68,0.14),-4px_-4px_10px_rgba(255,255,255,0.95)]
            transition-transform duration-200
            active:scale-95
          "
        >
          <Heart
            className={cn(
              'h-9 w-9 transition-all duration-200',
              liked
                ? 'fill-[#e11d48] text-[#e11d48]'
                : 'text-[#e11d48]',
            )}
            strokeWidth={2}
          />
        </button>
      </section>

      {/* Location */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="
          mt-6 w-full rounded-[25px]
          border border-orange-200 bg-[#fff2e4]
          shadow-[6px_7px_15px_rgba(255,116,23,0.16),inset_2px_2px_5px_rgba(255,255,255,0.75),inset_-3px_-3px_7px_rgba(214,93,0,0.10)]
        "
      >
        <div className="flex min-w-0 items-center gap-4 px-5 py-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[#ff9a4d] shadow-[3px_4px_8px_rgba(214,93,0,0.20),inset_1px_1px_3px_rgba(255,255,255,0.45)]">
            <MapPin className="h-7 w-7 text-[#e85d00]" />
          </div>

          <p className="min-w-0 flex-1 break-words text-[17px] font-medium leading-[1.35] text-black sm:text-lg">
            {fullAddress || 'Address not available'}
          </p>

          <ArrowRight className="h-7 w-7 shrink-0 text-[#e85d00]" />
        </div>
      </motion.section>

      {/* About */}
      <section className="mt-8">
        <h2 className="font-display text-[30px] font-bold leading-none tracking-[-0.8px] text-black">
          About
        </h2>
        <p className="mt-3 text-[16px] font-medium leading-[1.55] text-slate-500 sm:text-lg">
          {description}
        </p>
      </section>

      {/* Services */}
      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-[30px] font-bold leading-none tracking-[-0.8px] text-black">
            Services
          </h2>

          <span className="text-[16px] font-bold text-[#ff7417]">
            {services.length > 0 ? `${services.length} available` : ''}
          </span>
        </div>

        {services.length === 0 ? (
          <div
            className="
              rounded-[25px] border border-slate-100 bg-white p-8 text-center
              shadow-[6px_7px_15px_rgba(0,0,0,0.08),-5px_-5px_13px_rgba(255,255,255,0.95)]
            "
          >
            <Scissors className="mx-auto mb-2 h-9 w-9 text-orange-400" />
            <p className="text-sm font-medium text-slate-500">
              No services listed yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {services.map((s, i) => {
              const active = selectedIds.includes(s.id);

              return (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => toggle(s.id)}
                  className={cn(
                    `
                      flex w-full items-center gap-3 rounded-[22px] border
                      bg-white p-3.5 text-left transition-all duration-200
                      shadow-[5px_6px_13px_rgba(0,0,0,0.08),-4px_-4px_10px_rgba(255,255,255,0.95)]
                      active:scale-[0.99]
                    `,
                    active
                      ? 'border-orange-200 shadow-[6px_7px_15px_rgba(255,116,23,0.14),-4px_-4px_10px_rgba(255,255,255,0.95)]'
                      : 'border-slate-100',
                  )}
                >
                  {/* Service icon */}
                  <div
                    className={cn(
                      'flex h-14 w-14 shrink-0 items-center justify-center rounded-[17px] shadow-[3px_4px_8px_rgba(0,0,0,0.08),inset_1px_1px_3px_rgba(255,255,255,0.65)]',
                      active ? 'bg-[#fff0e3]' : 'bg-[#f5f7fa]',
                    )}
                  >
                    <Scissors
                      className={cn(
                        'h-7 w-7',
                        active ? 'text-[#ff7417]' : 'text-slate-500',
                      )}
                    />
                  </div>

                  {/* Service info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 truncate font-display text-[17px] font-bold text-black">
                        {s.name}
                      </span>

                      {s.home_service && (
                        <HomeIcon className="h-4 w-4 shrink-0 text-[#ff7417]" />
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-500">
                      <Clock className="h-4 w-4" />
                      {s.duration} min
                    </div>
                  </div>

                  {/* Price + selection */}
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[19px] font-bold text-[#ff7417]">
                      ₹{s.price}
                    </span>

                    <span
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-[13px] border-2 transition-all',
                        active
                          ? 'border-[#ff7417] bg-[#fff0e3] shadow-[3px_4px_8px_rgba(255,116,23,0.15),inset_1px_1px_3px_rgba(255,255,255,0.7)]'
                          : 'border-orange-200 bg-white',
                      )}
                    >
                      {active ? (
                        <Check className="h-5 w-5 text-[#ff7417]" />
                      ) : (
                        <span className="text-2xl leading-none text-[#ff7417]">
                          +
                        </span>
                      )}
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </section>

      {/* Book selected services */}
      <div className="mt-6">
        <Button
          onClick={goBook}
          disabled={chosen.length === 0}
          className="
            h-12 w-full rounded-full border-0
            bg-[#ff7417] text-sm font-bold text-white
            shadow-[6px_7px_14px_rgba(194,65,12,0.28),inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(154,52,18,0.25)]
            transition-all duration-200
            hover:bg-[#ff7417]
            active:translate-y-[1px]
            disabled:opacity-40
          "
        >
          {chosen.length === 0
            ? 'Select a service'
            : chosen.length === 1
              ? `Book ${chosen[0].name} · ₹${total}`
              : `Book ${chosen.length} services · ₹${total}`}
        </Button>
      </div>
    </div>
  );
}
