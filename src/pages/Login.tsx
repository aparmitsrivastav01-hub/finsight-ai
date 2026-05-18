import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || '/fingpt';

  const login = useAuthStore((s) => s.login);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      toast.success('Signed in');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-obsidian text-soft-white flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-border-mist bg-deep-slate/80 p-6 sm:p-8 shadow-teal-glow">
        <h1 className="font-sans text-xl font-bold tracking-tight mb-1">
          Fin<span className="text-teal-core">Sight</span>
        </h1>
        <p className="font-body text-sm text-muted-ink mb-6">Sign in to open FinGPT</p>

        <GoogleAuthButton redirectTo={from} />

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
            <Label htmlFor="identifier" className="text-muted-ink">
              Email or username
            </Label>
            <Input
              id="identifier"
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="bg-surface-dark/60 border-border-mist text-soft-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-muted-ink">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-surface-dark/60 border-border-mist text-soft-white"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-core/20 border border-teal-core/40 text-teal-core hover:bg-teal-core/30"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-ink">
          No account?{' '}
          <Link to="/register" className="text-teal-core hover:underline font-medium">
            Create one
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
