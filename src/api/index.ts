// ─── API Client ───────────────────────────────────────────────────────────
// Thin wrappers around the real Flask backend at http://127.0.0.1:5000.
// fetchRiskIndex is computed client-side (no backend endpoint).

import { httpClient } from '@/lib/httpClient'
import type {
  AlertsPayload,
  DemoPayload,
  DensityPayload,
  GreenPayload,
  RiskIndexPayload,
  RiskLevel,
} from '@/types'

// ── /api/density ───────────────────────────────────────────────────────────

export async function fetchDensity(): Promise<DensityPayload> {
  const { data } = await httpClient.get<DensityPayload>('/api/density')
  return data
}

// ── /api/alerts ────────────────────────────────────────────────────────────

export async function fetchAlerts(): Promise<AlertsPayload> {
  const { data } = await httpClient.get<AlertsPayload>('/api/alerts')
  return data
}

// ── /api/green ─────────────────────────────────────────────────────────────

export async function fetchGreen(): Promise<GreenPayload> {
  const { data } = await httpClient.get<GreenPayload>('/api/green')
  return data
}

// ── /api/acknowledge ───────────────────────────────────────────────────────

export async function acknowledgeAlert(alertId: string): Promise<void> {
  await httpClient.post('/api/acknowledge', { alert_id: alertId })
}

// ── /api/demo-mode ─────────────────────────────────────────────────────────

export async function activateDemoMode(): Promise<DemoPayload> {
  const { data } = await httpClient.post<DemoPayload>('/api/demo-mode')
  return data
}

// ── Risk Index (IRG) — computed client-side ────────────────────────────────
// No backend endpoint; derived from latest density snapshot.

export async function fetchRiskIndex(): Promise<RiskIndexPayload> {
  const density = await fetchDensity()
  const occupancies = density.sites.map(s => s.occupancy_percentage)
  const avgOcc = occupancies.reduce((a, b) => a + b, 0) / Math.max(1, occupancies.length)
  const peakOcc = Math.max(...occupancies, 0)
  const isDemoMode = density.mode === 'demo'

  let score = Math.round(avgOcc * 0.55 + peakOcc * 0.40)
  if (isDemoMode) score = Math.min(95, score + 10)

  const level: RiskLevel =
    score > 90 ? 'emergency' :
    score > 75 ? 'critical' :
    score > 55 ? 'alert' :
    score > 30 ? 'vigilance' : 'nominal'

  const labels: Record<RiskLevel, string> = {
    emergency: 'URGENCE',
    critical:  'CRITIQUE',
    alert:     'ALERTE',
    vigilance: 'VIGILANCE',
    nominal:   'NOMINAL',
  }

  const action: Record<RiskLevel, string> = {
    emergency: 'Évacuation et coordination inter-services immédiates.',
    critical:  'Coordination inter-services — renforcer les équipes de sécurité.',
    alert:     'Activation des dispositifs de redirection et bénévoles supplémentaires.',
    vigilance: 'Pré-positionnement des équipes de sécurité sur les sites sensibles.',
    nominal:   'Surveillance nominale — maintenir la supervision.',
  }

  return {
    timestamp: new Date().toISOString(),
    score,
    level,
    label: labels[level],
    recommended_action: action[level],
    rapid_increase_bonus: isDemoMode ? 10 : 0,
    inter_sites_congestion_bonus: density.sites.filter(s => s.status === 'red').length * 3,
    site_contributions: density.sites.slice(0, 5).map(s => ({
      site_id: s.site_id,
      site_name: s.site_name,
      weight: s.capacity / 100_000,
      occupancy_percentage: s.occupancy_percentage,
      rapid_increase: s.rapid_increase,
      contribution: Math.round(s.occupancy_percentage * (s.capacity / 100_000)),
    })),
    trend: isDemoMode ? 'rising' : score > 50 ? 'rising' : 'stable',
    previous_score: Math.max(0, score - 3),
  }
}

export type { AlertLevel } from '@/types'
