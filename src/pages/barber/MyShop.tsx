import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Camera,
  Heart,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  Menu,
  Phone,
  Plus,
  Scissors,
  Star,
  Store,
  Trash2,
  UserRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';
import { useProtectedUser } from '@/contexts/ProtectedUserContext';
import {
  deleteMyShop,
  getMyBarberProfile,
  getMyServices,
  updateMyShop,
  type BarberProfileData,
} from '@/lib/api';
import {
  deleteShopImage,
  listShopMedia,
  uploadShopImage,
} from '@/lib/shopMediaStore';
import { pickNativeImages } from '@/lib/nativeImagePicker';
import { supabase } from '@/lib/supabase';

const MAX_IMAGES = 5;
const orangeButton =
  'flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#ff7417] px-4 py-3 text-left text-sm font-semibold text-white transition-colors hover:bg-[#ed650c]';
const menuButton =
  'relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#ff963f] to-[#ff7417] text-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.35),inset_0_-3px_4px_rgba(190,65,0,0.18),0_5px_10px_rgba(255,116,23,0.20)] transition-transform duration-150 active:scale-95 hover:bg-gradient-to-b hover:from-[#ff963f] hover:to-[#ff7417] hover:text-white';

interface ShopProfile extends BarberProfileData {
  description?: string;
  phone?: string;
}

interface ShopPhotoGalleryProps {
  images: string[];
  canAddPhoto: boolean;
  uploading: boolean;
  onAddPhoto: () => void;
}

function ShopPhotoGallery({
  images,
  canAddPhoto,
  uploading,
  onAddPhoto,
}: ShopPhotoGalleryProps) {
  const slideCount = images.length + (canAddPhoto ? 1 : 0);
  const [activeIndex, setActiveIndex] = useState(0);
  const pointerStart = useRef<{ x: number; y: number; id: number } | null>(null);
  const suppressAddClick = useRef(false);
  const suppressClickTimer = useRef<number | null>(null);

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, slideCount - 1)));
  }, [slideCount]);

  useEffect(
    () => () => {
      if (suppressClickTimer.current !== null) {
        window.clearTimeout(suppressClickTimer.current);
      }
    },
    [],
  );

  const move = (direction: number) => {
    setActiveIndex((current) => (current + direction + slideCount) % slideCount);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof Element && target.closest('[data-gallery-indicator]')) {
      pointerStart.current = null;
      return;
    }
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointerStart.current = {
      x: event.clientX,
      y: event.clientY,
      id: event.pointerId,
    };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    pointerStart.current = null;
    if (!start || event.pointerId !== start.id || slideCount <= 1) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) <= 50 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    suppressAddClick.current = true;
    if (suppressClickTimer.current !== null) {
      window.clearTimeout(suppressClickTimer.current);
    }
    suppressClickTimer.current = window.setTimeout(() => {
      suppressAddClick.current = false;
      suppressClickTimer.current = null;
    }, 400);
    move(deltaX < 0 ? 1 : -1);
  };

  return (
    <div
      className="relative aspect-[4/3] w-full touch-pan-y overflow-hidden rounded-[28px] border border-border bg-card"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
    >
      {activeIndex < images.length ? (
        <motion.img
          key={images[activeIndex]}
          src={images[activeIndex]}
          alt={`Shop photo ${activeIndex + 1}`}
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <motion.button
          key="add-photo-slide"
          type="button"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.22 }}
          onClick={() => {
            if (suppressAddClick.current) return;
            onAddPhoto();
          }}
          disabled={uploading}
          className="absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-3 bg-orange-50 text-[#ff7417] transition-colors hover:bg-orange-100 disabled:opacity-70 dark:bg-orange-950/20 dark:hover:bg-orange-950/35"
          aria-label="Add shop photo"
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm dark:bg-card">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <Plus className="h-9 w-9" />
            )}
          </span>
          <span className="text-sm font-semibold">
            {uploading ? 'Uploading photo…' : 'Add shop photo'}
          </span>
        </motion.button>
      )}

      {slideCount > 1 && (
        <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-2.5 py-1.5">
          {Array.from({ length: slideCount }, (_, index) => (
            <button
              key={index}
              type="button"
              data-gallery-indicator
              aria-label={`Show gallery item ${index + 1}`}
              aria-current={index === activeIndex ? 'true' : undefined}
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === activeIndex ? 'w-5 bg-white' : 'w-2 bg-white/65'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MyShop() {
  const navigate = useNavigate();
  const { user } = useProtectedUser();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profile, setProfile] = useState<ShopProfile | null>(null);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [accountPhone, setAccountPhone] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const [addActionsOpen, setAddActionsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    shopName: '',
    location: '',
    description: '',
    phone: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<HTMLInputElement>(null);
  const uploadLock = useRef(false);
  const avatarUploadLock = useRef(false);

  const servicesQuery = useQuery({
    queryKey: ['myServices'],
    queryFn: async () => {
      const response = await getMyServices();
      if (!response.success) {
        throw new Error(response.error || 'Could not load services.');
      }
      return response.data ?? [];
    },
    enabled: Boolean(profile),
  });

  const reviewsQuery = useQuery({
    queryKey: ['myShopReviews', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('barber_id', profile?.id ?? '');
      if (error) throw error;
      return (data ?? [])
        .map((review) =>
          review.rating === null || review.rating === undefined
            ? Number.NaN
            : Number(review.rating),
        )
        .filter((rating) => Number.isFinite(rating));
    },
    enabled: Boolean(profile?.id),
  });

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await getMyBarberProfile();
        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to load shop profile.');
        }

        const shop = response.data as ShopProfile;
        const [media, accountResult] = await Promise.all([
          listShopMedia(shop.id),
          user.id
            ? supabase
                .from('profiles')
                .select('avatar_url, phone')
                .eq('id', user.id)
                .maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);
        if (!mounted) return;

        setProfile(shop);
        setImages(Array.from(new Set(media.map((url) => url.trim()).filter(Boolean))));
        setFormData({
          shopName: shop.shop_name || '',
          location: shop.location || '',
          description: shop.description || '',
          phone: shop.phone || accountResult.data?.phone || '',
        });
        setProfilePhoto(accountResult.data?.avatar_url || '');
        setAccountPhone(accountResult.data?.phone || '');
        if (accountResult.error) {
          console.error('Could not load barber profile details:', accountResult.error);
          toast.error('Some profile details could not be loaded.');
        }
      } catch (error) {
        if (!mounted) return;
        const message =
          error instanceof Error ? error.message : 'Failed to load shop profile.';
        setLoadError(message);
        toast.error(message);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadProfile();
    return () => {
      mounted = false;
    };
  }, [user.id]);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0 || !profile || uploadLock.current) return;

    const slots = MAX_IMAGES - images.length;
    if (slots <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} photos allowed`);
      return;
    }

    const toUpload = files.slice(0, slots);
    uploadLock.current = true;
    setUploading(true);
    try {
      let uploadedCount = 0;
      for (let index = 0; index < toUpload.length; index += 1) {
        const url = await uploadShopImage(
          profile.id,
          toUpload[index],
          images.length + index,
        );
        uploadedCount += 1;
        setImages((current) => (current.includes(url) ? current : [...current, url]));
      }
      toast.success(`${uploadedCount} photo(s) uploaded`);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Upload failed. Ensure the shop-images bucket exists.',
      );
    } finally {
      uploadLock.current = false;
      setUploading(false);
    }
  };

  const openShopImagePicker = async () => {
    if (uploadLock.current) return;
    const slots = MAX_IMAGES - images.length;
    if (slots <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} photos allowed`);
      return;
    }
    if (!Capacitor.isNativePlatform()) {
      fileRef.current?.click();
      return;
    }

    try {
      const selected = await pickNativeImages({ allowMultiple: true, limit: slots });
      await handleFiles(selected.map(({ file }) => file));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not open camera or photo gallery.',
      );
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    void handleFiles(files);
  };

  const handleDeletePhoto = async (url: string) => {
    if (!profile) return;
    try {
      await deleteShopImage(profile.id, url);
      setImages((current) => current.filter((image) => image !== url));
      toast.success('Photo removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to remove photo.');
    }
  };

  const handleAvatarFile = async (file?: File) => {
    if (!file || !user.id || avatarUploadLock.current) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }
    avatarUploadLock.current = true;
    setAvatarUploading(true);
    try {
      const extension = file.name.split('.').pop() || 'jpg';
      const path = `${user.id}/${Date.now()}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);

      const { data: publicData } = supabase.storage.from('avatar').getPublicUrl(path);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicData.publicUrl })
        .eq('id', user.id);
      if (updateError) throw new Error(updateError.message);

      setProfilePhoto(publicData.publicUrl);
      toast.success('Profile photo updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update profile photo.');
    } finally {
      avatarUploadLock.current = false;
      setAvatarUploading(false);
    }
  };

  const openAvatarPicker = async () => {
    if (avatarUploadLock.current) return;
    if (!Capacitor.isNativePlatform()) {
      avatarFileRef.current?.click();
      return;
    }
    try {
      const [selected] = await pickNativeImages();
      if (selected) await handleAvatarFile(selected.file);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Could not open camera or photo gallery.',
      );
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSaveShop = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await updateMyShop({
        shop_name: formData.shopName.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
        phone: formData.phone.trim(),
      });
      if (!response.success) {
        toast.error(response.error || 'Failed to update shop details.');
        return;
      }
      if (profile) {
        setProfile({
          ...profile,
          shop_name: formData.shopName.trim(),
          location: formData.location.trim(),
          description: formData.description.trim(),
          phone: formData.phone.trim(),
        });
      }
      toast.success('Shop details updated successfully');
      setEditOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update shop details.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShop = async () => {
    setDeleting(true);
    try {
      const result = await deleteMyShop();
      if (!result.success) {
        toast.error(result.error || 'Failed to delete shop.');
        return;
      }
      toast.success('Shop permanently deleted.');
      setShowDeleteConfirm(false);
      window.location.href = '/dashboard';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete shop.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center">
        <Loader2 className="mb-3 h-7 w-7 animate-spin text-[#ff7417]" />
        <p className="text-sm text-muted-foreground">Loading shop details…</p>
      </div>
    );
  }

  if (loadError || !profile) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-6 text-center">
        <Store className="mx-auto mb-3 h-8 w-8 text-[#ff7417]" />
        <p className="font-semibold">Shop details unavailable</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {loadError || 'Your shop profile could not be loaded.'}
        </p>
      </div>
    );
  }

  const displayName = user.full_name?.trim() || 'Barber';
  const primaryPhone = formData.phone.trim() || accountPhone.trim();
  const email = user.email?.trim() || '';
  const contactHref = primaryPhone
    ? `tel:${primaryPhone.replace(/[^\d+]/g, '')}`
    : email
      ? `mailto:${email}`
      : undefined;
  const ratings = reviewsQuery.data ?? [];
  const averageRating =
    ratings.length > 0
      ? (ratings.reduce((total, rating) => total + rating, 0) / ratings.length).toFixed(1)
      : null;

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 pb-8 text-foreground">
      <header className="relative flex min-h-[72px] items-center justify-between gap-3 border-b border-border bg-background px-1 pb-3 pt-1">
        <Button
          type="button"
          onClick={() => setAddActionsOpen(true)}
          aria-label="Add service or shop photo"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-[#ff963f] to-[#ff7417] p-0 text-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.35),0_5px_10px_rgba(255,116,23,0.20)] hover:bg-[#ff7417] hover:text-white"
        >
          <Plus className="h-6 w-6" strokeWidth={2.5} />
        </Button>

        <h1 className="absolute left-1/2 max-w-[calc(100%-8rem)] -translate-x-1/2 truncate text-center text-[clamp(1.125rem,4.5vw,1.5rem)] font-bold text-foreground">
          {displayName}
        </h1>

        <div className="relative z-20">
          <button
            type="button"
            className={menuButton}
            aria-label="Open shop menu"
            aria-expanded={shopMenuOpen}
            onClick={() => setShopMenuOpen((open) => !open)}
          >
            <Menu className="h-6 w-6" strokeWidth={2.5} />
          </button>
          {shopMenuOpen && (
            <div
              role="menu"
              aria-label="Shop actions"
              className="absolute right-0 top-[calc(100%+0.5rem)] w-48 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShopMenuOpen(false);
                  setEditOpen(true);
                }}
                className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium hover:bg-secondary"
              >
                <Store className="mr-2 h-4 w-4 text-[#ff7417]" />
                Edit Shop
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setShopMenuOpen(false);
                  setShowDeleteConfirm(true);
                }}
                className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-destructive hover:bg-secondary"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Shop
              </button>
            </div>
          )}
        </div>
      </header>

      <section className="flex items-center gap-3 sm:gap-5">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-orange-100 bg-orange-50 sm:h-28 sm:w-28 dark:border-orange-950 dark:bg-orange-950/30">
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt={`${displayName} profile`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[#ff7417]">
              <UserRound className="h-11 w-11" />
            </div>
          )}
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-3 gap-2">
          <StatCard
            icon={<Scissors className="h-4 w-4" />}
            value={
              servicesQuery.isLoading
                ? '…'
                : servicesQuery.isError
                  ? 'Unavailable'
                  : String(servicesQuery.data?.length ?? 0)
            }
            detail="Services"
          />
          <StatCard
            icon={<Heart className="h-4 w-4 fill-current" />}
            value="—"
            detail="Likes"
            title="The current API does not expose a shop's received-like count."
          />
          <StatCard
            icon={<Star className="h-4 w-4 fill-current" />}
            value={
              reviewsQuery.isLoading
                ? '…'
                : reviewsQuery.isError
                  ? 'Unavailable'
                  : averageRating ?? 'No ratings'
            }
            detail={
              averageRating
                ? `${ratings.length} ${ratings.length === 1 ? 'review' : 'reviews'}`
                : ''
            }
          />
        </div>
      </section>

      <section className="space-y-1">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {profile.shop_name || 'Shop name not added'}
        </h2>
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {profile.description?.trim() || 'Shop description not added.'}
        </p>
      </section>

      <section className="space-y-2.5">
        <div className={`${orangeButton} min-w-0`} aria-label="Shop location">
          <MapPin className="h-5 w-5 shrink-0" />
          <span className="truncate">
            {profile.location?.trim() || 'Location not added'}
          </span>
        </div>

        {contactHref ? (
          <a href={contactHref} className={`${orangeButton} min-w-0 no-underline`}>
            {primaryPhone ? (
              <Phone className="h-5 w-5 shrink-0" />
            ) : (
              <Mail className="h-5 w-5 shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate">
              <span className="block truncate">{primaryPhone || email}</span>
              {primaryPhone && email && (
                <span className="block truncate text-xs font-normal text-white/80">
                  {email}
                </span>
              )}
            </span>
          </a>
        ) : (
          <div className={`${orangeButton} justify-start`} aria-label="Contact details not added">
            <Phone className="h-5 w-5 shrink-0" />
            <span>Contact details not added</span>
          </div>
        )}
      </section>

      <section aria-label="Shop photo gallery">
        <ShopPhotoGallery
          images={images}
          canAddPhoto={images.length < MAX_IMAGES}
          uploading={uploading}
          onAddPhoto={openShopImagePicker}
        />
        {images.length === 0 && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            No shop photos uploaded yet.
          </p>
        )}
      </section>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={avatarFileRef}
        type="file"
        accept="image/*"
        onChange={(event) => {
          void handleAvatarFile(event.target.files?.[0]);
          event.target.value = '';
        }}
        className="hidden"
      />

      <Dialog open={addActionsOpen} onOpenChange={setAddActionsOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add to your shop</DialogTitle>
            <DialogDescription>
              Choose an existing shop action.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setAddActionsOpen(false);
                navigate('/barber-hub/services');
              }}
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-border px-4 text-left font-medium hover:bg-secondary"
            >
              <Scissors className="h-5 w-5 text-[#ff7417]" />
              Add a service
            </button>
            <button
              type="button"
              disabled={uploading || images.length >= MAX_IMAGES}
              onClick={() => {
                setAddActionsOpen(false);
                void openShopImagePicker();
              }}
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-border px-4 text-left font-medium hover:bg-secondary disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-[#ff7417]" />
              ) : (
                <ImagePlus className="h-5 w-5 text-[#ff7417]" />
              )}
              Add shop photo
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90dvh] max-w-xl overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>Edit Shop</DialogTitle>
            <DialogDescription>
              Update your saved shop and profile information.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveShop} className="space-y-4">
            <div className="flex items-center gap-4 rounded-2xl border border-border p-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-orange-50 dark:bg-orange-950/30">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[#ff7417]">
                    <UserRound className="h-7 w-7" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">Barber profile photo</p>
                <p className="text-xs text-muted-foreground">
                  Uses your existing profile photo storage.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={avatarUploading}
                onClick={() => void openAvatarPicker()}
                className="shrink-0 rounded-xl"
              >
                {avatarUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <span className="ml-2">Change</span>
              </Button>
            </div>

            <Field label="Shop name">
              <Input
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                placeholder="Shop name"
                required
              />
            </Field>
            <Field label="Shop location">
              <Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Shop location"
              />
            </Field>
            <Field label="Shop description">
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell customers about your shop"
                rows={3}
                className="resize-y"
              />
            </Field>
            <Field label="Contact phone">
              <Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone number"
              />
            </Field>

            <div className="space-y-3 rounded-2xl border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold">Shop photos</p>
                  <p className="text-xs text-muted-foreground">
                    {images.length} of {MAX_IMAGES} uploaded
                  </p>
                </div>
                {images.length < MAX_IMAGES && (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => void openShopImagePicker()}
                    className="rounded-xl"
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                    <span className="ml-2">Add</span>
                  </Button>
                )}
              </div>
              {images.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {images.map((url) => (
                    <div
                      key={url}
                      className="relative aspect-square overflow-hidden rounded-xl border border-border"
                    >
                      <img src={url} alt="Shop" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => void handleDeletePhoto(url)}
                        aria-label="Remove shop photo"
                        className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No shop photos yet.</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="h-12 w-full rounded-2xl bg-[#ff7417] font-semibold text-white hover:bg-[#ed650c]"
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Store className="mr-2 h-4 w-4" />
              )}
              Save shop details
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Shop Permanently?</DialogTitle>
            <DialogDescription>
              This will permanently delete your shop and its related data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-11 flex-1 rounded-2xl"
              disabled={deleting}
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-11 flex-1 rounded-2xl"
              disabled={deleting}
              onClick={() => void handleDeleteShop()}
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatCard({
  icon,
  value,
  detail,
  title,
}: {
  icon: React.ReactNode;
  value: string;
  detail: string;
  title?: string;
}) {
  return (
    <div
      title={title}
      className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-orange-100 bg-white px-1.5 py-3 text-center dark:border-border dark:bg-card"
    >
      <span className="mb-1 text-[#ff7417]">{icon}</span>
      <span className="max-w-full truncate text-lg font-extrabold leading-tight sm:text-xl">
        {value}
      </span>
      {detail && (
        <span className="mt-0.5 truncate text-[10px] font-medium text-muted-foreground sm:text-xs">
          {detail}
        </span>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-sm font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}
