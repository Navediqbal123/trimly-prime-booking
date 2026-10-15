import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Scissors, Mail, Lock, Loader2, Eye, EyeOff, User, Phone } from 'lucide-react';
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
    <main className="min-h-screen w-full bg-background px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-md flex-col">
        <header className="mb-7 text-center">
          <div className="inline-flex items-baseline justify-center text-[34px] font-extrabold leading-none tracking-[-1.4px]">
            <span className="text-foreground">Trimly</span><span className="text-[#ff7417]">Hub</span>
          </div>
          <p className="mt-2 text-sm font-medium text-muted-foreground">Your style, your way.</p>
        </header>

        <section className="rounded-[28px] border border-border bg-card p-5 shadow-[6px_7px_16px_rgba(0,0,0,0.08),-5px_-5px_13px_rgba(255,255,255,0.95)] sm:p-7">
          <div className="mb-6 flex h-12 w-full rounded-full border border-border bg-muted p-1 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.04),inset_-2px_-2px_5px_rgba(255,255,255,0.95)]">
            <button type="button" onClick={() => { if (isSignUp) toggleMode(); }} className={`h-full flex-1 rounded-full text-sm font-bold transition-colors duration-150 ${!isSignUp ? 'bg-[#f97316] text-white shadow-[5px_6px_12px_rgba(194,65,12,0.24),inset_1px_1px_3px_rgba(255,255,255,0.28),inset_-2px_-2px_4px_rgba(154,52,18,0.20)]' : 'text-muted-foreground hover:text-foreground'}`}>
              Sign In
            </button>
            <button type="button" onClick={() => { if (!isSignUp) toggleMode(); }} className={`h-full flex-1 rounded-full text-sm font-bold transition-colors duration-150 ${isSignUp ? 'bg-[#f97316] text-white shadow-[5px_6px_12px_rgba(194,65,12,0.24),inset_1px_1px_3px_rgba(255,255,255,0.28),inset_-2px_-2px_4px_rgba(154,52,18,0.20)]' : 'text-muted-foreground hover:text-foreground'}`}>
              Sign Up
            </button>
          </div>

          <div className="mb-6">
            <h1 className="text-[26px] font-extrabold leading-tight tracking-[-0.7px] text-foreground">{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{isSignUp ? 'Enter your details to get started.' : 'Sign in to continue to TrimlyHub.'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-sm font-semibold text-foreground">Full Name</Label>
                <div className="flex min-h-[52px] items-center gap-3 rounded-[18px] border border-border bg-background px-3 shadow-[4px_5px_10px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.95)] focus-within:border-orange-300">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-[#fff0e5] text-[#e85d04] shadow-[2px_3px_6px_rgba(0,0,0,0.07),inset_1px_1px_3px_rgba(255,255,255,0.9)]"><User className="h-[18px] w-[18px]" /></span>
                  <Input id="name" name="name" type="text" autoComplete="name" placeholder="Your full name" value={formData.name} onChange={handleChange} className="h-11 border-0 bg-transparent px-0 text-foreground text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
                </div>
                {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
              </div>
            )}

            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-sm font-semibold text-foreground">Phone Number <span className="font-normal text-muted-foreground">(optional)</span></Label>
                <div className="flex min-h-[52px] items-center gap-3 rounded-[18px] border border-border bg-background px-3 shadow-[4px_5px_10px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.95)] focus-within:border-orange-300">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-[#f0eaff] text-[#7c3aed] shadow-[2px_3px_6px_rgba(0,0,0,0.07),inset_1px_1px_3px_rgba(255,255,255,0.9)]"><Phone className="h-[18px] w-[18px]" /></span>
                  <Input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="Phone number" value={formData.phone} onChange={handleChange} className="h-11 border-0 bg-transparent px-0 text-foreground text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-semibold text-foreground">Email Address</Label>
              <div className="flex min-h-[52px] items-center gap-3 rounded-[18px] border border-border bg-background px-3 shadow-[4px_5px_10px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.95)] focus-within:border-orange-300">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-[#e8f3ff] text-[#1971c2] shadow-[2px_3px_6px_rgba(0,0,0,0.07),inset_1px_1px_3px_rgba(255,255,255,0.9)]"><Mail className="h-[18px] w-[18px]" /></span>
                <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={formData.email} onChange={handleChange} className="h-11 border-0 bg-transparent px-0 text-foreground text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
              </div>
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground">Password</Label>
              <div className="flex min-h-[52px] items-center gap-3 rounded-[18px] border border-border bg-background px-3 shadow-[4px_5px_10px_rgba(0,0,0,0.06),-3px_-3px_8px_rgba(255,255,255,0.95)] focus-within:border-orange-300">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[13px] bg-[#ffe8ee] text-[#e11d48] shadow-[2px_3px_6px_rgba(0,0,0,0.07),inset_1px_1px_3px_rgba(255,255,255,0.9)]"><Lock className="h-[18px] w-[18px]" /></span>
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isSignUp ? 'new-password' : 'current-password'} placeholder="Enter your password" value={formData.password} onChange={handleChange} className="h-11 min-w-0 border-0 bg-transparent px-0 text-foreground text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:text-[#f97316]">{showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}</button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              {!isSignUp && <div className="text-right"><Link to="/forgot-password" className="text-sm font-semibold text-[#f97316] hover:underline">Forgot Password?</Link></div>}
            </div>

            {isSignUp && (
              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => { setTermsAccepted(e.target.checked); setErrors((prev) => ({ ...prev, terms: '' })); }} className="mt-0.5 h-4 w-4 shrink-0 accent-[#f97316]" />
                  <span>I agree to the <a href="/terms-of-use.html" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#f97316] hover:underline">Terms of Use</a>.</span>
                </label>
                {errors.terms && <p className="text-sm text-red-500">{errors.terms}</p>}
                <label className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
                  <input type="checkbox" checked={privacyAcknowledged} onChange={(e) => { setPrivacyAcknowledged(e.target.checked); setErrors((prev) => ({ ...prev, privacy: '' })); }} className="mt-0.5 h-4 w-4 shrink-0 accent-[#f97316]" />
                  <span>I acknowledge the <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="font-semibold text-[#f97316] hover:underline">Privacy Policy</a>.</span>
                </label>
                {errors.privacy && <p className="text-sm text-red-500">{errors.privacy}</p>}
              </div>
            )}

            <Button type="submit" disabled={loading} className="mt-2 h-12 w-full rounded-full border-0 bg-[#f97316] text-sm font-bold text-white shadow-[6px_7px_14px_rgba(194,65,12,0.28),inset_2px_2px_5px_rgba(255,255,255,0.30),inset_-3px_-3px_6px_rgba(154,52,18,0.25)] transition-transform duration-150 hover:bg-[#f97316] active:translate-y-[1px] active:shadow-[3px_4px_8px_rgba(194,65,12,0.22)] disabled:cursor-not-allowed disabled:opacity-70">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Please wait...</> : isSignUp ? 'Create Account' : 'Sign In'}
            </Button>

            {isSignUp && emailExists && (
              <div className="rounded-2xl border border-red-300/40 bg-red-50/70 p-3.5 dark:bg-red-950/30">
                <p className="text-sm font-medium text-red-600">This email is already registered. Please login instead.</p>
                <Button type="button" variant="outline" onClick={switchToLogin} className="mt-3 h-10 w-full rounded-full border-orange-300/50 font-bold text-[#f97316] hover:bg-orange-50 dark:hover:bg-orange-950/30">Sign In Instead</Button>
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={toggleMode} className="font-bold text-[#f97316] hover:underline">{isSignUp ? 'Sign In' : 'Sign Up'}</button>
          </p>
        </section>

        <footer className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <a href="/terms-of-use.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#f97316]">Terms</a><span>·</span>
          <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#f97316]">Privacy</a><span>·</span>
          <a href="/refund-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#f97316]">Refund Policy</a><span>·</span>
          <a href="/contact-us.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#f97316]">Contact</a><span>·</span>
          <a href="/delete-account.html" target="_blank" rel="noopener noreferrer" className="hover:text-[#f97316]">Delete Account</a>
        </footer>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">© 2026 TrimlyHub. All rights reserved.</p>
      </div>
    </main>
  );
}
