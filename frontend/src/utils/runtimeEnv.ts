declare global {
  interface Window {
    __APP_CONFIG__?: Record<string, string> | null;
  }
}

export async function loadRuntimeConfig(): Promise<void> {
  if (window.__APP_CONFIG__) return;

  try {
    const resp = await fetch('.env');
    if (!resp.ok) return;
    const text = await resp.text();
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
  } catch {
    // .env not available — fall back to import.meta.env build-time values
  }
}

export function getEnv(key: string, fallback?: string): string | undefined {
  const runtimeConfig = window.__APP_CONFIG__;
  if (runtimeConfig && key in runtimeConfig) {
    return runtimeConfig[key];
  }
  const buildTimeValue = import.meta.env[key];
  if (buildTimeValue !== undefined) {
    return String(buildTimeValue);
  }
  return fallback;
}
