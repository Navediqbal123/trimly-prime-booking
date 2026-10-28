import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPinned, Scissors, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShopImageCarousel } from '@/components/ShopImageCarousel';
import type { ShopCardShop } from '@/components/ShopCard';

interface DashboardShop extends ShopCardShop {
  latitude?: number | null;
  longitude?: number | null;
  address?: string;
  locality?: string;
  city?: string;
  village?: string;
  town?: string;
  state?: string;
}

interface DashboardShopCardProps {
  shop: DashboardShop;
  rating: number;
  reviewCount: number;
  gallery: string[];
  animationIndex?: number;
  onVisit: (shopId: string, image: string) => void;
  onOpenProfile: (shopId: string) => void;
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
    .join(', ') || shop.location;

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

export function DashboardShopCard({
  shop,
  rating,
  reviewCount,
  gallery,
  animationIndex = 0,
  onVisit,
  onOpenProfile,
}: DashboardShopCardProps) {
  const displayedImage = useRef(gallery[0] || '');
  const destination = mapUrl(shop);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationIndex * 0.04, duration: 0.3, ease: 'easeOut' }}
      className="overflow-hidden rounded-[24px] border border-orange-100 bg-card p-3 shadow-[0_5px_16px_rgba(80,45,20,0.07)] dark:border-border"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative aspect-[5/3] w-[44%] min-w-[118px] max-w-[190px] shrink-0 overflow-hidden rounded-[18px] bg-orange-50 dark:bg-orange-950/30">
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
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 break-words font-display text-base font-bold leading-tight text-foreground sm:text-lg">
            {shop.shop_name}
          </h3>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs">
            <Star className="h-4 w-4 shrink-0 fill-[#ffc107] text-[#ffc107]" />
            <span className="font-bold text-foreground">{rating.toFixed(1)}</span>
            <span className="truncate text-muted-foreground">
              ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
            </span>
          </div>
          <div className="mt-2 flex min-w-0 items-center gap-2">
            <p className="line-clamp-2 min-w-0 flex-1 break-words text-xs leading-snug text-muted-foreground sm:text-sm">
              {shortLocation(shop)}
            </p>
            {destination && (
              <a
                href={destination}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Open map for ${shop.shop_name}`}
                title="Open map"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-[#e85d00] shadow-[inset_1px_1px_3px_rgba(255,255,255,0.9),0_3px_7px_rgba(194,65,12,0.12)] transition-transform active:scale-95 dark:bg-orange-950/50"
              >
                <MapPinned className="h-4 w-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          onClick={() => onVisit(shop.id, displayedImage.current || gallery[0])}
          className="h-11 rounded-full border-0 bg-gradient-to-b from-[#ff963f] to-[#ff7417] px-3 text-xs font-bold text-white shadow-[inset_2px_2px_4px_rgba(255,255,255,0.30),inset_-2px_-2px_4px_rgba(165,55,0,0.22),0_4px_9px_rgba(205,75,0,0.22)] hover:from-[#ff963f] hover:to-[#ff7417] active:translate-y-px sm:text-sm"
        >
          Visit
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          onClick={() => onOpenProfile(shop.id)}
          className="h-11 rounded-full border-0 bg-gradient-to-b from-[#ff963f] to-[#ff7417] px-2 text-xs font-bold text-white shadow-[inset_2px_2px_4px_rgba(255,255,255,0.30),inset_-2px_-2px_4px_rgba(165,55,0,0.22),0_4px_9px_rgba(205,75,0,0.22)] hover:from-[#ff963f] hover:to-[#ff7417] active:translate-y-px sm:text-sm"
        >
          Barber Profile
        </Button>
      </div>
    </motion.article>
  );
}
