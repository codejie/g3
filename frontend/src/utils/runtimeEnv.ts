declare global {
  interface Window {
    __APP_CONFIG__?: Record<string, string> | null;
  }
}

export async function loadRuntimeConfig(): Promise<void> {
  if (window.__APP_CONFIG__) {
    console.log('[runtimeEnv] Already loaded —', Object.keys(window.__APP_CONFIG__).length, 'keys');
    return;
  }

  try {
    console.log('[runtimeEnv] Fetching /.env ...');
    const resp = await fetch('/.env');
    console.log('[runtimeEnv] /.env response status:', resp.status, resp.statusText);
    if (!resp.ok) {
      console.warn('[runtimeEnv] /.env fetch failed — HTTP', resp.status, '. Falling back to build-time/import.meta.env values.');
      return;
    }
    const text = await resp.text();
    if (!text) {
      console.warn('[runtimeEnv] /.env returned empty body');
      return;
    }
    if (text.trimStart().startsWith('<')) {
      console.warn('[runtimeEnv] /.env returned HTML (likely 404 page), not .env content');
      return;
    }
    const config: Record<string, string> = {};
    text.split('\n').forEach(line => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;
      const eq = line.indexOf('=');
      if (eq === -1) return;
      const key = line.substring(0, eq).trim();
      const val = line.substring(eq + 1).trim();
      config[key] = val;
    });
    window.__APP_CONFIG__ = config;
    console.log('[runtimeEnv] Loaded', Object.keys(config).length, 'keys from /.env:', Object.keys(config).join(', '));
  } catch (err) {
    console.error('[runtimeEnv] Failed to fetch /.env:', err, '— falling back to build-time/import.meta.env values');
  }
}

export function getEnv(key: string, fallback?: string): string | undefined {
  const runtimeConfig = window.__APP_CONFIG__;
  if (runtimeConfig && key in runtimeConfig) {
    return runtimeConfig[key];
  }
  const buildTimeValue = import.meta.env[key];
  if (buildTimeValue !== undefined) {
    console.log(`[runtimeEnv] getEnv("${key}") — not in runtime config, using build-time value:`, buildTimeValue);
    return String(buildTimeValue);
  }
  if (fallback !== undefined) {
    console.warn(`[runtimeEnv] getEnv("${key}") — not in runtime config or build-time, using fallback:`, fallback);
  } else {
    console.warn(`[runtimeEnv] getEnv("${key}") — not found in runtime config or build-time, no fallback provided`);
  }
  return fallback;
}
