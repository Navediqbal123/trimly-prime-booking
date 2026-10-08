import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Heart, Loader2, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShopCard } from '@/components/ShopCard';
import { useLikedShops } from '@/hooks/useLikedShops';
import { getApprovedBarbers } from '@/lib/api';
import { shopImage } from '@/lib/shopMedia';
import { listAllShopMedia } from '@/lib/shopMediaStore';
import { supabase } from '@/lib/supabase';

export default function LikedShops() {
  const navigate = useNavigate();
  const { likedShops, likedShopIds, toggleLike, pendingShopIds, isLoading, error } = useLikedShops();

  // Shares the Dashboard's cache entry, so it must return the same { list, error } shape.
  const { data: approvedShops } = useQuery({
    queryKey: ['approvedBarbersHome'],
    queryFn: async () => {
      const response = await getApprovedBarbers();
      if (!response.success || !response.data) {
        return { list: [], error: response.error || 'Failed to load shops' };
      }
      return {
        list: response.data.map((b) => ({
          id: b.id,
          shop_name: b.shop_name,
          location: b.location,
          latitude: b.latitude,
          longitude: b.longitude,
          description: 'description' in b ? (b as { description?: string | null }).description ?? null : null,
        })),
        error: null,
      };
    },
    refetchOnWindowFocus: true,
  });
  const barbers = Array.isArray(approvedShops?.list) ? approvedShops.list : [];

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
    const approvedById = new Map(barbers.map((barber) => [barber.id, barber]));
    return likedShops.map((liked) => {
      const approved = approvedById.get(liked.shop_id ?? liked.barber_id ?? liked.id);
      const shop = approved ?? liked;
      const id = liked.shop_id ?? liked.barber_id ?? liked.id;
      const shopReviews = reviews.filter((review) => review.barber_id === id);
      const rating = shopReviews.length
        ? shopReviews.reduce((sum, review) => sum + review.rating, 0) / shopReviews.length
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
        gallery: mediaMap[id]?.length ? mediaMap[id] : [shopImage(id)],
      };
    });
  }, [barbers, likedShops, mediaMap, reviews]);

  const openShop = (shopId: string, image: string) => {
    navigate(`/barber/${shopId}?${new URLSearchParams({ image }).toString()}`);
  };

  return (
    <div className="min-h-screen w-full bg-white animate-fade-in pb-4">
      <div className="mb-5 flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Back to dashboard" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-[29px] font-bold leading-none text-black sm:text-4xl">
            Liked Shops <span aria-hidden="true">❤️</span>
          </h1>
          <p className="mt-1 text-xs font-medium text-slate-500 sm:text-sm">
            {likedShops.length} saved {likedShops.length === 1 ? 'shop' : 'shops'}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-7 w-7 animate-spin text-[#ff7417]" />
        </div>
      ) : error ? (
        <div className="rounded-[25px] bg-white p-8 text-center shadow-[6px_7px_16px_rgba(0,0,0,0.08),-5px_-5px_13px_rgba(255,255,255,0.95)]">
          <p className="text-sm font-semibold text-slate-600">Could not load liked shops.</p>
          <p className="mt-1 break-words text-xs text-red-500">{error.message}</p>
        </div>
      ) : likedShopIds.size === 0 ? (
        <div className="rounded-[25px] bg-white p-8 text-center shadow-[6px_7px_16px_rgba(0,0,0,0.08),-5px_-5px_13px_rgba(255,255,255,0.95)]">
          <Heart className="mx-auto mb-3 h-10 w-10 text-slate-300" />
          <p className="text-sm font-semibold text-slate-600">No liked shops yet</p>
          <Button className="mt-4" onClick={() => navigate('/dashboard')}>
            <Scissors className="mr-2 h-4 w-4" /> Explore shops
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {shopRows.map(({ shop, rating, reviewCount, gallery }, index) => (
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
          ))}
        </div>
      )}
    </div>
  );
}