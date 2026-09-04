import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Store,
  MapPin,
  Scissors,
  Loader2,
  Clock,
  Users,
  CalendarCheck,
  TrendingUp,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Building2,
  Map as MapIcon,
  Camera,
  ImageIcon,
  Send,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { registerBarber } from '@/lib/api';
import barberHero from '@/assets/barber-hero.jpg';

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
];

/** Reusable premium field card */
function FieldCard({
  icon: Icon,
  label,
  helper,
  children,
}: {
  icon: React.ElementType;
  label: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-[0_2px_10px_rgba(16,10,40,0.05)]">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-primary" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <Label className="text-sm font-semibold text-black">{label}</Label>
          {helper && <p className="text-xs text-black/55 mt-0.5">{helper}</p>}
          <div className="mt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  'h-12 rounded-xl bg-white border-black/15 text-black placeholder:text-black/40 focus-visible:ring-primary/30';

export default function BecomeBarber() {
  const { updateLocalRole, isBarber, isBarberPending, refreshBarberStatus } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shopName: '',
    name: '',
    email: '',
    phone: '',
    shopNumber: '',
    locality: '',
    city: '',
    state: '',
  });
  const [shopPhotos, setShopPhotos] = useState<(string | null)[]>([null, null, null, null, null]);
  const [chairPhoto, setChairPhoto] = useState<string | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (isBarber) navigate('/barber-hub', { replace: true });
  }, [isBarber, navigate]);

  if (isBarber) return null;

  if (isBarberPending) {
    return (
      <div className="page-black animate-fade-in">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <div className="rounded-3xl border border-black/10 bg-white p-8 text-center shadow-lg">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-3 text-black">Application Pending</h2>
            <p className="text-black/60 mb-6">
              Your barber application is under review. We'll notify you once it's approved.
            </p>
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const pick = (key: string) => fileRefs.current[key]?.click();

  const onFile = (key: string, cb: (url: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) cb(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const location = [form.locality, form.city, form.state].filter(Boolean).join(', ');
    if (!form.shopName.trim() || !form.name.trim() || !form.phone.trim() || !form.city.trim() || !form.state) {
      toast.error('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      const response = await registerBarber({ shop_name: form.shopName, location });
      if (response.success || response.data) {
        updateLocalRole('barber_pending');
        localStorage.setItem(
          'trimly_barber_status',
          JSON.stringify({ role: 'barber_pending', status: 'pending' })
        );
        toast.success('Request submitted, waiting for admin approval');
        setTimeout(() => refreshBarberStatus(), 3000);
      } else {
        toast.error(response.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Barber registration error:', err);
      toast.error('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="page-black animate-fade-in overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-xl mx-auto pb-10 space-y-5"
      >
        {/* HERO */}
        <section className="hero-dark relative isolate mt-2 mx-auto w-full max-w-[560px] overflow-hidden rounded-[28px] bg-[#0B0705] shadow-[0_14px_40px_rgba(0,0,0,0.30)]">
          {/* Image + overlay layer (never above the text) */}
          <div className="absolute inset-0 z-0">
            <img
              src={barberHero}
              alt="Premium barbershop interior with leather barber chair"
              className="absolute inset-0 w-full h-full object-cover object-[78%_center]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,6,4,0.94)_0%,rgba(9,6,4,0.82)_42%,rgba(9,6,4,0.35)_72%,rgba(9,6,4,0.12)_100%)]" />
          </div>

          <div className="relative z-10 flex min-h-[230px] sm:min-h-[268px] flex-col justify-center px-6 py-8 sm:px-9 sm:py-10 max-w-[76%]">
            <div className="inline-flex self-start items-center gap-2 rounded-full border border-[#E9C46A]/80 bg-black/45 px-3 py-1.5 mb-4">
              <Scissors className="w-3.5 h-3.5 text-[#E9C46A]" strokeWidth={1.8} />
              <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#F5DA9A]">Trimly Partners</span>
            </div>
            <h1 className="font-display font-bold leading-[1.12] text-[30px] sm:text-[38px] text-white">
              Open Your
              <br />
              <span className="text-[#F2CE72]">Barber Shop</span>
            </h1>
            <p className="mt-3 text-[13px] sm:text-sm leading-relaxed text-white/85 max-w-[19rem]">
              Fill in the details below to get your shop approved on Trimly.
            </p>
          </div>
        </section>



        <form onSubmit={handleSubmit} className="space-y-5">
          {/* SHOP INFORMATION */}
          <section className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_4px_20px_rgba(16,10,40,0.06)] space-y-3">
            <h2 className="font-display text-lg font-bold text-black px-1">Shop Information</h2>

            <FieldCard icon={Store} label="Your Shop Name" helper="This will be shown to customers">
              <Input
                value={form.shopName}
                onChange={set('shopName')}
                placeholder="Enter your shop name"
                className={inputCls}
                required
              />
            </FieldCard>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FieldCard icon={User} label="1. Name">
                <Input value={form.name} onChange={set('name')} placeholder="Enter your full name" className={inputCls} required />
              </FieldCard>
              <FieldCard icon={Mail} label="2. Email">
                <Input type="email" value={form.email} onChange={set('email')} placeholder="Enter your email" className={inputCls} />
              </FieldCard>
              <FieldCard icon={Phone} label="3. Phone Number">
                <Input value={form.phone} onChange={set('phone')} placeholder="Enter your phone number" className={inputCls} required />
              </FieldCard>
              <FieldCard icon={Building2} label="11. Shop Number">
                <Input value={form.shopNumber} onChange={set('shopNumber')} placeholder="Enter shop landline number" className={inputCls} />
              </FieldCard>
            </div>

            <FieldCard icon={MapPin} label="4. Locality Address">
              <Input value={form.locality} onChange={set('locality')} placeholder="House no., Building, Street, Locality" className={inputCls} />
            </FieldCard>

            <FieldCard icon={Building2} label="5. Village / Town or City Address">
              <Input value={form.city} onChange={set('city')} placeholder="Enter your village, town or city" className={inputCls} required />
            </FieldCard>

            <FieldCard icon={MapIcon} label="6. State">
              <div className="relative">
                <select
                  value={form.state}
                  onChange={set('state')}
                  required
                  className="h-12 w-full appearance-none rounded-xl border border-black/15 bg-white px-3 pr-10 text-sm text-black outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Select your state</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-black/50" />
              </div>
            </FieldCard>
          </section>

          {/* SHOP PHOTOS */}
          <section className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_4px_20px_rgba(16,10,40,0.06)]">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-4.5 h-4.5 text-primary" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-black">7. Shop Photos (2–5 photos)</h3>
                <p className="text-xs text-black/55 mt-0.5">Upload clear photos of your shop (exterior)</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {shopPhotos.map((src, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => pick(`shop-${i}`)}
                  className={`relative aspect-video w-full overflow-hidden rounded-2xl border border-dashed ${
                    i < 2 ? 'border-primary/50 bg-primary/[0.04]' : 'border-black/20 bg-black/[0.02]'
                  } flex flex-col items-center justify-center gap-1.5`}
                >
                  {src ? (
                    <img src={src} alt={`Shop photo ${i + 1}`} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-primary" strokeWidth={1.8} />
                      <span className="text-xs font-medium text-black">Add Photo</span>
                      <span className="text-[11px] text-black/50">{i < 2 ? 'Required' : 'Optional'}</span>
                    </>
                  )}
                  <input
                    ref={(el) => (fileRefs.current[`shop-${i}`] = el)}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFile(`shop-${i}`, (url) =>
                      setShopPhotos((p) => p.map((v, idx) => (idx === i ? url : v)))
                    )}
                  />
                </button>
              ))}
            </div>
          </section>

          {/* INSIDE CHAIRS */}
          <section className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_4px_20px_rgba(16,10,40,0.06)]">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <Scissors className="w-4.5 h-4.5 text-primary" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-black">8. Inside the Chairs (Number of seats)</h3>
                <p className="text-xs text-black/55 mt-0.5">
                  Upload a clear photo showing the number of chairs / seats inside your shop
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => pick('chairs')}
              className="relative aspect-video w-full overflow-hidden rounded-2xl border border-dashed border-primary/50 bg-primary/[0.04] flex flex-col items-center justify-center gap-1.5"
            >
              {chairPhoto ? (
                <img src={chairPhoto} alt="Inside the shop" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-primary" strokeWidth={1.8} />
                  <span className="text-sm font-medium text-black">Upload Photo</span>
                  <span className="text-[11px] text-black/50">16:9 ratio</span>
                </>
              )}
              <input
                ref={(el) => (fileRefs.current['chairs'] = el)}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFile('chairs', setChairPhoto)}
              />
            </button>
          </section>

          {/* BARBER PROFILE PHOTO */}
          <section className="rounded-3xl border border-black/10 bg-white p-4 shadow-[0_4px_20px_rgba(16,10,40,0.06)]">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="w-4.5 h-4.5 text-primary" strokeWidth={1.8} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-black">9. Barber Profile Photo</h3>
                <p className="text-xs text-black/55 mt-0.5">Upload your professional profile photo</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => pick('profile')}
              className="relative aspect-video w-full overflow-hidden rounded-2xl border border-dashed border-primary/50 bg-primary/[0.04] flex flex-col items-center justify-center gap-1.5"
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt="Barber profile" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <Camera className="w-6 h-6 text-primary" strokeWidth={1.8} />
                  <span className="text-sm font-medium text-black">Upload Photo</span>
                  <span className="text-[11px] text-black/50">Required · 16:9 ratio</span>
                </>
              )}
              <input
                ref={(el) => (fileRefs.current['profile'] = el)}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFile('profile', setProfilePhoto)}
              />
            </button>
          </section>

          {/* VERIFICATION NOTICE */}
          <section className="rounded-2xl border border-primary/20 bg-primary/[0.06] p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" strokeWidth={1.8} />
            <div>
              <p className="text-sm font-medium text-black">
                We verify all details to ensure trust and safety for our customers.
              </p>
              <p className="text-xs text-black/60 mt-1">You will be notified once your shop is approved.</p>
            </div>
          </section>

          {/* SUBMIT */}
          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 rounded-2xl text-base font-semibold text-primary-foreground shadow-lg bg-gradient-to-r from-[hsl(262_83%_58%)] to-[hsl(280_80%_60%)] hover:opacity-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Submit for Approval
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
