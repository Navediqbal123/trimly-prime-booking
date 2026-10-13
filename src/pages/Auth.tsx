import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Loader2, Eye, EyeOff, User, Phone } from 'lucide-react';
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
    <div className="trimly-auth-page relative min-h-screen overflow-x-hidden px-3 py-6 sm:px-6 sm:py-10">
      {/* Soft decorative background shapes */}
      <div aria-hidden="true" className="pointer-events-none absolute -left-20 -top-16 h-64 w-64 rounded-full bg-orange-300/60 blur-[2px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-16 h-72 w-72 rounded-full bg-violet-300/60 blur-[2px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-violet-300/50 blur-[2px]" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-orange-200/70 blur-[2px]" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col items-center justify-center">
        {/* Brand header: no character/hero graphic */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-7 flex flex-col items-center text-center sm:mb-8"
        >
          <div className="text-[3.35rem] font-black leading-none tracking-[-0.07em] sm:text-6xl">
            <span className="text-slate-950">Trim</span><span className="text-orange-500">ly</span>
          </div>
          <p className="mt-2 text-base font-semibold tracking-tight text-slate-600 sm:text-xl">Book Your Style</p>
          <div className="mt-2 h-1.5 w-36 rounded-full bg-gradient-to-r from-orange-500 via-orange-400 to-amber-500 shadow-[0_3px_0_rgba(234,88,12,0.15)]" />
        </motion.div>

        {/* Main auth card */}
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="w-full rounded-[2rem] border border-white/90 bg-white/75 p-4 shadow-[0_24px_65px_rgba(91,63,139,0.18),inset_0_2px_3px_rgba(255,255,255,0.95)] backdrop-blur-xl sm:p-7 md:p-9"
        >
          {/* 3D mode switch */}
          <div className="mb-7 grid grid-cols-2 gap-2 rounded-full border border-white bg-orange-50/80 p-2 shadow-[inset_0_3px_8px_rgba(124,45,18,0.08),0_8px_18px_rgba(124,45,18,0.08)] sm:mb-8">
            <button
              type="button"
              onClick={() => { if (!isSignUp) toggleMode(); }}
              aria-pressed={isSignUp}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-full px-3 py-3 text-base font-bold transition-all duration-200 sm:text-lg ${isSignUp ? 'bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 text-white shadow-[0_6px_0_#c2410c,0_12px_22px_rgba(234,88,12,0.32),inset_0_2px_2px_rgba(255,255,255,0.55)]' : 'bg-white/80 text-slate-700 shadow-[0_4px_10px_rgba(71,45,30,0.10),inset_0_2px_2px_white] hover:bg-white'}`}
            >
              <User className={`h-5 w-5 ${isSignUp ? 'text-white' : 'text-orange-600'}`} />
              Sign Up
            </button>
            <button
              type="button"
              onClick={() => { if (isSignUp) switchToLogin(); }}
              aria-pressed={!isSignUp}
              className={`flex min-h-14 items-center justify-center gap-2 rounded-full px-3 py-3 text-base font-bold transition-all duration-200 sm:text-lg ${!isSignUp ? 'bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 text-white shadow-[0_6px_0_#c2410c,0_12px_22px_rgba(234,88,12,0.32),inset_0_2px_2px_rgba(255,255,255,0.55)]' : 'bg-white/80 text-slate-700 shadow-[0_4px_10px_rgba(71,45,30,0.10),inset_0_2px_2px_white] hover:bg-white'}`}
            >
              <User className={`h-5 w-5 ${!isSignUp ? 'text-white' : 'text-orange-600'}`} />
              Sign In
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isSignUp ? 'signup' : 'signin'}
              initial={{ opacity: 0, x: isSignUp ? 18 : -18 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isSignUp ? -18 : 18 }}
              transition={{ duration: 0.24 }}
            >
              <div className="mb-6 text-center sm:mb-7">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl md:text-4xl">
                  {isSignUp ? <>Create Your <span className="text-orange-500">Account</span></> : <>Welcome <span className="text-orange-500">Back</span></>}
                </h1>
                <p className="mt-2 text-sm font-medium text-slate-500 sm:text-base">
                  {isSignUp ? 'Join Trimlyhub and start your journey today' : 'Sign in to continue to your Trimly account'}
                </p>
              </div>

              <motion.form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" variants={staggerChildren} initial="initial" animate="animate">
                {isSignUp && (
                  <motion.div variants={childFade} className="space-y-1.5">
                    <Label htmlFor="name" className="pl-1 text-sm font-semibold text-slate-700">Full Name</Label>
                    <div className="trimly-auth-field flex items-center gap-3 rounded-[1.45rem] border border-white bg-white/85 p-2.5 shadow-[0_8px_16px_rgba(70,50,90,0.10),inset_0_2px_3px_white] sm:p-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-red-400 to-red-600 text-white shadow-[0_4px_0_#b91c1c,0_7px_12px_rgba(239,68,68,0.25),inset_0_2px_2px_rgba(255,255,255,0.55)] sm:h-14 sm:w-14"><User className="h-6 w-6" /></span>
                      <Input id="name" name="name" type="text" autoComplete="name" placeholder="John Doe" value={formData.name} onChange={handleChange} className="h-12 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-slate-800 shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-lg" />
                    </div>
                    {errors.name && <motion.p {...fadeSlide} className="px-2 text-sm text-destructive">{errors.name}</motion.p>}
                  </motion.div>
                )}

                {isSignUp && (
                  <motion.div variants={childFade} className="space-y-1.5">
                    <Label htmlFor="phone" className="pl-1 text-sm font-semibold text-slate-700">Phone Number</Label>
                    <div className="trimly-auth-field flex items-center gap-3 rounded-[1.45rem] border border-white bg-white/85 p-2.5 shadow-[0_8px_16px_rgba(70,50,90,0.10),inset_0_2px_3px_white] sm:p-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-violet-400 to-violet-600 text-white shadow-[0_4px_0_#6d28d9,0_7px_12px_rgba(139,92,246,0.25),inset_0_2px_2px_rgba(255,255,255,0.55)] sm:h-14 sm:w-14"><Phone className="h-6 w-6" /></span>
                      <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+91 9876543210" value={formData.phone} onChange={handleChange} className="h-12 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-slate-800 shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-lg" />
                    </div>
                  </motion.div>
                )}

                <motion.div variants={childFade} className="space-y-1.5">
                  <Label htmlFor="email" className="pl-1 text-sm font-semibold text-slate-700">Email Address</Label>
                  <div className="trimly-auth-field flex items-center gap-3 rounded-[1.45rem] border border-white bg-white/85 p-2.5 shadow-[0_8px_16px_rgba(70,50,90,0.10),inset_0_2px_3px_white] sm:p-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-sky-400 to-blue-600 text-white shadow-[0_4px_0_#1d4ed8,0_7px_12px_rgba(59,130,246,0.25),inset_0_2px_2px_rgba(255,255,255,0.55)] sm:h-14 sm:w-14"><Mail className="h-6 w-6" /></span>
                    <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} className="h-12 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-slate-800 shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-lg" />
                  </div>
                  {errors.email && <motion.p {...fadeSlide} className="px-2 text-sm text-destructive">{errors.email}</motion.p>}
                </motion.div>

                <motion.div variants={childFade} className="space-y-1.5">
                  <Label htmlFor="password" className="pl-1 text-sm font-semibold text-slate-700">Password</Label>
                  <div className="trimly-auth-field flex items-center gap-3 rounded-[1.45rem] border border-white bg-white/85 p-2.5 shadow-[0_8px_16px_rgba(70,50,90,0.10),inset_0_2px_3px_white] sm:p-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-rose-400 to-pink-600 text-white shadow-[0_4px_0_#be123c,0_7px_12px_rgba(244,63,94,0.25),inset_0_2px_2px_rgba(255,255,255,0.55)] sm:h-14 sm:w-14"><Lock className="h-6 w-6" /></span>
                    <Input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder="Enter your password" value={formData.password} onChange={handleChange} className="h-12 min-w-0 flex-1 border-0 bg-transparent px-1 text-base text-slate-800 shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0 sm:text-lg" />
                    <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-slate-600 transition hover:bg-violet-200">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {errors.password && <motion.p {...fadeSlide} className="px-2 text-sm text-destructive">{errors.password}</motion.p>}
                  {!isSignUp && <div className="pt-1 text-right"><Link to="/forgot-password" className="text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline">Forgot Password?</Link></div>}
                </motion.div>

                {isSignUp && (
                  <motion.div variants={childFade} className="space-y-3 px-1 pt-1">
                    <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-600">
                      <input type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); setErrors((prev) => ({ ...prev, terms: '' })); }} className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 accent-orange-500" />
                      <span>I agree to the <a href="/terms-of-use.html" target="_blank" rel="noopener noreferrer" className="font-bold text-violet-700 underline underline-offset-2">Terms of Use</a>.</span>
                    </label>
                    {errors.terms && <motion.p {...fadeSlide} className="pl-8 text-sm text-destructive">{errors.terms}</motion.p>}
                    <label className="flex cursor-pointer items-start gap-3 text-sm leading-6 text-slate-600">
                      <input type="checkbox" checked={privacyAcknowledged} onChange={(e) => { setPrivacyAcknowledged(e.target.checked); setErrors((prev) => ({ ...prev, privacy: '' })); }} className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 accent-orange-500" />
                      <span>I acknowledge the <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="font-bold text-violet-700 underline underline-offset-2">Privacy Policy</a>.</span>
                    </label>
                    {errors.privacy && <motion.p {...fadeSlide} className="pl-8 text-sm text-destructive">{errors.privacy}</motion.p>}
                  </motion.div>
                )}

                <motion.div variants={childFade} className="pt-2">
                  <button type="submit" disabled={loading} className="group relative flex min-h-[4.5rem] w-full items-center justify-center overflow-hidden rounded-full border-[4px] border-orange-300 bg-gradient-to-b from-orange-400 via-orange-500 to-orange-600 px-4 pl-[4.6rem] pr-12 text-base font-extrabold text-white shadow-[0_7px_0_#c2410c,0_15px_24px_rgba(234,88,12,0.28),inset_0_3px_3px_rgba(255,255,255,0.55)] transition hover:brightness-105 active:translate-y-1 active:shadow-[0_3px_0_#c2410c,0_8px_14px_rgba(234,88,12,0.24)] disabled:cursor-not-allowed disabled:opacity-70 sm:min-h-[5rem] sm:text-xl">
                    <span className="absolute left-1.5 flex h-12 w-12 items-center justify-center rounded-full border border-orange-100 bg-gradient-to-b from-white to-orange-50 text-orange-600 shadow-[0_3px_0_rgba(154,52,18,0.18),inset_0_2px_3px_white] sm:h-14 sm:w-14">
                      {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <span className="text-3xl leading-none">➜</span>}
                    </span>
                    <span>{loading ? (isSignUp ? 'Creating Account...' : 'Signing In...') : (isSignUp ? 'Slide to Sign Up' : 'Slide to Sign In')}</span>
                    {!loading && <span aria-hidden="true" className="absolute right-4 text-2xl tracking-[-0.2em] text-orange-100/80 sm:right-5 sm:text-3xl">›››</span>}
                  </button>
                </motion.div>

                <AnimatePresence>
                  {isSignUp && emailExists && (
                    <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -8, height: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }} className="overflow-hidden">
                      <div className="mt-4 space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4">
                        <p className="text-sm font-medium text-red-700">This email is already registered. Please login instead.</p>
                        <Button type="button" variant="outline" className="w-full rounded-xl border-orange-300 text-orange-700 hover:bg-orange-50" onClick={switchToLogin}>Login Instead</Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.form>

              <div className="mt-6 text-center">
                <p className="text-sm text-slate-600">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button type="button" onClick={toggleMode} className="font-bold text-orange-600 underline-offset-4 transition hover:text-orange-700 hover:underline">{isSignUp ? 'Sign In' : 'Sign Up'}</button>
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.section>

        {/* Policies & Support footer */}
        <motion.footer initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.4 }} className="mt-6 w-full rounded-[1.6rem] border border-white/90 bg-white/65 p-4 shadow-[0_12px_28px_rgba(91,63,139,0.12),inset_0_2px_3px_white] backdrop-blur-lg sm:mt-7 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-b from-violet-400 to-violet-600 text-white shadow-[0_4px_0_#6d28d9,0_7px_12px_rgba(139,92,246,0.22)]"><Lock className="h-6 w-6" /></div>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-slate-800">Policies &amp; Support</p>
              <div className="mt-1 flex flex-wrap gap-x-2 text-xs text-slate-500 sm:text-sm">
                <a href="/terms-of-use.html" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600">Terms</a><span>·</span>
                <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600">Privacy</a><span>·</span>
                <a href="/refund-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600">Refund</a><span>·</span>
                <a href="/contact-us.html" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600">Contact Us</a>
              </div>
            </div>
            <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-2xl text-violet-700">›</span>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 border-t border-violet-100 pt-3 text-xs text-slate-400">
            <a href="/delete-account.html" target="_blank" rel="noopener noreferrer" className="hover:text-orange-600">Delete Account</a>
            <span>·</span><span>© 2026 Trimlyhub. All rights reserved.</span>
          </div>
        </motion.footer>
      </div>
    </div>
  );
}
