import { useState, type MouseEvent } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useProtectedUser } from '@/contexts/ProtectedUserContext';
import { getLikedShops, likeShop, unlikeShop } from '@/lib/api';

export const likedShopsQueryKey = (customerId: string | undefined) => [
  'likedShops',
  customerId,
] as const;

export function useLikedShops() {
  const { user } = useProtectedUser();
  const queryClient = useQueryClient();
  const customerId = user.id;
  const [pendingShopIds, setPendingShopIds] = useState<Set<string>>(new Set());

  const likesQuery = useQuery({
    queryKey: likedShopsQueryKey(customerId),
    enabled: Boolean(customerId),
    queryFn: async () => {
      if (!customerId) return [];
      const response = await getLikedShops(customerId);
      if (!response.success) throw new Error(response.error || 'Could not load liked shops.');
      return response.data ?? [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const likedShopIds = new Set(
    (likesQuery.data ?? []).map((shop) => shop.shop_id ?? shop.barber_id ?? shop.id),
  );

  const toggleLike = async (event: MouseEvent<HTMLButtonElement>, shopId: string) => {
    event.stopPropagation();
    if (!customerId || pendingShopIds.has(shopId)) return;

    const wasLiked = likedShopIds.has(shopId);
    const key = likedShopsQueryKey(customerId);
    const previousLikes = queryClient.getQueryData<Awaited<typeof likesQuery.data>>(key) ?? [];

    setPendingShopIds((current) => new Set(current).add(shopId));
    queryClient.setQueryData(key, wasLiked
      ? previousLikes.filter((shop) => (shop.shop_id ?? shop.barber_id ?? shop.id) !== shopId)
      : [...previousLikes, { id: shopId, shop_id: shopId, barber_id: shopId }]);

    const response = wasLiked
      ? await unlikeShop(customerId, shopId)
      : await likeShop(customerId, shopId);

    if (!response.success) {
      queryClient.setQueryData(key, (current: typeof previousLikes | undefined) => {
        const latest = current ?? [];
        const hasShop = latest.some((shop) => (shop.shop_id ?? shop.barber_id ?? shop.id) === shopId);
        if (wasLiked && !hasShop) return [...latest, ...previousLikes.filter((shop) => (shop.shop_id ?? shop.barber_id ?? shop.id) === shopId)];
        if (!wasLiked && hasShop) return latest.filter((shop) => (shop.shop_id ?? shop.barber_id ?? shop.id) !== shopId);
        return latest;
      });
      toast.error(response.error || (wasLiked ? 'Could not remove this shop.' : 'Could not like this shop.'));
    } else {
      toast.success(wasLiked ? 'Shop removed from liked shops.' : 'Shop added to liked shops.');
    }

    setPendingShopIds((current) => {
      const next = new Set(current);
      next.delete(shopId);
      return next;
    });
    await queryClient.invalidateQueries({ queryKey: key });
  };

  return {
    likedShops: likesQuery.data ?? [],
    likedShopIds,
    toggleLike,
    isLoading: likesQuery.isLoading,
    error: likesQuery.error,
    pendingShopIds,
  };
}