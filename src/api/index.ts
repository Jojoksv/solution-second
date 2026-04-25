// ─── Mock API Client ────────────────────────────────────────────────────────
// Replaces real HTTP calls with mocked data for the frontend-only redesign.

import type {
  AlertsPayload,
  DemoPayload,
  DensityPayload,
  GreenPayload,
  RiskIndexPayload,
} from "@/types";

import {
  mockDensityNormal,
  mockDensityDemo,
  mockAlertsNormal,
  mockAlertsDemo,
  mockGreenNormal,
  mockGreenDemo,
  mockRiskIndexNormal,
  mockRiskIndexDemo,
} from "../lib/mockData";

// Global mock state
let isDemoMode = false;

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── /api/density ───────────────────────────────────────────────────────────
export async function fetchDensity(): Promise<DensityPayload> {
  await delay(300); // Simulate network latency
  
  // Randomize a little bit to simulate live data
  const data = isDemoMode ? mockDensityDemo : mockDensityNormal;
  const newData = JSON.parse(JSON.stringify(data)) as DensityPayload;
  
  newData.timestamp = new Date().toISOString();
  newData.sites.forEach(site => {
    // Add small noise to occupancy if not demo
    if (!isDemoMode && site.occupancy_percentage > 5) {
      site.occupancy_percentage += Math.floor(Math.random() * 3) - 1; 
    }
  });

  return newData;
}

// ── /api/alerts ────────────────────────────────────────────────────────────
export async function fetchAlerts(): Promise<AlertsPayload> {
  await delay(200);
  const data = isDemoMode ? mockAlertsDemo : mockAlertsNormal;
  const newData = JSON.parse(JSON.stringify(data)) as AlertsPayload;
  newData.timestamp = new Date().toISOString();
  return newData;
}

// ── /api/green ─────────────────────────────────────────────────────────────
export async function fetchGreen(): Promise<GreenPayload> {
  await delay(400);
  const data = isDemoMode ? mockGreenDemo : mockGreenNormal;
  const newData = JSON.parse(JSON.stringify(data)) as GreenPayload;
  newData.timestamp = new Date().toISOString();
  return newData;
}

// ── /api/risk-index ────────────────────────────────────────────────────────
export async function fetchRiskIndex(): Promise<RiskIndexPayload> {
  await delay(150);
  const data = isDemoMode ? mockRiskIndexDemo : mockRiskIndexNormal;
  const newData = JSON.parse(JSON.stringify(data)) as RiskIndexPayload;
  newData.timestamp = new Date().toISOString();
  return newData;
}

// ── /api/acknowledge ───────────────────────────────────────────────────────
export async function acknowledgeAlert(alertId: string): Promise<void> {
  await delay(500);
  // Just mock success
}

// ── /api/demo-mode ─────────────────────────────────────────────────────────
export async function activateDemoMode(): Promise<DemoPayload> {
  await delay(200);
  isDemoMode = true;
  
  // Reset demo mode after 30 seconds
  setTimeout(() => {
    isDemoMode = false;
  }, 30000);

  return {
    message: "Demo mode activated for 30s",
    active_until: new Date(Date.now() + 30000).toISOString(),
    simulator_interval_seconds: 1,
  };
}