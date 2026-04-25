// ─── Shared Utilities ─────────────────────────────────────────────────────

import { CITY_COLORS, THRESHOLDS } from "@/config";
import type { AlertLevel } from "@/types";

/** Format a number in French locale: 142 497 */
export function fmt(n: number | undefined): string {
  return new Intl.NumberFormat("fr-FR").format(n ?? 0);
}

/** "HH:mm" from an ISO timestamp */
export function shortTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** CSS colour variable for a city name */
export function cityColor(city: string): string {
  return CITY_COLORS[city] ?? "#ffffff";
}

/** CSS variable name string for a status level */
export function statusVar(status: AlertLevel): string {
  return `var(--${status})`;
}

/** Tailwind-style class suffix to use for status colours */
export function statusClass(status: AlertLevel): string {
  return status; // "green" | "orange" | "red" — used as CSS class suffix
}

/** Determine AlertLevel from a numeric percentage */
export function levelFromPct(
  pct: number,
  orangeThreshold = THRESHOLDS.defaultOrange,
  redThreshold = THRESHOLDS.defaultRed,
): AlertLevel {
  if (pct > redThreshold) return "red";
  if (pct > orangeThreshold) return "orange";
  return "green";
}

/** Live clock string */
export function liveClock(): string {
  return new Date().toLocaleString("fr-FR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}