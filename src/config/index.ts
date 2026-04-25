// ─── CrowdFlow – Centralised Config ───────────────────────────────────────
// Single source of truth for all environment / runtime constants.
// Import from here, never scatter magic strings across the codebase.

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:5000",
  timeout: 10_000, // ms
} as const;

export const POLLING = {
  normal: 15_000,  // ms – normal refresh interval
  demo: 2_000,     // ms – fast refresh during demo scenario
} as const;

export const CHART = {
  maxPoints: 60,
} as const;

export const DEMO = {
  durationMs: 30_000,
} as const;

export const THRESHOLDS = {
  defaultOrange: 65,
  defaultRed: 85,
  riseAlert: 15,
  binFull: 80,
  binWarning: 55,
} as const;

export const CITY_COLORS: Record<string, string> = {
  Dakar: "#3b82f6",
  Diamniadio: "#10b981",
  Saly: "#f59e0b",
};