import { getResolvedApiBase } from '@/stores/settingsStore';

const jsonHeaders = { 'Content-Type': 'application/json' };

const ME_TIMEOUT_MS = 12_000;

async function readApiError(res: Response): Promise<string> {
  try {
    const j = (await res.json()) as { detail?: unknown };
    const d = j.detail;
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) {
      return d
        .map((x: unknown) => (typeof x === 'object' && x && 'msg' in x ? String((x as { msg: string }).msg) : String(x)))
        .join(', ');
    }
  } catch {
    /* ignore */
  }
  return res.statusText;
}

export type TokenResponse = { access_token: string; token_type?: string };
export type UserPublic = { id: number; username: string; email: string };

export const authApi = {
  async register(username: string, email: string, password: string): Promise<UserPublic> {
    const base = getResolvedApiBase();
    console.info('[authApi] POST /register', { base });
    const res = await fetch(`${base}/register`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ username, email, password }),
    });
    if (!res.ok) {
      throw new Error(await readApiError(res));
    }
    return res.json();
  },

  async login(identifier: string, password: string): Promise<TokenResponse> {
    const base = getResolvedApiBase();
    console.info('[authApi] POST /login', { base });
    const res = await fetch(`${base}/login`, {
      method: 'POST',
      headers: jsonHeaders,
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      throw new Error(await readApiError(res));
    }
    return res.json();
  },

  async me(token: string): Promise<UserPublic> {
    const base = getResolvedApiBase();
    const url = `${base}/me`;
    const controller = new AbortController();
    const t = window.setTimeout(() => controller.abort(), ME_TIMEOUT_MS);
    try {
      console.info('[authApi] GET /me', { url });
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
      if (!res.ok) {
        const detail = await readApiError(res);
        throw new Error(detail || 'Session invalid');
      }
      return res.json();
    } finally {
      window.clearTimeout(t);
    }
  },

  async logout(token: string): Promise<void> {
    const base = getResolvedApiBase();
    await fetch(`${base}/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
