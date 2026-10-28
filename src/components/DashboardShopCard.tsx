import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Heart, MapPin, Scissors, Share2, Star } from 'lucide-react';
import type { MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { ShopImageCarousel } from '@/components/ShopImageCarousel';
import type { ApprovedBarberData } from '@/lib/api';

type DashboardShop = ApprovedBarberData;

interface DashboardShopCardProps {
  shop: DashboardShop;
  rating: number;
  reviewCount: number;
  gallery: string[];
  isLiked: boolean;
  isLikePending?: boolean;
  animationIndex?: number;
  onToggleLike: (event: MouseEvent<HTMLButtonElement>, shopId: string) => void;
  onVisit: (shopId: string, image: string) => void;
  onOpenProfile: (shopId: string) => void;
  onShare: (shopId: string, shopName: string) => void;
}

function mapUrl(shop: DashboardShop): string | null {
  const { latitude, longitude } = shop;
  if (
    typeof latitude === 'number' &&
    Number.isFinite(latitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    typeof longitude === 'number' &&
    Number.isFinite(longitude) &&
    longitude >= -180 &&
    longitude <= 180
  ) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }

  const query = [shop.locality, shop.city || shop.village || shop.town, shop.state]
    .filter(Boolean)
    .join(', ') || shop.location || shop.address;

  return query.trim()
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
}

function shortLocation(shop: DashboardShop): string {
  const locality = [shop.locality, shop.city || shop.village || shop.town, shop.state]
    .filter(Boolean)
    .join(', ');
  return locality || shop.location || shop.address || 'Location unavailable';
}

function fullLocation(shop: DashboardShop): string {
  const primary = shop.address || shop.location;
  const additional = [
    shop.locality,
    shop.city || shop.village || shop.town,
    shop.state,
    shop.pincode || shop.pin_code || shop.postal_code || shop.zip_code,
  ].filter((part) => part && !primary?.toLowerCase().includes(part.toLowerCase()));
  return [primary, ...additional].filter(Boolean).join(', ') || 'Location unavailable';
}

export function DashboardShopCard({
  shop,
  rating,
  reviewCount,
  gallery,
  isLiked,
  isLikePending = false,
  animationIndex = 0,
  onToggleLike,
  onVisit,
  onOpenProfile,
  onShare,
}: DashboardShopCardProps) {
  const displayedImage = useRef(gallery[0] || '');
  const destination = mapUrl(shop);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationIndex * 0.04, duration: 0.3, ease: 'easeOut' }}
      className="w-full rounded-[24px] border border-[#9ab985] bg-white p-3 shadow-[0_5px_16px_rgba(80,45,20,0.07)] dark:bg-card"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="relative h-[112px] w-[min(180px,56vw)] min-w-[150px] shrink-0 overflow-hidden rounded-[16px] bg-orange-50 dark:bg-orange-950/30">
          <ShopImageCarousel
            images={gallery}
            alt={`${shop.shop_name} shop`}
            className="absolute inset-0 h-full w-full"
            onImageChange={(image) => {
              displayedImage.current = image;
            }}
            fallback={
              <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-orange-50 to-orange-100 text-[#e85d00] dark:from-orange-950/40 dark:to-orange-900/30">
                <Scissors aria-hidden="true" className="h-7 w-7" />
                <span className="text-[10px] font-semibold">Photo unavailable</span>
              </div>
            }
          />
          <div className="absolute right-1.5 top-1.5 z-20 inline-flex items-center gap-1 rounded-full border border-[#9ab985] bg-white px-2 py-1 text-[#25351e] shadow-sm">
            <Star className="h-3.5 w-3.5 fill-[#ffc107] text-[#c89000]" />
            <span className="text-[11px] font-bold">{rating.toFixed(1)}</span>
            <span className="text-[10px] font-medium">({reviewCount})</span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-center gap-2">
          <button
            type="button"
            disabled={isLikePending}
            aria-label={isLiked ? `Unlike ${shop.shop_name}` : `Like ${shop.shop_name}`}
            aria-pressed={isLiked}
            onClick={(event) => onToggleLike(event, shop.id)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff963f] to-[#ff7417] text-white shadow-[inset_2px_2px_4px_rgba(255,255,255,0.25),inset_-2px_-2px_4px_rgba(165,55,0,0.22),0_4px_8px_rgba(205,75,0,0.20)] transition-transform active:scale-95 disabled:opacity-60"
          >
            <Heart className="h-5 w-5" fill={isLiked ? 'currentColor' : 'none'} strokeWidth={2.5} />
          </button>
          {destination ? (
            <a
              href={destination}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open map for ${shop.shop_name}`}
              title="Open map"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d6e2cf] bg-[#f7faf4] text-[#e85d00] shadow-[inset_1px_1px_3px_rgba(255,255,255,0.9),0_3px_7px_rgba(40,70,30,0.10)] transition-transform active:scale-95"
            >
              <MapPin className="h-5 w-5" />
            </a>
          ) : (
            <span
              aria-label="Location unavailable"
              title="Location unavailable"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#d6e2cf] bg-[#f7faf4] text-[#e85d00]/45"
            >
              <MapPin className="h-5 w-5" />
            </span>
          )}
          <button
            type="button"
            aria-label={`Share ${shop.shop_name}`}
            onClick={() => onShare(shop.id, shop.shop_name)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#ff963f] to-[#ff7417] text-white shadow-[inset_2px_2px_4px_rgba(255,255,255,0.25),inset_-2px_-2px_4px_rgba(165,55,0,0.22),0_4px_8px_rgba(205,75,0,0.20)] transition-transform active:scale-95"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="mt-3 min-w-0">
        <h3 className="break-words font-display text-base font-bold leading-tight text-foreground sm:text-lg">
          {shop.shop_name}
        </h3>
        <p className="mt-1 break-words text-sm leading-snug text-muted-foreground">
          {fullLocation(shop)}
        </p>
        {shortLocation(shop) !== fullLocation(shop) && (
          <p className="mt-1 text-xs text-muted-foreground">
            Area: {shortLocation(shop)}
          </p>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          onClick={() => onVisit(shop.id, displayedImage.current || gallery[0])}
          className="h-10 rounded-full border-0 bg-gradient-to-b from-[#ff963f] to-[#ff7417] px-3 text-xs font-bold text-white shadow-[inset_2px_2px_4px_rgba(255,255,255,0.30),inset_-2px_-2px_4px_rgba(165,55,0,0.22),0_4px_9px_rgba(205,75,0,0.22)] hover:from-[#ff963f] hover:to-[#ff7417] active:translate-y-px sm:text-sm"
        >
          Visit Shop
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          onClick={() => onOpenProfile(shop.id)}
          className="h-10 rounded-full border-0 bg-gradient-to-b from-[#ff963f] to-[#ff7417] px-2 text-xs font-bold text-white shadow-[inset_2px_2px_4px_rgba(255,255,255,0.30),inset_-2px_-2px_4px_rgba(165,55,0,0.22),0_4px_9px_rgba(205,75,0,0.22)] hover:from-[#ff963f] hover:to-[#ff7417] active:translate-y-px sm:text-sm"
        >
          Barber Profile
        </Button>
      </div>
    </motion.article>
  );
}
