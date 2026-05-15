import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useAuthStore } from '@/stores/authStore';
import type { AppModelId } from '@/stores/settingsStore';
import { useSettingsStore } from '@/stores/settingsStore';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * FinGPT settings: theme, model preference, temperature, API base URL override, logout.
 */
export default function FinGPTSettingsModal({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const logout = useAuthStore((s) => s.logout);

  const apiBaseUrl = useSettingsStore((s) => s.apiBaseUrl);
  const setApiBaseUrl = useSettingsStore((s) => s.setApiBaseUrl);
  const model = useSettingsStore((s) => s.model);
  const setModel = useSettingsStore((s) => s.setModel);
  const temperature = useSettingsStore((s) => s.temperature);
  const setTemperature = useSettingsStore((s) => s.setTemperature);

  const [localUrl, setLocalUrl] = useState(apiBaseUrl);

  useEffect(() => {
    if (open) setLocalUrl(apiBaseUrl);
  }, [open, apiBaseUrl]);

  const isDark = (resolvedTheme ?? theme ?? 'dark') === 'dark';

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out');
      onOpenChange(false);
      navigate('/login', { replace: true });
    } catch {
      toast.error('Logout failed');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-border-mist bg-deep-slate text-soft-white sm:rounded-xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-sans text-lg">Settings</DialogTitle>
          <DialogDescription className="text-muted-ink text-sm">
            Appearance, model preferences, and API configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-soft-white">Dark mode</Label>
              <p className="text-xs text-muted-ink mt-0.5">Toggle FinSight theme</p>
            </div>
            <Switch
              checked={isDark}
              onCheckedChange={(v) => setTheme(v ? 'dark' : 'light')}
              aria-label="Toggle dark mode"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-soft-white">Model</Label>
            <Select value={model} onValueChange={(v) => setModel(v as AppModelId)}>
              <SelectTrigger className="bg-surface-dark/60 border-border-mist text-soft-white">
                <SelectValue placeholder="Model" />
              </SelectTrigger>
              <SelectContent className="bg-deep-slate border-border-mist text-soft-white">
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o mini</SelectItem>
                <SelectItem value="deepseek-r1">DeepSeek R1 (local)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-muted-ink">
              Stored for future API routing; FinGPT currently uses your backend default.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between gap-2">
              <Label className="text-soft-white">Temperature</Label>
              <span className="font-mono text-xs text-teal-core">{temperature.toFixed(2)}</span>
            </div>
            <Slider
              value={[temperature]}
              min={0}
              max={2}
              step={0.05}
              onValueChange={(v) => setTemperature(v[0] ?? 0.7)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="api-base" className="text-soft-white">
              API base URL
            </Label>
            <Input
              id="api-base"
              placeholder="http://127.0.0.1:8000"
              value={localUrl}
              onChange={(e) => setLocalUrl(e.target.value)}
              onBlur={() => setApiBaseUrl(localUrl)}
              className="bg-surface-dark/60 border-border-mist text-soft-white font-mono text-xs"
            />
            <p className="text-[10px] text-muted-ink">
              Leave empty to use <span className="font-mono">VITE_API_URL</span> or the dev default.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="w-full border-border-mist bg-surface-dark/40 text-soft-white hover:bg-teal-core/10 hover:text-teal-core"
            onClick={() => {
              setApiBaseUrl(localUrl);
              toast.success('Settings saved');
              onOpenChange(false);
            }}
          >
            Save & close
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="w-full bg-error/20 text-error border border-error/40 hover:bg-error/30"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
