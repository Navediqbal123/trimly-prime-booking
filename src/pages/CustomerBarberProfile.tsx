import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  MapPin,
  Menu,
  Scissors,
  Star,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLikedShops } from '@/hooks/useLikedShops';
import { getApprovedBarbers, type ApprovedBarberData } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface BarberAccountDetails {
  avatar_url?: string | null;
  phone?: string | null;
  created_at?: string | null;
}

function getFullAddress(shop: ApprovedBarberData): string {
  return [
    shop.address || shop.location,
    shop.locality,
    shop.city || shop.village || shop.town,
    shop.state,
    shop.pincode || shop.pin_code || shop.postal_code || shop.zip_code,
  ]
    .filter(Boolean)
    .join(', ');
}

function formatCreatedAt(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function CustomerBarberProfile() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { likedShopIds, pendingShopIds, setShopLiked } = useLikedShops();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);
  const [locationExpanded, setLocationExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels'>('posts');

  const {
    data: shop,
    isLoading: shopLoading,
    error: shopError,
  } = useQuery({
    queryKey: ['approvedShopProfile', shopId],
    queryFn: async () => {
      const response = await getApprovedBarbers();
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Could not load this barber profile.');
      }
      return response.data.find((barber) => barber.id === shopId) ?? null;
    },
    enabled: Boolean(shopId),
  });

  const {
    data: account,
    error: accountError,
  } = useQuery<BarberAccountDetails | null>({
    queryKey: ['customerBarberAccount', shop?.user_id],
    queryFn: async () => {
      if (!shop?.user_id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('avatar_url, phone, created_at')
        .eq('id', shop.user_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: Boolean(shop?.user_id),
  });

  const { data: ratings, error: ratingsError } = useQuery<number[]>({
    queryKey: ['customerBarberRatings', shop?.id],
    queryFn: async () => {
      if (!shop) return [];
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('barber_id', shop.id);
      if (error) throw error;
      return (data ?? [])
        .map((review) => Number(review.rating))
        .filter((rating) => Number.isFinite(rating) && rating >= 0);
    },
    enabled: Boolean(shop?.id),
  });

  useEffect(() => {
    if (accountError) {
      console.error('Could not load barber account details:', accountError);
      toast.error('Some barber account details could not be loaded.');
    }
  }, [accountError]);

  useEffect(() => {
    if (ratingsError) {
      console.error('Could not load barber reviews:', ratingsError);
      toast.error('Barber reviews could not be loaded.');
    }
  }, [ratingsError]);

  if (shopLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center text-sm font-medium text-muted-foreground">
        Loading barber profile…
      </div>
    );
  }

  if (shopError || !shop) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Barber profile unavailable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {shopError instanceof Error ? shopError.message : 'This barber could not be found.'}
        </p>
        <Button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-5 rounded-full bg-[#ff7417] text-white hover:bg-[#f5660a]"
        >
          Go back
        </Button>
      </div>
    );
  }

  const profileUrl = `${window.location.origin}/barber/${encodeURIComponent(shop.id)}/profile`;
  const fullAddress = getFullAddress(shop);
  const phone = shop.phone || account?.phone || '';
  const email = shop.user?.email || '';
  const bio = shop.description?.trim() || '';
  const liked = likedShopIds.has(shop.id);
  // The customer likes API has no public per-shop total, so this profile does not display a likes count.
  const likePending = pendingShopIds.has(shop.id);
  const reviewRatings = ratings ?? [];
  const averageRating = reviewRatings.length
    ? reviewRatings.reduce((sum, rating) => sum + rating, 0) / reviewRatings.length
    : null;
  const createdAt = formatCreatedAt(account?.created_at);

  const copyProfileUrl = async () => {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard access is unavailable in this browser.');
      }
      await navigator.clipboard.writeText(profileUrl);
      toast.success('Shop profile URL copied.');
    } catch (error) {
      console.error('Could not copy barber profile URL:', error);
      toast.error('Could not copy the shop profile URL.');
    }
  };

  const shareProfile = async () => {
    setMenuOpen(false);
    if (!navigator.share) {
      await copyProfileUrl();
      return;
    }

    try {
      await navigator.share({ title: shop.shop_name, url: profileUrl });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Could not share barber profile:', error);
      toast.error('Could not share the shop profile.');
    }
  };

  const reportShop = () => {
    setMenuOpen(false);
    window.open('/contact-us.html', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="mx-auto min-h-full w-full max-w-2xl bg-background pb-32 text-foreground">
      <header className="relative mb-6 flex h-12 items-center justify-between">
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(-1)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff963f] to-[#ff7417] text-white shadow-[inset_2px_2px_4px_rgba(255,255,255,0.22),inset_-2px_-3px_5px_rgba(190,65,0,0.18),0_6px_12px_rgba(255,116,23,0.25)] transition-transform active:scale-95"
        >
          <ArrowLeft className="h-6 w-6 stroke-[2.5]" />
        </button>
        <h1 className="absolute left-1/2 max-w-[calc(100%-8rem)] -translate-x-1/2 truncate text-center font-display text-xl font-bold">
          Barber profile
        </h1>
        <div className="relative">
          <button
            type="button"
            aria-label="Open shop menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#ff963f] to-[#ff7417] text-white shadow-[inset_2px_2px_4px_rgba(255,255,255,0.22),inset_-2px_-3px_5px_rgba(190,65,0,0.18),0_6px_12px_rgba(255,116,23,0.25)] transition-transform active:scale-95"
          >
            <Menu className="h-6 w-6" strokeWidth={2.5} />
          </button>
          {menuOpen && (
            <div
              role="menu"
              aria-label="Shop actions"
              className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-52 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setAboutOpen(true);
                }}
                className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium hover:bg-secondary"
              >
                About this account
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!liked || likePending}
                onClick={() => {
                  setMenuOpen(false);
                  if (liked) void setShopLiked(shop.id, false);
                }}
                className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              >
                Unlike
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => void shareProfile()}
                className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium hover:bg-secondary"
              >
                Share shop
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  void copyProfileUrl();
                }}
                className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium hover:bg-secondary"
              >
                Copy URL
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={reportShop}
                className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium hover:bg-secondary"
              >
                Report
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="rounded-[28px] border border-border bg-card p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-orange-100 bg-orange-50 text-[#ff7417] dark:border-orange-950 dark:bg-orange-950/30">
            {account?.avatar_url ? (
              <img
                src={account.avatar_url}
                alt={`${shop.shop_name} profile photo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound aria-hidden="true" className="h-11 w-11" />
            )}
          </div>
          <div className="min-w-0">
            <h2 className="break-words font-display text-2xl font-bold leading-tight">
              {shop.shop_name}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-sm">
              {averageRating !== null ? (
                <>
                  <Star className="h-4 w-4 fill-[#ffc107] text-[#ffc107]" />
                  <span className="font-bold">{averageRating.toFixed(1)}</span>
                  <span className="text-muted-foreground">
                    ({reviewRatings.length} {reviewRatings.length === 1 ? 'review' : 'reviews'})
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  {ratingsError ? 'Reviews unavailable' : 'No reviews yet'}
                </span>
              )}
            </div>
          </div>
        </div>

        {bio && (
          <div className="mt-5">
            <p className={`whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground ${bioExpanded ? '' : 'line-clamp-3'}`}>
              {bio}
            </p>
            {bio.length > 120 && (
              <button
                type="button"
                aria-expanded={bioExpanded}
                onClick={() => setBioExpanded((expanded) => !expanded)}
                className="mt-1 text-sm font-bold text-[#e85d00]"
              >
                {bioExpanded ? 'Less' : 'More'}
              </button>
            )}
          </div>
        )}

        <div className="mt-5 space-y-3 border-t border-border pt-4">
          {fullAddress && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-[#ff7417]" />
              <div className="min-w-0 flex-1">
                <p className={`break-words text-sm leading-6 ${locationExpanded ? '' : 'line-clamp-2'}`}>
                  {fullAddress}
                </p>
                {fullAddress.length > 70 && (
                  <button
                    type="button"
                    aria-expanded={locationExpanded}
                    onClick={() => setLocationExpanded((expanded) => !expanded)}
                    className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-[#e85d00]"
                  >
                    {locationExpanded ? 'Show less' : 'Show full location'}
                    {locationExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {phone && (
            <p className="text-sm">
              <span className="font-semibold">Phone: </span>
              <a className="text-[#e85d00] underline-offset-2 hover:underline" href={`tel:${phone}`}>
                {phone}
              </a>
            </p>
          )}
          {email && (
            <p className="break-all text-sm">
              <span className="font-semibold">Email: </span>
              <a className="text-[#e85d00] underline-offset-2 hover:underline" href={`mailto:${email}`}>
                {email}
              </a>
            </p>
          )}
          {!phone && !email && (
            <p className="text-sm text-muted-foreground">Contact details not provided.</p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div role="tablist" aria-label="Shop content" className="grid grid-cols-2 border-b border-border">
          {(['posts', 'reels'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-4 py-3 text-sm font-bold capitalize transition-colors ${
                activeTab === tab
                  ? 'border-[#ff7417] text-[#e85d00]'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          className="flex min-h-48 flex-col items-center justify-center rounded-b-[24px] border-x border-b border-border bg-card px-6 text-center"
        >
          <Scissors className="mb-3 h-9 w-9 text-[#ff963f]" />
          <h3 className="font-display text-lg font-bold">
            No {activeTab === 'posts' ? 'posts' : 'reels'} yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            {activeTab === 'posts'
              ? 'Shop updates and photos will appear here when available.'
              : 'Barber reels will appear here when available.'}
          </p>
        </div>
      </section>

      <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>About this account</DialogTitle>
            <DialogDescription>{shop.shop_name}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {createdAt
              ? `Account created ${createdAt}.`
              : 'Account creation date is unavailable.'}
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
