import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Store,
  MapPin,
  Scissors,
  Loader2,
  Clock,
  User,
  Phone,
  Building2,
  Map as MapIcon,
  Camera,
  ImageIcon,
  Send,
  ChevronDown,
  Mail,
  LocateFixed,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { registerBarber } from '@/lib/api';

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal',
];

type Coordinates = { latitude: number; longitude: number };

const inputCls =
  'h-12 min-w-0 rounded-xl border border-[#D7D9E0] bg-white text-[15px] text-[#151827] shadow-none placeholder:text-[#7C8295] focus-visible:ring-1 focus-visible:ring-[#FF7417]/40';

function IconTile({ children, tone = 'orange' }: { children: React.ReactNode; tone?: 'orange' | 'purple' | 'blue' | 'green' | 'pink' }) {
  const tones = {
    orange: 'bg-[#FFF0DE] text-[#E96A12]',
    purple: 'bg-[#F0E6FF] text-[#7540D8]',
    blue: 'bg-[#DDF4FF] text-[#087FC5]',
    green: 'bg-[#DDF9E7] text-[#168447]',
    pink: 'bg-[#FFE5EF] text-[#D92E72]',
  };
  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${tones[tone]} shadow-[inset_0_1px_2px_rgba(255,255,255,0.9),0_2px_3px_rgba(20,20,40,0.07)]`}>
      {children}
    </div>
  );
}

function FieldRow({
  icon,
  tone,
  children,
}: {
  icon: React.ReactNode;
  tone?: 'orange' | 'purple' | 'blue' | 'green' | 'pink';
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-[#ECECF1] bg-white p-2.5 shadow-[0_2px_5px_rgba(22,25,45,0.035)]">
      <IconTile tone={tone}>{icon}</IconTile>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export default function BecomeBarber() {
  const { updateLocalRole, isBarber, isBarberPending, refreshBarberStatus } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
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

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((previous) => ({ ...previous, [key]: e.target.value }));

  const pick = (key: string) => fileRefs.current[key]?.click();

  const onFile = (callback: (url: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) callback(URL.createObjectURL(file));
  };

  const captureCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location is not supported by this device or browser.');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setLocating(false);
        toast.success('Current location captured successfully.');
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error('Location permission denied. Allow location access and try again.');
        } else if (error.code === error.TIMEOUT) {
          toast.error('Location request timed out. Please try again.');
        } else {
          toast.error('Could not get your location. Turn on device location and try again.');
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shopName.trim() || !form.name.trim() || !form.phone.trim() || !form.city.trim() || !form.state) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (!coordinates) {
      toast.error('Please tap “Use Current Location” before submitting.');
      return;
    }

    setLoading(true);
    const location = [form.locality, form.city, form.state].filter(Boolean).join(', ');

    try {
      // Coordinates are included in the request; the backend registration handler must save them too.
      const registrationPayload = {
        shop_name: form.shopName.trim(),
        location,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      } as Parameters<typeof registerBarber>[0];
      const response = await registerBarber(registrationPayload);

      if (response.success || response.data) {
        updateLocalRole('barber_pending');
        localStorage.setItem('trimly_barber_status', JSON.stringify({ role: 'barber_pending', status: 'pending' }));
        toast.success('Request submitted, waiting for admin approval.');
        setTimeout(() => refreshBarberStatus(), 3000);
      } else {
        toast.error(response.error || 'Failed to submit application.');
      }
    } catch (error) {
      console.error('Barber registration error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (isBarber) return null;

  if (isBarberPending) {
    return (
      <div className="min-h-screen bg-[#FAFAFC] px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-md rounded-3xl border border-[#ECECF1] bg-white p-7 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFF0DE] text-[#E96A12]"><Clock className="h-8 w-8" /></div>
          <h2 className="mb-2 text-2xl font-bold text-[#151827]">Application Pending</h2>
          <p className="mb-6 text-sm text-[#73798B]">Your barber application is under review. We'll notify you once it's approved.</p>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAFC] px-3 pb-5 pt-3 text-[#151827] sm:px-5">
      <motion.main initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mx-auto w-full max-w-lg">
        <header className="relative mb-5 px-10 text-center">
          <button type="button" onClick={() => navigate(-1)} aria-label="Go back" className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-xl border border-[#ECECF1] bg-white text-[#70778D] shadow-sm">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-display text-[25px] font-bold leading-tight tracking-[-0.04em] text-[#11152A]">Become a <span className="text-[#F36F16]">Barber</span></h1>
          <div className="mx-auto mt-1.5 h-1 w-10 rounded-full bg-[#F36F16]" />
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-[#73798B]">Fill in the details below to get your shop approved on Trimly.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <FieldRow icon={<Store className="h-6 w-6" />} tone="orange">
            <Input aria-label="Shop name" value={form.shopName} onChange={set('shopName')} placeholder="Your shop name" className={inputCls} required />
          </FieldRow>
          <FieldRow icon={<User className="h-6 w-6" />} tone="purple">
            <Input aria-label="Full name" value={form.name} onChange={set('name')} placeholder="Enter your full name" className={inputCls} required />
          </FieldRow>
          <FieldRow icon={<Mail className="h-6 w-6" />} tone="blue">
            <Input aria-label="Email" type="email" value={form.email} onChange={set('email')} placeholder="Enter your email" className={inputCls} />
          </FieldRow>
          <FieldRow icon={<Phone className="h-6 w-6" />} tone="green">
            <Input aria-label="Phone number" type="tel" value={form.phone} onChange={set('phone')} placeholder="Enter your phone number" className={inputCls} required />
          </FieldRow>
          <FieldRow icon={<Building2 className="h-6 w-6" />} tone="pink">
            <Input aria-label="Shop landline number" type="tel" value={form.shopNumber} onChange={set('shopNumber')} placeholder="Enter shop landline number" className={inputCls} />
          </FieldRow>
          <FieldRow icon={<MapPin className="h-6 w-6" />} tone="orange">
            <Input aria-label="Locality address" value={form.locality} onChange={set('locality')} placeholder="House no., Building, Street" className={inputCls} />
          </FieldRow>
          <FieldRow icon={<MapPin className="h-6 w-6" />} tone="purple">
            <Input aria-label="Village, town or city" value={form.city} onChange={set('city')} placeholder="Enter your village, town or city" className={inputCls} required />
          </FieldRow>
          <FieldRow icon={<MapIcon className="h-6 w-6" />} tone="blue">
            <div className="relative">
              <select aria-label="State" value={form.state} onChange={set('state')} required className="h-12 w-full appearance-none rounded-xl border border-[#D7D9E0] bg-white px-3 pr-9 text-[15px] text-[#151827] outline-none focus:ring-1 focus:ring-[#FF7417]/40">
                <option value="">Select your state</option>
                {STATES.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C8295]" />
            </div>
          </FieldRow>

          <FieldRow icon={coordinates ? <CheckCircle2 className="h-6 w-6" /> : <LocateFixed className="h-6 w-6" />} tone="green">
            <button type="button" onClick={captureCurrentLocation} disabled={locating} className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl border px-2 text-sm font-semibold transition-colors disabled:opacity-70 ${coordinates ? 'border-[#B8E8C6] bg-[#E5F9EA] text-[#16753A]' : 'border-[#B8E8C6] bg-[#E5F9EA] text-[#16753A] hover:bg-[#D9F4E0]'}`}>
              {locating ? <Loader2 className="h-5 w-5 animate-spin" /> : coordinates ? <CheckCircle2 className="h-5 w-5" /> : <LocateFixed className="h-5 w-5" />}
              {locating ? 'Getting Current Location…' : coordinates ? 'Location Captured ✓' : 'Use Current Location'}
            </button>
          </FieldRow>
          {coordinates && <p className="-mt-1 px-2 text-[11px] text-[#687185]">GPS location captured. It will be submitted with your application.</p>}

          <FieldRow icon={<ImageIcon className="h-6 w-6" />} tone="pink">
            <div className="grid grid-cols-3 gap-1.5">
              {shopPhotos.map((src, index) => (
                <button key={index} type="button" onClick={() => pick(`shop-${index}`)} className={`relative flex h-[76px] min-w-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-dashed ${index < 2 ? 'border-[#F08AB5] bg-[#FFF5F9]' : 'border-[#B8BED0] bg-[#F8F9FC]'}`}>
                  {src ? <img src={src} alt={`Shop photo ${index + 1}`} className="absolute inset-0 h-full w-full object-cover" /> : <><Camera className={`mb-1 h-5 w-5 ${index < 2 ? 'text-[#D92E72]' : 'text-[#75809B]'}`} /><span className="text-center text-[10px] font-semibold leading-tight text-[#424A60]">Add Photo</span><span className="text-[9px] text-[#73798B]">{index < 2 ? 'Required' : 'Optional'}</span></>}
                  <input ref={(element) => { fileRefs.current[`shop-${index}`] = element; }} type="file" accept="image/*" className="hidden" onChange={onFile((url) => setShopPhotos((previous) => previous.map((value, i) => i === index ? url : value)))} />
                </button>
              ))}
            </div>
          </FieldRow>

          <FieldRow icon={<Scissors className="h-6 w-6" />} tone="purple">
            <button type="button" onClick={() => pick('chairs')} className="relative flex min-h-[96px] w-full items-center gap-3 overflow-hidden rounded-xl border border-dashed border-[#C8A4FF] bg-[#FBF8FF] px-3 py-3 text-left">
              {chairPhoto && <img src={chairPhoto} alt="Chair photo preview" className="absolute inset-0 h-full w-full object-cover" />}
              {!chairPhoto && <><Camera className="h-7 w-7 shrink-0 text-[#7540D8]" /><span className="h-10 w-px shrink-0 bg-[#D8C5F5]" /><span className="min-w-0"><span className="block text-sm font-bold text-[#7540D8]">Add Chair Photo</span><span className="mt-0.5 block text-xs leading-snug text-[#73798B]">Show the number of chairs / seats inside your shop</span></span></>}
              <input ref={(element) => { fileRefs.current.chairs = element; }} type="file" accept="image/*" className="hidden" onChange={onFile(setChairPhoto)} />
            </button>
          </FieldRow>

          <FieldRow icon={<User className="h-6 w-6" />} tone="orange">
            <button type="button" onClick={() => pick('profile')} className="relative flex min-h-[96px] w-full items-center gap-3 overflow-hidden rounded-xl border border-dashed border-[#F5B17E] bg-[#FFF9F3] px-3 py-3 text-left">
              {profilePhoto && <img src={profilePhoto} alt="Profile photo preview" className="absolute inset-0 h-full w-full object-cover" />}
              {!profilePhoto && <><Camera className="h-7 w-7 shrink-0 text-[#E96A12]" /><span className="h-10 w-px shrink-0 bg-[#F5D0B3]" /><span className="min-w-0"><span className="block text-sm font-bold text-[#E96A12]">Add Profile Photo</span><span className="mt-0.5 block text-xs leading-snug text-[#73798B]">Upload your professional profile photo</span></span></>}
              <input ref={(element) => { fileRefs.current.profile = element; }} type="file" accept="image/*" className="hidden" onChange={onFile(setProfilePhoto)} />
            </button>
          </FieldRow>

          <div className="flex items-start gap-2 rounded-xl border border-[#ECECF1] bg-white p-3 text-xs leading-relaxed text-[#73798B]">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#7540D8]" />
            <p>We verify all details to ensure trust and safety for our customers. You will be notified once your shop is approved.</p>
          </div>

          <Button type="submit" disabled={loading || locating} className="h-13 w-full rounded-2xl bg-gradient-to-r from-[#FF6A00] to-[#FF8A18] text-base font-bold text-white shadow-none hover:from-[#F56500] hover:to-[#F98010]">
            {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</> : <><Send className="h-5 w-5" /> Submit for Approval</>}
          </Button>
        </form>
      </motion.main>
    </div>
  );
}
