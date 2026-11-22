import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'ib_supabase_runtime_url';
const STORAGE_KEY_KEY = 'ib_supabase_runtime_anon_key';
const STORAGE_DISABLED_KEY = 'ib_supabase_runtime_disabled';

function normalizeBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return `${parsed.protocol}//${parsed.host}`;
    }
  } catch {
    // Fall through
  }
  return trimmed;
}

const rawEnvUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() || '';
const envUrl = normalizeBaseUrl(rawEnvUrl);
const envAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() || '';

export const isEnvSupabaseConfigured = Boolean(
  envUrl && envAnonKey && envUrl.startsWith('http') && envAnonKey.length > 20
);

let cachedClient: SupabaseClient | null = null;
let cachedSignature = '';
let serverInitPromise: Promise<void> | null = null;

function isRuntimeDisabled(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_DISABLED_KEY) === '1';
  } catch {
    return false;
  }
}

function readStoredRuntimeConfig(): { url: string; anonKey: string } {
  try {
    const rawUrl = window.localStorage.getItem(STORAGE_URL_KEY)?.trim() || '';
    const url = normalizeBaseUrl(rawUrl);
    const anonKey = window.localStorage.getItem(STORAGE_KEY_KEY)?.trim() || '';
    if (url.startsWith('http') && anonKey.length > 20) {
      return { url, anonKey };
    }
  } catch {
    // Ignore storage errors
  }
  return { url: '', anonKey: '' };
}

export function getSupabaseCredentials(): {
  url: string;
  anonKey: string;
  source: 'env' | 'dashboard';
} | null {
  if (isRuntimeDisabled()) {
    return null;
  }
  const stored = readStoredRuntimeConfig();
  if (stored.url && stored.anonKey) {
    return { url: stored.url, anonKey: stored.anonKey, source: 'dashboard' };
  }
  if (isEnvSupabaseConfigured) {
    return { url: envUrl, anonKey: envAnonKey, source: 'env' };
  }
  return null;
}

export function getSupabaseConfigInfo(): {
  configured: boolean;
  source: 'env' | 'dashboard' | 'none';
  url: string;
} {
  if (isRuntimeDisabled()) {
    return { configured: false, source: 'none', url: '' };
  }
  const stored = readStoredRuntimeConfig();
  if (stored.url && stored.anonKey) {
    return { configured: true, source: 'dashboard', url: stored.url };
  }
  if (isEnvSupabaseConfigured) {
    return { configured: true, source: 'env', url: envUrl };
  }
  return { configured: false, source: 'none', url: '' };
}

export function isSupabaseActive(): boolean {
  return getSupabaseConfigInfo().configured;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (isRuntimeDisabled()) {
    cachedClient = null;
    cachedSignature = '';
    return null;
  }

  const stored = readStoredRuntimeConfig();
  const url = stored.url || (isEnvSupabaseConfigured ? envUrl : '');
  const anonKey = stored.anonKey || (isEnvSupabaseConfigured ? envAnonKey : '');

  if (!url || !anonKey || !url.startsWith('http') || anonKey.length <= 20) {
    cachedClient = null;
    cachedSignature = '';
    return null;
  }

  const sig = `${url}|${anonKey}`;
  if (!cachedClient || cachedSignature !== sig) {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        storageKey: 'ib-homelight-supabase-auth',
      },
    });
    cachedSignature = sig;
  }
  return cachedClient;
}

export function setRuntimeSupabaseConfig(url: string, anonKey: string) {
  const cleanUrl = normalizeBaseUrl(url);
  const cleanKey = anonKey.trim();
  try {
    window.localStorage.removeItem(STORAGE_DISABLED_KEY);
    window.localStorage.setItem(STORAGE_URL_KEY, cleanUrl);
    window.localStorage.setItem(STORAGE_KEY_KEY, cleanKey);
  } catch {
    // Ignore storage errors
  }
  cachedClient = null;
  cachedSignature = '';
  serverInitPromise = Promise.resolve();
}

export function clearRuntimeSupabaseConfig(markDisabled = false) {
  try {
    window.localStorage.removeItem(STORAGE_URL_KEY);
    window.localStorage.removeItem(STORAGE_KEY_KEY);
    if (markDisabled) {
      window.localStorage.setItem(STORAGE_DISABLED_KEY, '1');
    } else {
      window.localStorage.removeItem(STORAGE_DISABLED_KEY);
    }
  } catch {
    // Ignore storage errors
  }
  cachedClient = null;
  cachedSignature = '';
  serverInitPromise = Promise.resolve();
}

export async function initRuntimeSupabaseFromServer(force = false): Promise<void> {
  if (!serverInitPromise || force) {
    serverInitPromise = (async () => {
      try {
        const res = await fetch('/api/public/supabase-config', {
          credentials: 'include',
          cache: 'no-store',
        });
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || !contentType.includes('application/json')) {
          // Static deployment (e.g. Vercel): ensure env configuration is active
          if (isEnvSupabaseConfigured) {
            try {
              window.localStorage.removeItem(STORAGE_DISABLED_KEY);
            } catch {
              // Ignore storage errors
            }
          }
          return;
        }
        const data = (await res.json()) as {
          configured?: boolean;
          disabledByAdmin?: boolean;
          url?: string;
          anon_key?: string;
        };
        if (data.disabledByAdmin) {
          clearRuntimeSupabaseConfig(true);
        } else if (data.configured && data.url && data.anon_key) {
          setRuntimeSupabaseConfig(data.url, data.anon_key);
        } else if (!isEnvSupabaseConfigured) {
          clearRuntimeSupabaseConfig(false);
        } else {
          // Env vars are active; ensure any stale disabled flag is cleared
          try {
            window.localStorage.removeItem(STORAGE_DISABLED_KEY);
          } catch {
            // Ignore storage errors
          }
        }
      } catch {
        // Keep cached/env fallback if server config fetch fails
      }
    })();
  }
  await serverInitPromise;
}

// Legacy exports kept for backward compatibility
export const isSupabaseConfigured = isEnvSupabaseConfigured;
export const supabase = getSupabaseClient();
