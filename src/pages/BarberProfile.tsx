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
import { shopImage, shopRating } from '@/lib/shopMedia';
import { listShopMedia } from '@/lib/shopMediaStore';
import { useState, useEffect, useRef } from 'react';

interface ShopPhotoGalleryProps {
  images: string[];
  initialImage: string | null;
  alt: string;
}

function ShopPhotoGallery({ images, initialImage, alt }: ShopPhotoGalleryProps) {
  const initialIndex = Math.max(0, images.indexOf(initialImage ?? ''));
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [activeIndex, images.length]);

  const goPrevious = () =>
    setActiveIndex((current) => (current - 1 + images.length) % images.length);
  const goNext = () =>
    setActiveIndex((current) => (current + 1) % images.length);

  return (
    <div
      className="relative w-full touch-pan-y overflow-hidden"
      onTouchStart={(event) => {
        const target = event.target;
        if (target instanceof Element && target.closest('button')) {
          touchStart.current = null;
          return;
        }
        const touch = event.touches[0];
        touchStart.current = touch
          ? { x: touch.clientX, y: touch.clientY }
          : null;
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const touch = event.changedTouches[0];
        touchStart.current = null;
        if (!start || !touch || images.length <= 1) return;

        const deltaX = touch.clientX - start.x;
        const deltaY = touch.clientY - start.y;
        if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
          if (deltaX < 0) goNext();
          else goPrevious();
        }
      }}
    >
      <img
        src={images[activeIndex]}
        alt={alt}
        className="block aspect-[16/10] w-full object-cover"
      />

      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1.5">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show shop photo ${index + 1}`}
              aria-current={activeIndex === index ? 'true' : undefined}
              className={`h-2 rounded-full transition-all ${
                activeIndex === index ? 'w-5 bg-white' : 'w-2 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
    enabled: !!shopId,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (selectedIds.length === 0 && services.length > 0) {
      setSelectedIds([services[0].id]);
    }
  }, [services, selectedIds.length]);

  if (loadingShop || loadingServices) {
    return (
      <div className="flex flex-col items-center justify-center bg-background py-20">
        <Loader2 className="mb-3 h-8 w-8 animate-spin text-orange-500" />
        <p className="text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="bg-background py-16 text-center">
        <AlertCircle className="mx-auto mb-4 h-14 w-14 text-orange-400" />
        <h3 className="mb-4 text-xl font-semibold text-foreground">Barber not found</h3>
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
  const uploadedPhotos = Array.from(
    new Set(shopMedia.map((image) => image.trim()).filter(Boolean)),
  );
  const galleryImages =
    uploadedPhotos.length > 0
      ? uploadedPhotos
      : [selectedImage || shopImage(shop.id)];

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
    <div className="min-h-full w-full bg-background text-foreground pb-32">
      {/* Back button */}
      <div className="mb-3 pt-1">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="
            h-11 w-11 rounded-full p-0
            bg-[#ff7417] text-white
            shadow-none
            hover:bg-[#f5660a] hover:text-white
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
          border border-border bg-card
          shadow-none
        "
      >
        <ShopPhotoGallery
          key={`${shop.id}:${galleryImages.join('\u0000')}:${selectedImage ?? ''}`}
          images={galleryImages}
          initialImage={selectedImage}
          alt={shop.shop_name}
        />
      </motion.div>

      {/* Shop name + like */}
      <section className="relative mt-5">
        <div className="pr-20">
          <h1 className="font-display text-[29px] font-bold leading-[1.08] tracking-[-0.8px] text-foreground sm:text-3xl">
            {shop.shop_name}
          </h1>

          {/* Rating */}
          <div className="mt-3 flex min-w-0 flex-nowrap items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                className={cn(
                  'h-5 w-5 shrink-0 sm:h-6 sm:w-6',
                  i <= Math.round(rating)
                    ? 'fill-[#ffc107] text-[#ffc107]'
                    : 'text-muted-foreground',
                )}
              />
            ))}
            <span className="ml-1 shrink-0 text-[18px] font-bold text-foreground sm:text-xl">
              {rating.toFixed(1)}
            </span>
            <span className="shrink-0 whitespace-nowrap text-[12px] font-medium text-muted-foreground sm:text-sm">
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
            rounded-full border-0 bg-[#ff7417]
            shadow-none
            transition-transform duration-200
            active:scale-95
          "
        >
          <Heart
            className={cn(
              'h-9 w-9 transition-all duration-200',
              liked
                ? 'fill-white text-white'
                : 'text-white',
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
          border border-orange-200/70 bg-orange-50 dark:bg-orange-950/25
          shadow-none
        "
      >
        <div className="flex min-w-0 items-center gap-3 px-4 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#ff9a4d] shadow-none">
            <MapPin className="h-6 w-6 text-[#e85d00]" />
          </div>

          <p className="max-h-20 min-w-0 flex-1 overflow-y-auto break-words text-sm font-medium leading-[1.35] text-foreground sm:text-base">
            {fullAddress || 'Address not available'}
          </p>

          <ArrowRight className="h-6 w-6 shrink-0 text-[#e85d00]" />
        </div>
      </motion.section>

      <div className="mt-4">
        <Button
          type="button"
          onClick={() => navigate(`/barber/${shop.id}/profile`)}
          className="h-12 w-full rounded-full border-0 bg-gradient-to-b from-[#ff963f] to-[#ff7417] text-sm font-bold text-white shadow-[inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(154,52,18,0.25),0_6px_14px_rgba(194,65,12,0.28)] hover:from-[#ff963f] hover:to-[#ff7417] active:translate-y-[1px]"
        >
          Visit barber profile
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Services */}
      <section className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-[30px] font-bold leading-none tracking-[-0.8px] text-foreground">
            Services
          </h2>

          <span className="text-[16px] font-bold text-[#ff7417]">
            {services.length > 0 ? `${services.length} available` : ''}
          </span>
        </div>

        {services.length === 0 ? (
          <div
            className="
              rounded-[25px] border border-border bg-card p-8 text-center
              shadow-none
            "
          >
            <Scissors className="mx-auto mb-2 h-9 w-9 text-orange-400" />
            <p className="text-sm font-medium text-muted-foreground">
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
                      bg-card p-3.5 text-left transition-all duration-200
                      shadow-none
                      active:scale-[0.99]
                    `,
                    active
                      ? 'border-orange-200'
                      : 'border-border',
                  )}
                >
                  {/* Service icon */}
                  <div
                    className={cn(
                      'flex h-14 w-14 shrink-0 items-center justify-center rounded-[17px] shadow-none',
                      active ? 'bg-[#fff0e3]' : 'bg-[#f5f7fa]',
                    )}
                  >
                    <Scissors
                      className={cn(
                        'h-5 w-5 shrink-0 sm:h-6 sm:w-6',
                        active ? 'text-[#ff7417]' : 'text-muted-foreground',
                      )}
                    />
                  </div>

                  {/* Service info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 truncate font-display text-[17px] font-bold text-foreground">
                        {s.name}
                      </span>

                      {s.home_service && (
                        <HomeIcon className="h-4 w-4 shrink-0 text-[#ff7417]" />
                      )}
                    </div>

                    <div className="mt-1 flex items-center gap-1 text-sm font-medium text-muted-foreground">
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
                          ? 'border-[#ff7417] bg-[#fff0e3] shadow-none'
                          : 'border-orange-200/70 bg-card',
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
