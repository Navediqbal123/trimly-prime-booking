import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store,
  Save,
  Loader2,
  MapPin,
  Phone,
  ImagePlus,
  Trash2,
  Camera,
  Pencil,
  FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

import {
  getMyBarberProfile,
  updateMyShop,
  deleteMyShop,
  BarberProfileData,
} from '@/lib/api';

import {
  listShopMedia,
  uploadShopImage,
  deleteShopImage,
} from '@/lib/shopMediaStore';

export default function MyShop() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [profile, setProfile] = useState<BarberProfileData | null>(null);

  const [formData, setFormData] = useState({
    shopName: '',
    location: '',
    description: '',
    phone: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const MAX_IMAGES = 5;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);

    const res = await getMyBarberProfile();

    if (res.success && res.data) {
      setProfile(res.data);

      setFormData({
        shopName: res.data.shop_name || '',
        location: res.data.location || '',
        description: (res.data as any).description || '',
        phone: (res.data as any).phone || '',
      });

      const media = await listShopMedia(res.data.id);
      setImages(media);
    } else {
      toast.error(res.error || 'Failed to load shop profile');
    }

    setLoading(false);
  };

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(e.target.files || []);

    e.target.value = '';

    if (!profile) return;

    const slots = MAX_IMAGES - images.length;

    if (slots <= 0) {
      toast.error(`Maximum ${MAX_IMAGES} photos allowed`);
      return;
    }

    const toUpload = files.slice(0, slots);

    setUploading(true);

    try {
      for (let i = 0; i < toUpload.length; i++) {
        const url = await uploadShopImage(
          profile.id,
          toUpload[i],
          images.length + i
        );

        setImages((prev) => [...prev, url]);
      }

      toast.success(`${toUpload.length} photo(s) uploaded`);
    } catch (err: any) {
      toast.error(
        err?.message ||
          'Upload failed. Ensure shop-images bucket exists.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    if (!profile) return;

    try {
      await deleteShopImage(profile.id, url);
      setImages((prev) => prev.filter((u) => u !== url));
      toast.success('Photo removed');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);

    try {
      const res = await updateMyShop({
        shop_name: formData.shopName.trim(),
        location: formData.location.trim(),
        description: formData.description.trim(),
        phone: formData.phone.trim(),
      });

      if (res.success) {
        toast.success('Shop details updated successfully');
      } else {
        toast.error(res.error || 'Failed to update shop details');
      }
    } catch {
      toast.error('Failed to update shop details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-7 h-7 animate-spin text-orange-500 mb-3" />
        <p className="text-gray-500 text-sm">
          Loading shop details...
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in w-full max-w-4xl mx-auto px-2 sm:px-4 pb-8">

      {/* ================= HEADER ================= */}
      <div className="mb-5 sm:mb-7">
        <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
          <span className="text-black">My </span>
          <span className="text-orange-500">Shop</span>
        </h1>

        <p className="text-gray-500 text-sm sm:text-base mt-1">
          Manage your shop details and info
        </p>
      </div>

      {/* ================= FORM ================= */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ================= SHOP NAME ================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            w-full
            h-[140px]
            rounded-[24px]
            bg-white
            border border-orange-100
            shadow-[0_7px_22px_rgba(0,0,0,0.07)]
            p-4 sm:p-5
            flex items-center
          "
        >
          <div className="flex items-center gap-3 sm:gap-4 w-full">

            <div className="
              shrink-0
              w-12 h-12 sm:w-14 sm:h-14
              rounded-[18px]
              bg-orange-50
              border border-orange-100
              flex items-center justify-center
            ">
              <Store className="w-6 h-6 sm:w-7 sm:h-7 text-orange-500" />
            </div>

            <div className="min-w-0 flex-1">
              <label
                htmlFor="shopName"
                className="
                  block
                  text-base sm:text-lg
                  font-bold
                  text-gray-900
                  mb-2
                "
              >
                Shop Name
              </label>

              <div className="
                relative
                h-11 sm:h-12
                rounded-xl
                border-2 border-orange-100
                bg-orange-50/20
                flex items-center
              ">
                <Input
                  id="shopName"
                  name="shopName"
                  value={formData.shopName}
                  onChange={handleChange}
                  placeholder="Your shop name"
                  className="
                    h-full
                    border-0
                    bg-transparent
                    shadow-none
                    focus-visible:ring-0
                    px-3
                    pr-10
                    text-sm sm:text-base
                    text-gray-700
                  "
                />

                <Pencil className="
                  absolute
                  right-3
                  w-4 h-4
                  text-gray-400
                " />
              </div>
            </div>

          </div>
        </motion.div>


        {/* ================= LOCATION ================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="
            w-full
            h-[140px]
            rounded-[24px]
            bg-white
            border border-green-100
            shadow-[0_7px_22px_rgba(0,0,0,0.07)]
            p-4 sm:p-5
            flex items-center
          "
        >
          <div className="flex items-center gap-3 sm:gap-4 w-full">

            <div className="
              shrink-0
              w-12 h-12 sm:w-14 sm:h-14
              rounded-[18px]
              bg-green-50
              border border-green-100
              flex items-center justify-center
            ">
              <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />
            </div>

            <div className="min-w-0 flex-1">
              <label
                htmlFor="location"
                className="
                  block
                  text-base sm:text-lg
                  font-bold
                  text-gray-900
                  mb-2
                "
              >
                Location
              </label>

              <div className="
                relative
                h-11 sm:h-12
                rounded-xl
                border-2 border-green-100
                bg-green-50/20
                flex items-center
              ">
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  readOnly
                  disabled
                  placeholder="Shop location"
                  className="
                    h-full
                    border-0
                    bg-transparent
                    shadow-none
                    focus-visible:ring-0
                    px-3
                    pr-10
                    text-sm sm:text-base
                    text-gray-500
                    disabled:opacity-100
                  "
                />

                <MapPin className="
                  absolute
                  right-3
                  w-4 h-4
                  text-gray-400
                " />
              </div>

              <p className="
                text-xs sm:text-sm
                text-gray-500
                mt-1.5
                truncate
              ">
                Shop location is set during shop creation.
              </p>
            </div>

          </div>
        </motion.div>


        {/* ================= DESCRIPTION ================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="
            w-full
            h-[140px]
            rounded-[24px]
            bg-white
            border border-blue-100
            shadow-[0_7px_22px_rgba(0,0,0,0.07)]
            p-4 sm:p-5
            flex items-center
          "
        >
          <div className="flex items-center gap-3 sm:gap-4 w-full">

            <div className="
              shrink-0
              w-12 h-12 sm:w-14 sm:h-14
              rounded-[18px]
              bg-blue-50
              border border-blue-100
              flex items-center justify-center
            ">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500" />
            </div>

            <div className="min-w-0 flex-1">
              <label
                htmlFor="description"
                className="
                  block
                  text-base sm:text-lg
                  font-bold
                  text-gray-900
                  mb-2
                "
              >
                Description
              </label>

              <div className="
                relative
                h-[76px]
                rounded-xl
                border-2 border-blue-100
                bg-blue-50/20
                overflow-hidden
              ">
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Tell customers about your shop..."
                  className="
                    w-full
                    h-full
                    resize-none
                    border-0
                    bg-transparent
                    shadow-none
                    focus-visible:ring-0
                    px-3
                    py-2.5
                    pr-9
                    text-sm sm:text-base
                    text-gray-600
                  "
                />

                <Pencil className="
                  absolute
                  right-3
                  bottom-3
                  w-4 h-4
                  text-gray-400
                  pointer-events-none
                " />
              </div>
            </div>

          </div>
        </motion.div>


        {/* ================= PHONE ================= */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="
            w-full
            h-[140px]
            rounded-[24px]
            bg-white
            border border-purple-100
            shadow-[0_7px_22px_rgba(0,0,0,0.07)]
            p-4 sm:p-5
            flex items-center
          "
        >
          <div className="flex items-center gap-3 sm:gap-4 w-full">

            <div className="
              shrink-0
              w-12 h-12 sm:w-14 sm:h-14
              rounded-[18px]
              bg-purple-50
              border border-purple-100
              flex items-center justify-center
            ">
              <Phone className="w-6 h-6 sm:w-7 sm:h-7 text-purple-500" />
            </div>

            <div className="min-w-0 flex-1">
              <label
                htmlFor="phone"
                className="
                  block
                  text-base sm:text-lg
                  font-bold
                  text-gray-900
                  mb-2
                "
              >
                Phone
              </label>

              <div className="
                relative
                h-11 sm:h-12
                rounded-xl
                border-2 border-purple-100
                bg-purple-50/20
                flex items-center
              ">
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 XXXXX XXXXX"
                  className="
                    h-full
                    border-0
                    bg-transparent
                    shadow-none
                    focus-visible:ring-0
                    px-3
                    pr-10
                    text-sm sm:text-base
                    text-gray-700
                  "
                />

                <Pencil className="
                  absolute
                  right-3
                  w-4 h-4
                  text-gray-400
                " />
              </div>
            </div>

          </div>
        </motion.div>


        {/* ================= SAVE BUTTON ================= */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={saving}
          className="
            w-full
            h-12 sm:h-13
            rounded-full
            bg-orange-500
            hover:bg-orange-600
            text-white
            font-semibold
            text-base sm:text-lg
            flex items-center justify-center gap-2.5
            shadow-[0_8px_20px_rgba(249,115,22,0.28)]
            transition-all
            disabled:opacity-60
          "
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}

          Save Changes
        </motion.button>

      </form>


      {/* ================= SHOP STATUS ================= */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            mt-7
            rounded-[24px]
            bg-white
            border border-gray-100
            shadow-[0_7px_22px_rgba(0,0,0,0.07)]
            p-5
          "
        >
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Shop Status
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">

            <div>
              <p className="text-gray-500 mb-1">
                Status
              </p>

              <p className="font-semibold capitalize text-green-500">
                {profile.status}
              </p>
            </div>

            <div>
              <p className="text-gray-500 mb-1">
                Barber ID
              </p>

              <p className="font-mono text-xs text-gray-600">
                {profile.id.slice(0, 12)}...
              </p>
            </div>

          </div>
        </motion.div>
      )}


      {/* ================= SHOP PHOTOS ================= */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            mt-4
            rounded-[24px]
            bg-white
            border border-gray-100
            shadow-[0_7px_22px_rgba(0,0,0,0.07)]
            p-5
          "
        >
          <div className="flex items-center gap-3 mb-4">

            <div className="
              w-11 h-11
              rounded-2xl
              bg-blue-50
              flex items-center justify-center
            ">
              <Camera className="w-5 h-5 text-blue-500" />
            </div>

            <h2 className="text-lg font-bold text-gray-900">
              Shop Photos
            </h2>

            <span className="ml-auto text-xs text-gray-500">
              {images.length}/{MAX_IMAGES}
            </span>

          </div>

          <p className="text-sm text-gray-500 mb-4">
            Upload up to {MAX_IMAGES} photos. They'll appear as
            an auto-sliding gallery on your shop card.
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">

            <AnimatePresence>
              {images.map((url) => (
                <motion.div
                  key={url}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.25 }}
                  className="
                    relative
                    aspect-square
                    rounded-2xl
                    overflow-hidden
                    group
                    border
                    border-gray-100
                    shadow-sm
                  "
                >
                  <img
                    src={url}
                    alt="Shop"
                    className="w-full h-full object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => handleDelete(url)}
                    className="
                      absolute inset-0
                      bg-black/60
                      opacity-0
                      group-hover:opacity-100
                      flex items-center justify-center
                      transition-opacity
                    "
                    aria-label="Remove"
                  >
                    <Trash2 className="w-5 h-5 text-white" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {images.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="
                  aspect-square
                  rounded-2xl
                  border-2
                  border-dashed
                  border-gray-200
                  hover:border-orange-400
                  flex flex-col
                  items-center justify-center
                  gap-1
                  text-gray-400
                  hover:text-orange-500
                  transition-colors
                  disabled:opacity-50
                "
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-6 h-6" />
                    <span className="text-[10px] font-medium">
                      Add photo
                    </span>
                  </>
                )}
              </button>
            )}

          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </motion.div>
      )}


      {/* ================= DELETE SHOP ================= */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="
          mt-4
          rounded-[24px]
          border border-red-100
          bg-white
          shadow-[0_7px_22px_rgba(0,0,0,0.06)]
          p-5
        "
      >
        <h2 className="text-lg font-bold text-red-500 mb-2">
          Delete Shop Permanently
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          Permanently delete your shop and its related data.
          This action cannot be undone.
        </p>

        <Button
          type="button"
          variant="destructive"
          className="w-full rounded-2xl h-11"
          disabled={deleting}
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Shop Permanently
        </Button>
      </motion.div>


      {/* ================= DELETE CONFIRMATION ================= */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="
              fixed inset-0 z-50
              flex items-center justify-center
              bg-black/70
              p-4
            "
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="
                w-full max-w-md
                rounded-[24px]
                bg-white
                p-6
                shadow-2xl
              "
            >
              <h2 className="text-xl font-bold text-red-500 mb-3">
                Delete Shop Permanently?
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                This will permanently delete your shop and its related
                data. This action cannot be undone.
              </p>

              <div className="flex gap-3">

                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 rounded-2xl"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1 rounded-2xl"
                  onClick={async () => {
                    setDeleting(true);

                    try {
                      const result = await deleteMyShop();

                      if (result.error) {
                        toast.error(result.error);
                        return;
                      }

                      toast.success('Shop permanently deleted.');
                      setShowDeleteConfirm(false);
                      window.location.href = '/dashboard';
                    } catch (error) {
                      toast.error(
                        error instanceof Error
                          ? error.message
                          : 'Failed to delete shop'
                      );
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  Continue
                </Button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}