import { useRef } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Heart,
  MapPin,
  MessageCircle,
  Star,
} from 'lucide-react';
import type { MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { ShopImageCarousel } from '@/components/ShopImageCarousel';

export interface ShopCardShop {
  id: string;
  shop_name: string;
  location: string;
  description?: string | null;
}

interface ShopCardProps {
  shop: ShopCardShop;
  rating: number;
  reviewCount: number;
  gallery: string[];
  isLiked: boolean;
  isLikePending?: boolean;
  animationIndex?: number;
  onToggleLike: (event: MouseEvent<HTMLButtonElement>, shopId: string) => void;
  onOpen: (shopId: string, image: string) => void;
}

export function ShopCard({
  shop,
  rating,
  reviewCount,
  gallery,
  isLiked,
  isLikePending = false,
  animationIndex = 0,
  onToggleLike,
  onOpen,
}: ShopCardProps) {
  const displayedImage = useRef(gallery[0] || '');
  const openShop = () => onOpen(shop.id, displayedImage.current || gallery[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: animationIndex * 0.04,
        duration: 0.3,
        ease: 'easeOut',
      }}
      role="button"
      tabIndex={0}
      onClick={openShop}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openShop();
        }
      }}
      className="
        group
        relative
        flex
        w-full
        cursor-pointer
        items-start
        gap-2.5
        overflow-hidden
        rounded-[25px]
        border border-border
        bg-card
        p-2
        text-left
        shadow-none
        transition-all
        hover:-translate-y-0.5
        hover:shadow-none
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-[#ff7417]
      "
    >
      <div
        className="
          absolute left-3 top-1.5 z-20 inline-flex items-center gap-1
          rounded-full bg-black/85 px-2.5 py-1
          shadow-[2px_3px_7px_rgba(0,0,0,0.16)]
        "
      >
        <Star className="h-3 w-3 fill-[#ffc107] text-[#ffc107]" />
        <span className="text-[9px] font-bold text-white">{rating.toFixed(1)}</span>
        <span className="text-[8px] text-white/70">({reviewCount})</span>
      </div>

      <div className="relative mt-7 aspect-[1.7/1] h-auto w-[47%] min-w-0 shrink-0 overflow-hidden rounded-[20px] bg-slate-100 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.06)]">
        <ShopImageCarousel
          images={gallery}
          alt={shop.shop_name}
          className="absolute inset-0 h-full w-full"
          onImageChange={(image) => {
            displayedImage.current = image;
          }}
        />
        <button
          type="button"
          disabled={isLikePending}
          onClick={(event) => onToggleLike(event, shop.id)}
          aria-label={isLiked ? `Unlike ${shop.shop_name}` : `Like ${shop.shop_name}`}
          aria-pressed={isLiked}
          className="absolute right-2 top-2 z-20 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff963f] to-[#ff7417] text-white shadow-[inset_2px_2px_4px_rgba(255,255,255,0.22),inset_-2px_-3px_5px_rgba(190,65,0,0.18),0_6px_12px_rgba(255,116,23,0.25)] transition-transform duration-150 active:scale-95 disabled:cursor-wait disabled:opacity-70"
        >
          <Heart
            className="h-6 w-6"
            fill={isLiked ? 'currentColor' : 'none'}
            strokeWidth={2.5}
          />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 self-stretch flex-col pt-0 pr-1 pb-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="min-w-0 flex-1 truncate font-display text-[16px] font-bold leading-[1.05] tracking-[-0.2px] text-foreground line-clamp-2 break-words">
            {shop.shop_name}
          </h3>
        </div>

        <p className="mt-0.5 flex min-w-0 items-start gap-1 text-[10px] font-medium leading-tigtext-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff7417]" />
          <span className="min-w-0 line-clamp-2 break-words">{shop.location}</span>
        </p>

        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            openShop();
          }}
          className="mt-0.5 flex min-w-0 items-center gap-1.5 text-left text-[10px] font-medium leading-tight text-muted-foreground transition-colors hover:text-[#ff7417]"
        >
          <MessageCircle className="h-3 w-3 shrink-0 text-slate-400" />
          <span className="line-clamp-1">
            {shop.description?.trim() ? `${shop.description.trim()}...` : 'View shop details...'}
          </span>
        </button>

        <Button
          onClick={(event) => {
            event.stopPropagation();
            openShop();
          }}
          className="mt-auto h-7 w-full rounded-full border-0 bg-[#f66b0a] px-2.5 text-[10px] font-bold text-white shadow-[4px_5px_9px_rgba(205,75,0,0.28),inset_2px_2px_4px_rgba(255,255,255,0.30),inset_-2px_-2px_5px_rgba(165,55,0,0.28)] hover:bg-[#f66b0a] active:scale-[0.98]"
        >
          Visit
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </motion.div>
  );
}