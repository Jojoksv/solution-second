// ─── Mock API Client ────────────────────────────────────────────────────────
// Stateful mock simulator. Each fetch advances time-based behaviour:
//   • per-site density follows site-specific trends (rising / oscillating / stable)
//   • bins fill progressively, faster when their site has high occupancy
//   • alerts auto-derive from site states
//   • demo mode triggers an accelerated 3-phase scenario on Stade A. Wade

import type {
  AlertsPayload,
  DemoPayload,
  DensityPayload,
  GreenPayload,
  RiskIndexPayload,
  Alert,
  AlertLevel,
  RiskLevel,
} from '@/types'

import {
  mockDensityNormal,
  mockDensityDemo,
  mockGreenNormal,
  mockGreenDemo,
} from '../lib/mockData'

// ── Mutable simulation state ────────────────────────────────────────────────
let isDemoMode = false
let demoStartedAt = 0
let pollCount = 0
const acknowledgedIds = new Set<string>()

// Per-zone bin fill state (key = "siteId::zoneName")
const binFillState = new Map<string, number>()

const VOLUNTEERS = ['Agent 42', 'Agent 18', 'Agent 07', 'Agent 31']

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function clamp(v: number, lo = 0, hi = 100) {
  return Math.max(lo, Math.min(hi, v))
}

// ── /api/density ───────────────────────────────────────────────────────────

export async function fetchDensity(): Promise<DensityPayload> {
  await delay(300)
  pollCount++

  const base = isDemoMode ? mockDensityDemo : mockDensityNormal
  const data = JSON.parse(JSON.stringify(base)) as DensityPayload
  data.timestamp = new Date().toISOString()
  data.mode = isDemoMode ? 'demo' : 'normal'

  const t = pollCount
  const demoElapsed = isDemoMode ? (Date.now() - demoStartedAt) / 1000 : 0

  data.sites.forEach((site, i) => {
    let target = site.occupancy_percentage
    let rapidIncrease = false

    // ── Per-site trend behaviour ──
    if (site.site_id === 'stade_a_wade') {
      // Demo: 3-phase scenario
      if (isDemoMode) {
        if (demoElapsed < 10) {
          // Phase 1 — rapid rise
          target = clamp(60 + demoElapsed * 4)
          rapidIncrease = demoElapsed > 5
        } else if (demoElapsed < 20) {
          // Phase 2 — sustained peak with oscillation
          target = clamp(92 + Math.sin(demoElapsed) * 2)
          rapidIncrease = true
        } else {
          // Phase 3 — assisted redirection (slow descent)
          target = clamp(88 - (demoElapsed - 20) * 0.6)
        }
      } else {
        // Normal: gradual rising trend
        target = clamp(site.occupancy_percentage + Math.min(20, t * 0.4) + Math.sin(t * 0.15) * 3)
        rapidIncrease = t > 6 && t % 3 === 0
      }
    } else if (site.site_id === 'corniche_ouest') {
      // Oscillating crowd (beach promenade — variable foot traffic)
      target = clamp(site.occupancy_percentage + Math.sin(t * 0.4 + i) * 8)
    } else if (site.site_id === 'plage_saly_ouest') {
      // Slow rise + oscillation
      target = clamp(site.occupancy_percentage + Math.min(15, t * 0.25) + Math.sin(t * 0.3) * 4)
    } else if (site.site_id === 'dakar_arena' || site.site_id === 'centre_expo') {
      // Stable + small breathing
      target = clamp(site.occupancy_percentage + Math.sin(t * 0.2 + i * 0.6) * 2)
    } else {
      // Default: small noise around base
      target = clamp(site.occupancy_percentage + Math.sin(t * 0.18 + i * 0.4) * 3)
    }

    // Smooth transition + tiny random noise
    const noise = (Math.random() - 0.5) * 1.2
    site.occupancy_percentage = Math.round(clamp(site.occupancy_percentage * 0.55 + target * 0.45 + noise))
    site.estimated_real_crowd = Math.round(site.capacity * site.occupancy_percentage / 100)
    site.rapid_increase = rapidIncrease
    site.rise_rate_10min_percent = Math.round((target - site.occupancy_percentage) * 0.5 + (rapidIncrease ? 18 : 0))

    // Recompute status from thresholds
    site.status = site.occupancy_percentage > site.site_thresholds.red_percent_gt
      ? 'red'
      : site.occupancy_percentage > site.site_thresholds.orange_percent_gt
        ? 'orange'
        : 'green'

    // Recompute zone occupancies proportionally
    site.zones.forEach(z => {
      const variance = Math.sin(t * 0.3 + i + z.zone_name.length) * 5
      z.occupancy_percentage = Math.round(clamp(site.occupancy_percentage + variance))
      z.status = z.occupancy_percentage > site.site_thresholds.red_percent_gt
        ? 'red'
        : z.occupancy_percentage > site.site_thresholds.orange_percent_gt
          ? 'orange'
          : 'green'
    })

    // Recommendation per status
    if (site.status === 'red') {
      site.site_recommendation = `Capacité critique (${site.occupancy_percentage} %) — coordonner l'évacuation et rediriger les flux.`
    } else if (site.status === 'orange') {
      site.site_recommendation = `Pré-positionnement des équipes recommandé — surveillance accrue.`
    } else {
      site.site_recommendation = `Situation normale — maintenir la supervision.`
    }
  })

  // Update global metrics
  data.global_metrics.total_estimated_people = data.sites.reduce((s, x) => s + x.estimated_real_crowd, 0)
  data.global_metrics.sites_in_alert = data.sites.filter(s => s.status !== 'green').length
  data.global_metrics.sites_rapid_increase = data.sites.filter(s => s.rapid_increase).length
  data.live_metrics = {
    active_alerts: data.global_metrics.sites_in_alert,
    acknowledged_alerts: acknowledgedIds.size + 12,
    alert_history_count: 45 + pollCount,
  }

  return data
}

// ── /api/alerts ────────────────────────────────────────────────────────────

export async function fetchAlerts(): Promise<AlertsPayload> {
  await delay(200)

  // Auto-derive alerts from current density state
  const density = await peekDensity()
  const activeAlerts: Alert[] = []
  let volIdx = 0

  density.sites.forEach(site => {
    if (site.status === 'green') return

    const id = `alert-${site.site_id}`
    const ack = acknowledgedIds.has(id)
    activeAlerts.push({
      id,
      site_id: site.site_id,
      site_name: site.site_name,
      alert_level: site.status,
      occupancy_percentage: site.occupancy_percentage,
      estimated_real_crowd: site.estimated_real_crowd,
      rise_rate_10min_percent: site.rise_rate_10min_percent,
      rapid_increase: site.rapid_increase,
      city: site.city,
      site_thresholds: site.site_thresholds,
      site_recommendation: site.site_recommendation,
      created_at: new Date(Date.now() - (pollCount % 4 + 1) * 60_000).toISOString(),
      updated_at: new Date().toISOString(),
      acknowledged: ack,
      acknowledged_at: ack ? new Date().toISOString() : null,
      escalated: false,
      escalation_created_at: null,
      assigned_volunteer: VOLUNTEERS[volIdx++ % VOLUNTEERS.length],
    })
  })

  return {
    timestamp: new Date().toISOString(),
    active_alerts: activeAlerts,
    history: [],
    total_history_events: 45 + pollCount,
    acknowledged_alerts: 12 + acknowledgedIds.size,
  }
}

// Internal helper — quick density snapshot without mutating poll count
async function peekDensity(): Promise<DensityPayload> {
  // Re-use the last-known data without advancing the simulation counter
  const base = isDemoMode ? mockDensityDemo : mockDensityNormal
  const cloned = JSON.parse(JSON.stringify(base)) as DensityPayload
  cloned.sites.forEach(s => {
    // Recompute status from current occupancy using thresholds
    s.status = s.occupancy_percentage > s.site_thresholds.red_percent_gt
      ? 'red'
      : s.occupancy_percentage > s.site_thresholds.orange_percent_gt
        ? 'orange'
        : 'green'
  })
  return cloned
}

// ── /api/green ─────────────────────────────────────────────────────────────

export async function fetchGreen(): Promise<GreenPayload> {
  await delay(400)
  const base = isDemoMode ? mockGreenDemo : mockGreenNormal
  const data = JSON.parse(JSON.stringify(base)) as GreenPayload
  data.timestamp = new Date().toISOString()

  // Bins fill progressively: more crowd → faster fill
  data.sites.forEach(site => {
    site.zones.forEach(zone => {
      const key = `${site.site_id}::${zone.zone_name}`
      const current = binFillState.get(key) ?? zone.fill_percentage
      // Growth: 0.4–1.8 % per poll, accelerated in demo mode
      const growth = (Math.random() * 1.4 + 0.4) * (isDemoMode ? 1.6 : 1.0)
      const next = clamp(current + growth)
      binFillState.set(key, next)

      zone.fill_percentage = Math.round(next)
      zone.status = next > 75 ? 'red' : next > 50 ? 'orange' : 'green'
      zone.early_alert = zone.status === 'red'
    })
    site.max_fill_percentage = Math.max(...site.zones.map(z => z.fill_percentage), 0)
    site.site_fill_status =
      site.max_fill_percentage > 75 ? 'red' :
      site.max_fill_percentage > 50 ? 'orange' : 'green'
    site.early_crowd_alert = site.max_fill_percentage > 75
  })

  return data
}

// ── /api/risk-index ────────────────────────────────────────────────────────

export async function fetchRiskIndex(): Promise<RiskIndexPayload> {
  await delay(150)

  // Compute IRG from current density state
  const density = await peekDensity()
  const occupancies = density.sites.map(s => s.occupancy_percentage)
  const avgOcc = occupancies.reduce((a, b) => a + b, 0) / Math.max(1, occupancies.length)
  const peakOcc = Math.max(...occupancies, 0)

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

// ── /api/acknowledge ───────────────────────────────────────────────────────

export async function acknowledgeAlert(alertId: string): Promise<void> {
  await delay(500)
  acknowledgedIds.add(alertId)
}

// ── /api/demo-mode ─────────────────────────────────────────────────────────

export async function activateDemoMode(): Promise<DemoPayload> {
  await delay(200)
  isDemoMode = true
  demoStartedAt = Date.now()

  // Auto-disable after 30 s
  setTimeout(() => { isDemoMode = false }, 30_000)

  return {
    message: 'Mode démo activé pour 30 s',
    active_until: new Date(Date.now() + 30_000).toISOString(),
    simulator_interval_seconds: 1,
  }
}

// Suppress unused-arg lint on ack
export type { AlertLevel }
