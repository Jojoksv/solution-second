// ─── Global Bin Simulation Store ──────────────────────────────────────────
// Autonomous bin-fill simulation for the global map view.
// Bins auto-fill over time, trigger alerts at thresholds, reset after cleaning.

import { useState, useEffect } from 'react'

// ── Types ──────────────────────────────────────────────────────────────────

export interface SimBin {
  id: string
  site_id: string
  site_name: string
  zone_name: string
  lat: number
  lng: number
  fillPct: number       // 0–100
  status: 'green' | 'orange' | 'red'
  warningCount: number
  resetting: boolean    // true while countdown runs before actual reset
  history: number[]     // ring buffer of last 10 snapshots
}

export interface SimBinAlert {
  id: string
  bin_id: string
  site_name: string
  zone_name: string
  fillPct: number
  severity: 'orange' | 'red'
  createdAt: number
  resolved: boolean
  assignedAt?: number   // set when supervisor assigns
}

// ── Static bin layout ──────────────────────────────────────────────────────
// One or two bins per major site, placed a few meters off the site centroid.

const BIN_DEFS: Array<Omit<SimBin, 'fillPct' | 'status' | 'warningCount' | 'resetting' | 'history'>> = [
  { id: 'BIN-CO-01', site_id: 'corniche_ouest',  site_name: 'Corniche Ouest',     zone_name: 'Skatepark B1', lat: 14.6870, lng: -17.4757 },
  { id: 'BIN-CO-02', site_id: 'corniche_ouest',  site_name: 'Corniche Ouest',     zone_name: 'Plage B2',     lat: 14.6860, lng: -17.4765 },
  { id: 'BIN-AW-01', site_id: 'stade_a_wade',    site_name: 'Stade A. Wade',      zone_name: 'Parvis Nord',  lat: 14.7436, lng: -17.1880 },
  { id: 'BIN-AW-02', site_id: 'stade_a_wade',    site_name: 'Stade A. Wade',      zone_name: 'Parvis Sud',   lat: 14.7426, lng: -17.1888 },
  { id: 'BIN-AW-03', site_id: 'stade_a_wade',    site_name: 'Stade A. Wade',      zone_name: 'Entrée Est',   lat: 14.7432, lng: -17.1875 },
  { id: 'BIN-IM-01', site_id: 'stade_iba_mar',   site_name: 'Stade Iba Mar',      zone_name: 'Parvis B7',    lat: 14.6815, lng: -17.4522 },
  { id: 'BIN-SL-01', site_id: 'plage_saly_ouest', site_name: 'Plage Saly Ouest', zone_name: 'Zone Est',     lat: 14.4448, lng: -17.0091 },
  { id: 'BIN-SL-02', site_id: 'plage_saly_ouest', site_name: 'Plage Saly Ouest', zone_name: 'Zone Ouest',   lat: 14.4440, lng: -17.0103 },
  { id: 'BIN-DA-01', site_id: 'dakar_arena',     site_name: 'Dakar Arena',        zone_name: 'Hall Princ.',  lat: 14.7400, lng: -17.1893 },
]

// Fill rate in % per tick (4 s each) — varies per bin to create realistic spread
const FILL_RATES: Record<string, number> = {
  'BIN-CO-01': 2.4,
  'BIN-CO-02': 1.7,
  'BIN-AW-01': 3.1,
  'BIN-AW-02': 1.4,
  'BIN-AW-03': 2.0,
  'BIN-IM-01': 2.7,
  'BIN-SL-01': 1.1,
  'BIN-SL-02': 0.8,
  'BIN-DA-01': 1.5,
}

// Staggered starting fills so the demo always starts with interesting variety
const INIT_FILLS: Record<string, number> = {
  'BIN-CO-01': 73,
  'BIN-CO-02': 34,
  'BIN-AW-01': 92,
  'BIN-AW-02': 47,
  'BIN-AW-03': 61,
  'BIN-IM-01': 86,
  'BIN-SL-01': 22,
  'BIN-SL-02': 15,
  'BIN-DA-01': 44,
}

// ── Helpers ────────────────────────────────────────────────────────────────

function toStatus(pct: number): SimBin['status'] {
  if (pct >= 80) return 'red'
  if (pct >= 50) return 'orange'
  return 'green'
}

// ── Module-level state ──────────────────────────────────────────────────────

let _bins: SimBin[] = BIN_DEFS.map(def => {
  const fill = INIT_FILLS[def.id] ?? Math.round(20 + Math.random() * 45)
  return {
    ...def,
    fillPct: fill,
    status: toStatus(fill),
    warningCount: fill >= 80 ? 2 : fill >= 50 ? 1 : 0,
    resetting: false,
    history: Array.from({ length: 10 }, (_, i) => Math.max(0, fill - (9 - i) * 2)),
  }
})

// Seed initial alerts for bins that start above threshold
let _alerts: SimBinAlert[] = _bins
  .filter(b => b.fillPct >= 75)
  .map(b => ({
    id: `alert-init-${b.id}`,
    bin_id: b.id,
    site_name: b.site_name,
    zone_name: b.zone_name,
    fillPct: b.fillPct,
    severity: b.fillPct >= 85 ? 'red' as const : 'orange' as const,
    createdAt: Date.now() - Math.round(Math.random() * 180_000),
    resolved: false,
  }))

const _listeners = new Set<() => void>()

function notify() {
  _listeners.forEach(fn => fn())
}

// ── Auto-fill tick (4 s) ────────────────────────────────────────────────────

const TICK_MS = 4_000

setInterval(() => {
  _bins = _bins.map(bin => {
    if (bin.resetting) return bin

    const rate = FILL_RATES[bin.id] ?? 1.5
    const newFill = Math.min(100, bin.fillPct + rate)
    const rounded = Math.round(newFill)
    const newStatus = toStatus(rounded)
    const newHistory = [...bin.history.slice(-9), rounded]

    // Generate alert when crossing 75 %
    if (newFill >= 75 && bin.fillPct < 75) {
      _alerts = [
        ..._alerts,
        {
          id: `alert-${bin.id}-${Date.now()}`,
          bin_id: bin.id,
          site_name: bin.site_name,
          zone_name: bin.zone_name,
          fillPct: rounded,
          severity: newFill >= 85 ? 'red' : 'orange',
          createdAt: Date.now(),
          resolved: false,
        },
      ]
    }

    // Escalate severity when crossing 85 %
    if (newFill >= 85 && bin.fillPct < 85) {
      _alerts = _alerts.map(a =>
        a.bin_id === bin.id && !a.resolved
          ? { ...a, severity: 'red' as const, fillPct: rounded }
          : a,
      )
    }

    return {
      ...bin,
      fillPct: rounded,
      status: newStatus,
      warningCount: rounded >= 85 ? bin.warningCount + 1 : bin.warningCount,
      history: newHistory,
    }
  })

  notify()
}, TICK_MS)

// ── Actions ────────────────────────────────────────────────────────────────

export function getBins(): SimBin[] {
  return _bins
}

export function getActiveAlerts(): SimBinAlert[] {
  return _alerts.filter(a => !a.resolved)
}

/** Supervisor: assign an agent → bin starts resetting after 10 s */
export function assignBinAgent(binId: string) {
  // Mark alert as "assigned" immediately
  _alerts = _alerts.map(a =>
    a.bin_id === binId && !a.resolved
      ? { ...a, assignedAt: Date.now() }
      : a,
  )
  // Mark bin as resetting
  _bins = _bins.map(b => (b.id === binId ? { ...b, resetting: true } : b))
  notify()

  // After 10 s, reset bin to 0 % and resolve alert
  setTimeout(() => {
    _bins = _bins.map(b =>
      b.id === binId
        ? { ...b, fillPct: 0, status: 'green', resetting: false, warningCount: 0, history: [...b.history.slice(-9), 0] }
        : b,
    )
    _alerts = _alerts.map(a =>
      a.bin_id === binId ? { ...a, resolved: true } : a,
    )
    notify()
  }, 10_000)
}

/** Agent: "Mark as cleaned" — immediate reset */
export function markBinCleaned(binId: string) {
  _bins = _bins.map(b =>
    b.id === binId
      ? { ...b, fillPct: 0, status: 'green', resetting: false, warningCount: 0, history: [...b.history.slice(-9), 0] }
      : b,
  )
  _alerts = _alerts.map(a => (a.bin_id === binId ? { ...a, resolved: true } : a))
  notify()
}

// ── React hook ─────────────────────────────────────────────────────────────

export function useBinSimulation() {
  const [bins, setBins] = useState<SimBin[]>(_bins)
  const [alerts, setAlerts] = useState<SimBinAlert[]>(() => _alerts.filter(a => !a.resolved))

  useEffect(() => {
    const fn = () => {
      setBins([..._bins])
      setAlerts(_alerts.filter(a => !a.resolved))
    }
    _listeners.add(fn)
    return () => {
      _listeners.delete(fn)
    }
  }, [])

  return { bins, alerts, assignBinAgent, markBinCleaned }
}
