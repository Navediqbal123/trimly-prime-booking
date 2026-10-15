import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShopCard } from '@/components/ShopCard';
import { useLikedShops } from '@/hooks/useLikedShops';
import { getApprovedBarbers } from '@/lib/api';
import { shopImage } from '@/lib/shopMedia';
import { listAllShopMedia } from '@/lib/shopMediaStore';
import { supabase } from '@/lib/supabase';

export default function LikedShops() {
  const navigate = useNavigate();

  const {
    likedShops,
    likedShopIds,
    toggleLike,
    pendingShopIds,
    isLoading,
    error,
  } = useLikedShops();

  // Shares the Dashboard's existing query cache.
  const { data: approvedShops } = useQuery({
    queryKey: ['approvedBarbersHome'],
    queryFn: async () => {
      const response = await getApprovedBarbers();

      if (!response.success || !response.data) {
        return {
          list: [],
          error: response.error || 'Failed to load shops',
        };
      }

      return {
        list: response.data.map((b) => ({
          id: b.id,
          shop_name: b.shop_name,
          location: b.location,
          latitude: b.latitude,
          longitude: b.longitude,
          description:
            'description' in b
              ? (b as { description?: string | null }).description ?? null
              : null,
        })),
        error: null,
      };
    },
    refetchOnWindowFocus: true,
  });

  const barbers = Array.isArray(approvedShops?.list)
    ? approvedShops.list
    : [];

  const { data: reviews = [] } = useQuery({
    queryKey: ['barberRatings'],
    queryFn: async () => {
      const { data, error: reviewError } = await supabase
        .from('reviews')
        .select('barber_id, rating');

      if (reviewError) throw reviewError;

      return data ?? [];
    },
    staleTime: 30_000,
  });

  const { data: mediaMap = {} } = useQuery({
    queryKey: ['shopMediaMap'],
    queryFn: listAllShopMedia,
    staleTime: 30_000,
  });

  const shopRows = useMemo(() => {
    const approvedById = new Map(
      barbers.map((barber) => [barber.id, barber])
    );

    return likedShops.map((liked) => {
      const id = liked.shop_id ?? liked.barber_id ?? liked.id;

      const approved = approvedById.get(id);
      const shop = approved ?? liked;

      const shopReviews = reviews.filter(
        (review) => review.barber_id === id
      );

      const rating = shopReviews.length
        ? shopReviews.reduce(
            (sum, review) => sum + review.rating,
            0
          ) / shopReviews.length
        : 0;

      return {
        shop: {
          id,
          shop_name: shop.shop_name ?? 'Shop',
          location: shop.location ?? '',
          description: shop.description ?? null,
        },
        rating,
        reviewCount: shopReviews.length,
        gallery: mediaMap[id]?.length
          ? mediaMap[id]
          : [shopImage(id)],
      };
    });
  }, [barbers, likedShops, mediaMap, reviews]);

  const openShop = (shopId: string, image: string) => {
    navigate(
      `/barber/${shopId}?${new URLSearchParams({ image }).toString()}`
    );
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background px-5 pb-8 pt-5 text-foreground sm:px-8 sm:pt-8">

      {/* Header */}
      <div className="mb-10 flex items-center gap-4 sm:mb-14">

        <button
          type="button"
          aria-label="Back to dashboard"
          onClick={() => navigate('/dashboard')}
          className="
            flex h-12 w-12 shrink-0 items-center justify-center
            rounded-full bg-gradient-to-br from-[#ff963f] to-[#ff7417]
            text-white
            shadow-[inset_2px_2px_4px_rgba(255,255,255,0.22),inset_-2px_-3px_5px_rgba(190,65,0,0.18),0_6px_12px_rgba(255,116,23,0.25)]
            transition-transform duration-150
            active:scale-95
            sm:h-14 sm:w-14
          "
        >
          <ArrowLeft className="h-6 w-6 stroke-[2.5]" />
        </button>

        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-[27px] font-extrabold leading-tight tracking-tight text-foreground sm:text-4xl">
            Liked Shops
            <Heart
              aria-hidden="true"
              className="h-7 w-7 fill-[#ff7417] text-[#ff7417] sm:h-9 sm:w-9"
            />
          </h1>

          <p className="mt-1 text-sm font-medium text-muted-foreground sm:text-base">
            {likedShops.length} saved{' '}
            {likedShops.length === 1 ? 'shop' : 'shops'}
          </p>
        </div>

      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#ff7417]" />
        </div>
      ) : error ? (

        /* Error State */
        <div
          className="
            rounded-[28px] border border-border bg-card p-7 text-center
            shadow-none
          "
        >
          <p className="text-base font-bold text-foreground">
            Could not load liked shops.
          </p>

          <p className="mt-2 break-words text-sm text-red-500">
            {error.message}
          </p>
        </div>

      ) : likedShopIds.size === 0 ? (

        /* Empty State */
        <div className="flex w-full flex-col items-center text-center">

          {/* Simple 3D Heart */}
          <div
            className="
              mb-8 flex h-56 w-56 items-center justify-center
              rounded-full
              border border-border
              bg-secondary
              shadow-[inset_5px_5px_14px_rgba(0,0,0,0.04),inset_-6px_-7px_16px_rgba(255,174,106,0.10),0_12px_30px_rgba(255,116,23,0.08)]
              sm:mb-10 sm:h-64 sm:w-64
            "
          >
            <Heart
              aria-hidden="true"
              className="
                h-28 w-28 fill-[#ff7417] text-[#ff7417]
                drop-shadow-[0_8px_8px_rgba(210,77,0,0.22)]
                sm:h-32 sm:w-32
              "
              strokeWidth={1.2}
            />
          </div>

          {/* Empty State Text */}
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            No liked shops yet
          </h2>

          <p className="mt-3 max-w-sm text-base leading-7 text-muted-foreground sm:text-lg">
            Save your favourite barber shops
            <br className="hidden sm:block" /> to find them here.
          </p>

          {/* Explore Shops Button */}
          <Button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="
              mt-8 h-[60px] w-full max-w-[420px]
              rounded-full border-0
              bg-gradient-to-b from-[#ff963f] via-[#ff801f] to-[#ff7417]
              px-6 text-lg font-bold text-white
              shadow-[inset_0_3px_4px_rgba(255,255,255,0.25),inset_0_-4px_5px_rgba(205,69,0,0.16),0_9px_18px_rgba(255,116,23,0.24)]
              transition-all duration-150
              hover:brightness-[1.03]
              active:scale-[0.98]
              sm:h-16 sm:text-xl
            "
          >
            Explore Shops
          </Button>

        </div>

      ) : (

        /* Liked Shops List — Existing Functionality */
        <div className="flex flex-col gap-4">
          {shopRows.map(
            ({ shop, rating, reviewCount, gallery }, index) => (
              <ShopCard
                key={shop.id}
                shop={shop}
                rating={rating}
                reviewCount={reviewCount}
                gallery={gallery}
                isLiked={likedShopIds.has(shop.id)}
                isLikePending={pendingShopIds.has(shop.id)}
                animationIndex={index}
                onToggleLike={toggleLike}
                onOpen={openShop}
              />
            )
          )}
        </div>

      )}

    </div>
  );
}
