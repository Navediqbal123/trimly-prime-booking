import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({ email: z.string().email('Please enter a valid email') });

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      return;
    }

    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (err) {
      toast.error(err.message);
      return;
    }

    setSent(true);
    toast.success('Password reset link sent to your email');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl shadow-black/5 sm:p-8"
      >
        <Link
          to="/auth"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>

        <h1 className="mb-2 font-display text-2xl font-bold text-foreground">Forgot Password</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {sent ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl border border-primary/40 bg-primary/10 p-5 text-center"
          >
            <CheckCircle className="mx-auto mb-3 h-8 w-8 text-primary" />
            <p className="font-medium text-foreground">Password reset link sent to your email</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check your inbox and follow the link to set a new password.
            </p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  aria-invalid={Boolean(error)}
                  className="h-11 border-border bg-background pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Reset Link'}
            </Button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
