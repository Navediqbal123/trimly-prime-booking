import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Camera,
  Save,
  Loader2,
  Pencil,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: '',
    avatar_url: '',
  });

  // Load profile from Supabase
  useEffect(() => {
    if (!user?.id) return;

    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, phone, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      if (!error && data) {
        setFormData({
          full_name: data.name || user.full_name || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
        });
      }

      setInitializing(false);
    })();
  }, [user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAvatarUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file');
      return;
    }

    setUploading(true);

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('avatar')
      .upload(path, file, {
        upsert: false,
        contentType: file.type,
      });

    if (upErr) {
      toast.error(upErr.message || 'Failed to upload image');
      setUploading(false);
      return;
    }

    const { data: pub } = supabase.storage
      .from('avatar')
      .getPublicUrl(path);

    const publicUrl = pub.publicUrl;

    const { error: updErr } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', user.id);

    if (updErr) {
      toast.error(updErr.message || 'Failed to save avatar');
    } else {
      setFormData((prev) => ({
        ...prev,
        avatar_url: publicUrl,
      }));

      toast.success('Avatar updated');
    }

    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) return;

    setLoading(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        name: formData.full_name,
        phone: formData.phone,
        avatar_url: formData.avatar_url,
      })
      .eq('id', user.id);

    if (error) {
      toast.error(error.message || 'Failed to update profile');
    } else {
      toast.success('Profile updated successfully');
    }

    setLoading(false);
  };

  return (
    <div className="animate-fade-in max-w-4xl mx-auto px-3 sm:px-4 pb-8 bg-background text-foreground">

      {/* PAGE HEADER */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-display font-bold tracking-tight">
          <span className="text-foreground">My </span>
          <span className="text-orange-500">Profile</span>
        </h1>

        <p className="text-muted-foreground text-base sm:text-lg mt-1">
          Manage your account settings
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">

        {/* ================= TOP PROFILE CARD ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="
            relative overflow-hidden
            rounded-[28px]
            bg-card
            border border-border
            shadow-sm
            p-5 sm:p-7
          "
        >
          {/* Decorative graphics */}
          <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-secondary/80" />
          <div className="absolute -bottom-20 -left-16 w-44 h-44 rounded-full bg-secondary" />
          <div className="absolute top-20 -right-10 w-24 h-24 rounded-full bg-secondary/80" />

          {/* Camera button: fixed at the profile card's top-right corner */}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change profile photo"
            className="
              absolute top-4 right-4 z-20
              w-12 h-12
              rounded-full
              bg-orange-500
              text-white
              flex items-center justify-center
              border border-orange-300/70
              shadow-[0_6px_18px_rgba(249,115,22,0.45)]
              hover:bg-orange-600
              active:scale-95
              transition-all
              disabled:opacity-60
            "
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
            )}
          </button>

          <div className="relative flex flex-col sm:flex-row items-center gap-5 sm:gap-7">

            {/* Avatar */}
            <div className="relative shrink-0">

              <div
                className="
                  w-28 h-28 sm:w-32 sm:h-32
                  rounded-full
                  p-2
                  bg-card
                  shadow-md
                "
              >
                <div className="w-full h-full rounded-full overflow-hidden bg-secondary flex items-center justify-center">

                  {formData.avatar_url ? (
                    <img
                      src={formData.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-14 h-14 text-orange-400" />
                  )}

                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>

            {/* Profile information */}
            <div className="min-w-0 flex-1 text-center sm:text-left">

              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground break-words">
                {formData.full_name ||
                  user?.full_name ||
                  'User'}
              </h2>

              <p className="text-muted-foreground text-base sm:text-lg mt-1 break-all">
                {user?.email}
              </p>

              <div
                className="
                  inline-flex items-center gap-2
                  mt-3
                  px-5 py-2
                  rounded-full
                  bg-secondary
                  text-orange-500
                  border border-border
                  font-semibold
                "
              >
                <User className="w-5 h-5" />

                <span className="capitalize">
                  {user?.role?.replace('_', ' ') || 'User'}
                </span>
              </div>

            </div>
          </div>
        </motion.div>


        {/* ================= FULL NAME CARD ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="
            rounded-[22px]
            bg-card
            border border-border
            shadow-sm
            px-3.5 py-3
            sm:px-4 sm:py-3.5
          "
        >
          <div className="flex items-center gap-3">

            {/* Small Clay Icon */}
            <div
              className="
                shrink-0
                w-12 h-12
                rounded-[16px]
                bg-gradient-to-br from-green-50 to-green-100/70
                border border-border
                flex items-center justify-center
                shadow-sm
              "
            >
              <User className="w-5 h-5 text-green-500" />
            </div>

            <div className="flex-1 min-w-0">

              <label
                htmlFor="full_name"
                className="
                  block
                  text-base
                  sm:text-[17px]
                  font-bold
                  text-foreground
                  mb-1.5
                "
              >
                Full Name
              </label>

              <div
                className="
                  relative
                  flex items-center
                  min-h-[42px]
                  rounded-xl
                  border
                  border-border
                  bg-secondary/50
                  px-3
                  shadow-inner
                  focus-within:border-green-300
                  transition-colors
                "
              >
                <input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="
                    w-full
                    bg-transparent
                    border-none
                    outline-none
                    py-1.5
                    pr-8
                    text-sm
                    sm:text-[15px]
                    font-medium
                    text-foreground
                  "
                />

                <Pencil className="absolute right-3 w-4 h-4 text-muted-foreground" />
              </div>

            </div>
          </div>
        </motion.div>


        {/* ================= EMAIL CARD ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="
            rounded-[22px]
            bg-card
            border border-border
            shadow-sm
            px-3.5 py-3
            sm:px-4 sm:py-3.5
          "
        >
          <div className="flex items-center gap-3">

            {/* Small Clay Icon */}
            <div
              className="
                shrink-0
                w-12 h-12
                rounded-[16px]
                bg-gradient-to-br from-blue-50 to-blue-100/70
                border border-border
                flex items-center justify-center
                shadow-sm
              "
            >
              <Mail className="w-5 h-5 text-blue-500" />
            </div>

            <div className="flex-1 min-w-0">

              <label
                htmlFor="email"
                className="
                  block
                  text-base
                  sm:text-[17px]
                  font-bold
                  text-foreground
                  mb-1.5
                "
              >
                Email
              </label>

              <div
                className="
                  relative
                  flex items-center
                  min-h-[42px]
                  rounded-xl
                  border
                  border-border
                  bg-secondary/50
                  px-3
                  shadow-inner
                "
              >
                <input
                  id="email"
                  value={user?.email || ''}
                  disabled
                  className="
                    w-full
                    bg-transparent
                    border-none
                    outline-none
                    py-1.5
                    pr-8
                    text-sm
                    sm:text-[15px]
                    text-muted-foreground
                    disabled:opacity-100
                  "
                />

                <Lock className="absolute right-3 w-4 h-4 text-muted-foreground" />
              </div>

              <p className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </p>

            </div>
          </div>
        </motion.div>


        {/* ================= PHONE CARD ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="
            rounded-[22px]
            bg-card
            border border-border
            shadow-sm
            px-3.5 py-3
            sm:px-4 sm:py-3.5
          "
        >
          <div className="flex items-center gap-3">

            {/* Small Clay Icon */}
            <div
              className="
                shrink-0
                w-12 h-12
                rounded-[16px]
                bg-gradient-to-br from-orange-50 to-orange-100/70
                border border-border
                flex items-center justify-center
                shadow-sm
              "
            >
              <Phone className="w-5 h-5 text-orange-500" />
            </div>

            <div className="flex-1 min-w-0">

              <label
                htmlFor="phone"
                className="
                  block
                  text-base
                  sm:text-[17px]
                  font-bold
                  text-foreground
                  mb-1.5
                "
              >
                Phone Number
              </label>

              <div
                className="
                  relative
                  flex items-center
                  min-h-[42px]
                  rounded-xl
                  border
                  border-border
                  bg-secondary/20
                  px-3
                  shadow-inner
                  focus-within:border-orange-300
                  transition-colors
                "
              >
                <input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  className="
                    w-full
                    bg-transparent
                    border-none
                    outline-none
                    py-1.5
                    pr-8
                    text-sm
                     sm:text-[15px]
                     font-medium
                     text-foreground
                  "
                />

                <Pencil className="absolute right-3 w-4 h-4 text-muted-foreground" />
              </div>

            </div>
          </div>
        </motion.div>

        {/* ================= SAVE BUTTON ================= */}
        <motion.button
          type="submit"
          disabled={loading || uploading || initializing}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="
            w-full
            rounded-full
            bg-orange-500
            text-white
            font-semibold
            py-3
            text-base
            flex items-center justify-center gap-2
            shadow-[0_8px_18px_rgba(249,115,22,0.25)]
            hover:bg-orange-600
            transition-colors
            disabled:opacity-60
          "
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </motion.button>

      </form>
    </div>
  );
}
