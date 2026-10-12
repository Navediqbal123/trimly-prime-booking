import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

const fadeSlide = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.35, ease: 'easeOut' as const },
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const childFade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [emailExists, setEmailExists] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);

  const { signIn, signUp, user, loading: authLoading } = useAuth();

  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    if (name === 'email') setEmailExists(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setEmailExists(false);

    try {
     if (isSignUp) {
  const result = signupSchema.safeParse(formData);

  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    result.error.errors.forEach((err) => {
      if (err.path[0]) {
        fieldErrors[err.path[0] as string] = err.message;
      }
    });
    setErrors(fieldErrors);
    return;
  }

  if (!termsAccepted) {
    setErrors({ terms: 'Please accept the Terms of Use.' });
    return;
  }

  if (!privacyAcknowledged) {
    setErrors({ privacy: 'Please acknowledge the Privacy Policy.' });
    return;
  }

  setLoading(true);
       const signUpResult = await signUp(
  formData.name,
  formData.email,
  formData.password,
  formData.phone,
  termsAccepted,
  privacyAcknowledged
);

        if (signUpResult.error) {
          const msg = signUpResult.error.message?.toLowerCase() || '';
          if (
            msg.includes('already registered') ||
            msg.includes('already exists') ||
            msg.includes('user already') ||
            msg.includes('email address is already') ||
            msg.includes('duplicate')
          ) {
            setEmailExists(true);
            setErrors({ email: 'This email is already registered. Please login instead.' });
            toast.error('This email is already registered. Please login instead.');
          } else {
            toast.error(signUpResult.error.message);
          }
        } else if ((signUpResult as any).needsConfirmation) {
          toast.success('Account created! Please check your email to confirm, then sign in.');
          setIsSignUp(false);
          setFormData({ name: '', email: '', password: '', phone: '' });
          setTermsAccepted(false);
          setPrivacyAcknowledged(false);
        } else {
          toast.success('Account created successfully!');
        }
      } else {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          return;
        }

        setLoading(true);
        const { error } = await signIn(formData.email, formData.password);

        if (error) {
          if (error.message.includes('Invalid login credentials') || error.message.includes('Invalid')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success('Welcome back!');
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setEmailExists(false);
    setFormData({ name: '', email: '', password: '', phone: '' });
    setTermsAccepted(false);
setPrivacyAcknowledged(false);
  };

  const switchToLogin = () => {
    setTermsAccepted(false);
setPrivacyAcknowledged(false);
    setIsSignUp(false);
    setErrors({});
    setEmailExists(false);
    setFormData((prev) => ({ name: '', email: prev.email, password: '', phone: '' }));
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffaf6] text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-56 h-64 w-64 rounded-full bg-orange-200/50 blur-3xl" />
        <div className="absolute -right-20 top-8 h-72 w-72 rounded-full bg-amber-100/70 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-20 w-full bg-gradient-to-r from-orange-200 via-orange-100 to-amber-200" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 pb-8 pt-4 sm:px-6 sm:pt-6">
        <header className="relative mb-5 overflow-hidden rounded-[2rem] border border-white/90 bg-gradient-to-br from-white via-[#fff8f2] to-orange-100/70 px-5 py-5 shadow-[0_16px_35px_rgba(110,66,35,0.12)] sm:mb-7 sm:px-9 sm:py-7">
          <div className="absolute -right-8 -top-10 h-44 w-44 rounded-full bg-orange-200/30 blur-2xl" />
          <div className="relative z-10 flex items-start justify-between gap-3">
            <button type="button" onClick={() => window.history.back()} aria-label="Go back" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white bg-white/90 text-slate-600 shadow-[0_5px_12px_rgba(70,48,38,0.15)] transition hover:-translate-y-0.5">
              <span className="text-2xl leading-none">←</span>
            </button>
            <div className="flex-1 pt-1 text-center sm:pt-2">
              <div className="text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">Trimly<span className="text-orange-500">hub</span></div>
              <div className="mx-auto mt-1 h-1 w-40 -rotate-2 rounded-full bg-orange-500 sm:w-64" />
              <p className="mt-1 text-sm font-semibold text-slate-600 sm:text-lg">Book Your Style</p>
            </div>
            <div className="hidden h-11 w-11 shrink-0 sm:block" />
          </div>
          <div className="relative mt-4 flex items-center justify-center sm:absolute sm:bottom-0 sm:right-7 sm:mt-0 sm:h-full sm:w-1/3">
            <div className="flex h-20 w-20 items-center justify-center rounded-[1.7rem] border border-white bg-gradient-to-br from-orange-100 to-orange-300 text-5xl shadow-[inset_4px_4px_9px_rgba(255,255,255,0.9),5px_8px_14px_rgba(130,75,30,0.18)] sm:h-28 sm:w-28 sm:text-6xl">✂️</div>
            <div className="absolute -bottom-1 right-[22%] hidden rounded-full border border-white bg-white/90 px-3 py-1 text-xs font-bold text-orange-600 shadow sm:block">YOUR STYLE, YOUR WAY</div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-3xl">
          <div className="mb-[-1.1rem] flex rounded-full border border-white bg-white/90 p-1.5 shadow-[0_9px_22px_rgba(104,68,47,0.16)] sm:mb-[-1.35rem] sm:p-2">
            <button type="button" onClick={() => { if (!isSignUp) toggleMode(); }} className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-bold transition-all sm:gap-3 sm:py-4 sm:text-lg ${isSignUp ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.45),0_5px_12px_rgba(234,88,12,0.28)]' : 'text-slate-600 hover:bg-orange-50'}`}>
              <span className="text-xl sm:text-2xl">♟</span><span>Sign Up</span>
            </button>
            <div className="z-10 -mx-2 flex h-11 w-11 shrink-0 items-center justify-center self-center rounded-full border border-white bg-gradient-to-br from-white to-slate-100 text-lg text-slate-600 shadow-[0_4px_12px_rgba(65,57,55,0.2)] sm:h-14 sm:w-14 sm:text-xl">‹›</div>
            <button type="button" onClick={() => { if (isSignUp) toggleMode(); }} className={`flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 py-3 text-sm font-bold transition-all sm:gap-3 sm:py-4 sm:text-lg ${!isSignUp ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow-[inset_0_2px_3px_rgba(255,255,255,0.45),0_5px_12px_rgba(234,88,12,0.28)]' : 'text-slate-600 hover:bg-orange-50'}`}>
              <span className="text-xl sm:text-2xl">♟</span><span>Sign In</span>
            </button>
          </div>

          <div className="rounded-[2rem] border border-white/95 bg-white/75 px-4 pb-6 pt-9 shadow-[0_18px_45px_rgba(93,59,39,0.15),inset_0_2px_5px_rgba(255,255,255,0.95)] backdrop-blur-sm sm:px-8 sm:pb-8 sm:pt-12">
            <AnimatePresence mode="wait">
              <motion.div key={isSignUp ? 'signup' : 'signin'} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                <div className="mb-6 text-center sm:mb-7">
                  <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">{isSignUp ? <>Create Your <span className="text-orange-500">Account</span></> : <>Welcome <span className="text-orange-500">Back</span></>}</h1>
                  <p className="mt-2 text-sm text-slate-500 sm:text-base">{isSignUp ? 'Join Trimlyhub and book your next style.' : 'Sign in to manage your appointments.'}</p>
                </div>

                <motion.form id="trimly-auth-form" onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4" variants={staggerChildren} initial="initial" animate="animate">
                  {isSignUp && (
                    <motion.div variants={childFade} className="relative flex min-h-[78px] items-center gap-3 rounded-[1.5rem] border border-white bg-gradient-to-r from-white to-[#f5f3f2] p-3 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_6px_12px_rgba(89,65,51,0.12)] sm:gap-4 sm:p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white bg-gradient-to-br from-orange-50 to-orange-200 text-2xl shadow-[0_4px_8px_rgba(100,60,30,0.16)] sm:h-14 sm:w-14">👤</div>
                      <div className="min-w-0 flex-1"><Label htmlFor="name" className="text-sm font-semibold text-slate-700 sm:text-base">Full Name</Label><Input id="name" name="name" type="text" placeholder="John Doe" value={formData.name} onChange={handleChange} className="h-8 border-0 bg-transparent px-0 text-base shadow-none placeholder:text-slate-400 focus-visible:ring-0 sm:text-lg" /></div>
                      {errors.name && <p className="absolute -bottom-5 left-4 text-xs text-red-600">{errors.name}</p>}
                    </motion.div>
                  )}
                  {isSignUp && (
                    <motion.div variants={childFade} className="relative flex min-h-[78px] items-center gap-3 rounded-[1.5rem] border border-white bg-gradient-to-r from-white to-[#f5f3f2] p-3 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_6px_12px_rgba(89,65,51,0.12)] sm:gap-4 sm:p-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white bg-gradient-to-br from-green-50 to-green-200 text-2xl shadow-[0_4px_8px_rgba(100,60,30,0.16)] sm:h-14 sm:w-14">📞</div>
                      <div className="min-w-0 flex-1"><Label htmlFor="phone" className="text-sm font-semibold text-slate-700 sm:text-base">Phone Number</Label><Input id="phone" name="phone" type="tel" placeholder="+91 9876543210" value={formData.phone} onChange={handleChange} className="h-8 border-0 bg-transparent px-0 text-base shadow-none placeholder:text-slate-400 focus-visible:ring-0 sm:text-lg" /></div>
                    </motion.div>
                  )}
                  <motion.div variants={childFade} className="relative flex min-h-[78px] items-center gap-3 rounded-[1.5rem] border border-white bg-gradient-to-r from-white to-[#f5f3f2] p-3 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_6px_12px_rgba(89,65,51,0.12)] sm:gap-4 sm:p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white bg-gradient-to-br from-blue-50 to-blue-200 text-2xl shadow-[0_4px_8px_rgba(100,60,30,0.16)] sm:h-14 sm:w-14">✉️</div>
                    <div className="min-w-0 flex-1"><Label htmlFor="email" className="text-sm font-semibold text-slate-700 sm:text-base">Email Address</Label><Input id="email" name="email" type="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} className="h-8 border-0 bg-transparent px-0 text-base shadow-none placeholder:text-slate-400 focus-visible:ring-0 sm:text-lg" /></div>
                    {errors.email && <p className="absolute -bottom-5 left-4 text-xs text-red-600">{errors.email}</p>}
                  </motion.div>
                  <motion.div variants={childFade} className="relative flex min-h-[78px] items-center gap-3 rounded-[1.5rem] border border-white bg-gradient-to-r from-white to-[#f5f3f2] p-3 shadow-[inset_0_2px_4px_rgba(255,255,255,1),0_6px_12px_rgba(89,65,51,0.12)] sm:gap-4 sm:p-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white bg-gradient-to-br from-purple-50 to-purple-200 text-2xl shadow-[0_4px_8px_rgba(100,60,30,0.16)] sm:h-14 sm:w-14">🔒</div>
                    <div className="min-w-0 flex-1"><Label htmlFor="password" className="text-sm font-semibold text-slate-700 sm:text-base">Password</Label><Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={formData.password} onChange={handleChange} className="h-8 border-0 bg-transparent px-0 text-base shadow-none placeholder:text-slate-400 focus-visible:ring-0 sm:text-lg" /></div>
                    <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200">{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button>
                    {errors.password && <p className="absolute -bottom-5 left-4 text-xs text-red-600">{errors.password}</p>}
                    {!isSignUp && <Link to="/forgot-password" className="absolute -bottom-6 right-3 text-xs font-semibold text-orange-600 hover:underline">Forgot Password?</Link>}
                  </motion.div>

                  {isSignUp && <motion.div variants={childFade} className="mt-5 rounded-[1.5rem] border border-orange-100 bg-gradient-to-br from-orange-50 to-[#fff0df] p-4 shadow-[inset_0_2px_5px_rgba(255,255,255,0.9),0_6px_12px_rgba(89,65,51,0.1)] sm:p-5">
                    <label className="flex cursor-pointer items-start gap-3 text-sm text-slate-700 sm:text-base"><input type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); setErrors((prev) => ({ ...prev, terms: '' })); }} className="mt-0.5 h-5 w-5 shrink-0 accent-orange-500" /><span>I agree to the <a href="/terms-of-use.html" target="_blank" rel="noopener noreferrer" className="font-bold text-orange-600 underline underline-offset-2">Terms of Use</a>.</span></label>
                    {errors.terms && <p className="mt-1 pl-8 text-xs text-red-600">{errors.terms}</p>}
                    <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-slate-700 sm:text-base"><input type="checkbox" checked={privacyAcknowledged} onChange={(e) => { setPrivacyAcknowledged(e.target.checked); setErrors((prev) => ({ ...prev, privacy: '' })); }} className="mt-0.5 h-5 w-5 shrink-0 accent-orange-500" /><span>I acknowledge the <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="font-bold text-orange-600 underline underline-offset-2">Privacy Policy</a>.</span></label>
                    {errors.privacy && <p className="mt-1 pl-8 text-xs text-red-600">{errors.privacy}</p>}
                  </motion.div>}

                  <motion.div variants={childFade} className="pt-2">
                    <Button type="submit" disabled={loading} className="group relative flex h-[62px] w-full items-center justify-center overflow-hidden rounded-full border border-orange-300 bg-gradient-to-r from-orange-500 via-orange-500 to-orange-400 text-base font-extrabold text-white shadow-[inset_0_3px_5px_rgba(255,255,255,0.35),0_8px_18px_rgba(234,88,12,0.28)] transition hover:-translate-y-0.5 hover:from-orange-600 hover:to-orange-500 sm:h-[72px] sm:text-xl">
                      <span className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full border border-white bg-gradient-to-br from-white to-orange-50 text-2xl text-orange-600 shadow-[0_3px_8px_rgba(100,50,20,0.2)] sm:left-2.5 sm:h-14 sm:w-14">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : '➜'}</span>
                      <span>{loading ? 'Please wait…' : isSignUp ? 'Slide to Sign Up' : 'Slide to Sign In'}</span><span className="absolute right-4 text-2xl text-orange-200 sm:right-6 sm:text-3xl">›››</span>
                    </Button>
                  </motion.div>
                  <AnimatePresence>{isSignUp && emailExists && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-2xl border border-red-200 bg-red-50 p-4"><p className="mb-3 text-sm font-medium text-red-700">This email is already registered. Please login instead.</p><Button type="button" variant="outline" className="w-full rounded-full border-orange-300 text-orange-700" onClick={switchToLogin}>Login Instead</Button></motion.div>}</AnimatePresence>
                </motion.form>
                <p className="mt-5 text-center text-sm text-slate-500">{isSignUp ? 'Already have an account?' : "Don't have an account?"} <button type="button" onClick={toggleMode} className="font-bold text-orange-600 hover:underline">{isSignUp ? 'Sign In' : 'Sign Up'}</button></p>
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="mt-5 rounded-full border border-white bg-white/85 px-4 py-3 shadow-[0_7px_18px_rgba(89,65,51,0.12)] sm:mt-6 sm:px-6 sm:py-4">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 to-violet-300 text-2xl shadow">📄</div><div className="min-w-0 flex-1"><p className="font-extrabold text-slate-900">Policies &amp; Support</p><div className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-500 sm:text-sm"><a href="/terms-of-use.html" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600">Terms</a><span>·</span><a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600">Privacy</a><span>·</span><a href="/refund-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600">Refund</a><span>·</span><a href="/contact-us.html" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600">Contact Us</a><span>·</span><a href="/delete-account.html" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600">Delete Account</a></div></div><span className="text-2xl text-slate-500">›</span></div>
            <p className="mt-3 text-center text-[11px] text-slate-400">© 2026 Trimlyhub. All rights reserved.</p>
          </footer>
        </section>
      </main>
    </div>
  );
}