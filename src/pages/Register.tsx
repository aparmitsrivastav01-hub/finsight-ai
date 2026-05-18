import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
      toast.success('Account created');
      navigate('/fingpt', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-obsidian text-soft-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border-mist bg-deep-slate/80 p-6 sm:p-8 shadow-teal-glow">
        <h1 className="font-sans text-xl font-bold tracking-tight mb-1">
          Create <span className="text-teal-core">account</span>
        </h1>
        <p className="font-body text-sm text-muted-ink mb-6">Join FinSight to use FinGPT</p>

        <GoogleAuthButton redirectTo="/fingpt" />

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <span className="w-full border-t border-border-mist" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest">
            <span className="bg-deep-slate/80 px-3 text-muted-ink font-mono">or</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-muted-ink">
              Username
            </Label>
            <Input
              id="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-surface-dark/60 border-border-mist text-soft-white"
              required
              minLength={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-muted-ink">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-surface-dark/60 border-border-mist text-soft-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-ink">
              Password (min 8)
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface-dark/60 border-border-mist text-soft-white"
              required
              minLength={8}
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-core/20 border border-teal-core/40 text-teal-core hover:bg-teal-core/30"
          >
            {loading ? 'Creating…' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-ink">
          Already have an account?{' '}
          <Link to="/login" className="text-teal-core hover:underline font-medium">
            Sign in
          </Link>
        </p>
        <p className="mt-3 text-center">
          <Link to="/" className="text-xs text-muted-ink hover:text-soft-white">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
