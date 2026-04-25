// ─── API Client ───────────────────────────────────────────────────────────
// Each function maps 1-to-1 with a backend endpoint.
// Only this file knows about URL paths.

import { httpClient } from "@/lib/httpClient";
import type {
  AlertsPayload,
  DemoPayload,
  DensityPayload,
  GreenPayload,
} from "@/types";

// ── /api/density ───────────────────────────────────────────────────────────
export async function fetchDensity(): Promise<DensityPayload> {
  const { data } = await httpClient.get<DensityPayload>("/api/density");
  return data;
}

// ── /api/alerts ────────────────────────────────────────────────────────────
export async function fetchAlerts(): Promise<AlertsPayload> {
  const { data } = await httpClient.get<AlertsPayload>("/api/alerts");
  return data;
}

// ── /api/green ─────────────────────────────────────────────────────────────
export async function fetchGreen(): Promise<GreenPayload> {
  const { data } = await httpClient.get<GreenPayload>("/api/green");
  return data;
}

// ── /api/acknowledge ───────────────────────────────────────────────────────
export async function acknowledgeAlert(alertId: string): Promise<void> {
  await httpClient.post("/api/acknowledge", { alert_id: alertId });
}

// ── /api/demo-mode ─────────────────────────────────────────────────────────
export async function activateDemoMode(): Promise<DemoPayload> {
  const { data } = await httpClient.post<DemoPayload>("/api/demo-mode");
  return data;
}