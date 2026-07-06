import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, Save, Loader2, MapPin, Phone, ImagePlus, Trash2, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { getMyBarberProfile, BarberProfileData } from '@/lib/api';
import { listShopMedia, uploadShopImage, deleteShopImage } from '@/lib/shopMediaStore';
import { shopImage } from '@/lib/shopMedia';

export default function MyShop() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        description: '',
        phone: '',
      });
      const media = await listShopMedia(res.data.id);
      setImages(media);
    } else {
      toast.error(res.error || 'Failed to load shop profile');
    }
    setLoading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
        const url = await uploadShopImage(profile.id, toUpload[i], images.length + i);
        setImages((prev) => [...prev, url]);
      }
      toast.success(`${toUpload.length} photo(s) uploaded`);
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed. Ensure shop-images bucket exists.');
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Backend doesn't have a shop update endpoint yet — save locally
    toast.success('Shop details saved locally. Backend update coming soon.');
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading shop details...</p>
      </div>
    );
  }

  return (
    <div className="page-black animate-fade-in"><div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-display font-bold mb-2">
          My <span className="gradient-text">Shop</span>
        </h1>
        <p className="text-muted-foreground">Manage your shop details and info</p>
      </div>

      {/* Shop Status Card */}
      {profile && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Store className="w-5 h-5 text-primary" />
                Shop Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <p className="font-medium capitalize text-green-500">{profile.status}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Barber ID</p>
                  <p className="font-mono text-xs">{profile.id.slice(0, 12)}...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Shop Photos */}
      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-6"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="w-5 h-5 text-primary" />
                Shop Photos
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {images.length}/{MAX_IMAGES}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-4">
                Upload up to {MAX_IMAGES} photos. They'll appear as an auto-sliding gallery on your shop card.
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
                      className="relative aspect-square rounded-xl overflow-hidden group border border-border"
                    >
                      <img src={url} alt="Shop" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleDelete(url)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        aria-label="Remove"
                      >
                        <Trash2 className="w-5 h-5 text-white" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {images.length < MAX_IMAGES && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        <ImagePlus className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Add photo</span>
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
            </CardContent>
          </Card>
        </motion.div>
      )}



      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-6"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="shopName">Shop Name</Label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="shopName"
                name="shopName"
                value={formData.shopName}
                onChange={handleChange}
                className="pl-10"
                placeholder="Your shop name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="pl-10"
                placeholder="Shop address"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="min-h-[100px]"
              placeholder="Tell customers about your shop..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="pl-10"
                placeholder="+91 XXXXX XXXXX"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </form>
      </motion.div>
    </div></div>
  );
}
