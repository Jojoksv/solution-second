// Stadium simulation engine — Stade Iba Mar Diop, JOJ Dakar 2026

// ── Seeded PRNG (LCG) ──────────────────────────────────────────────────────
function createPRNG(seed: number) {
  let s = seed
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) | 0
    return (s >>> 0) / 0xffffffff
  }
}

// ── Constants ──────────────────────────────────────────────────────────────

export const STADIUM_CENTER: [number, number] = [14.6937, -17.4441]
export const STADIUM_ZOOM_DETAIL = 17
export const STADIUM_ZOOM_GLOBAL = 11

export const STADIUM_POLYGON: [number, number][] = [
  [14.6954, -17.4462],
  [14.6955, -17.4440],
  [14.6954, -17.4420],
  [14.6939, -17.4415],
  [14.6919, -17.4420],
  [14.6917, -17.4441],
  [14.6919, -17.4462],
  [14.6937, -17.4466],
]

export const GATES = [
  { id: 'G1', name: 'Entrée Nord-Ouest', lat: 14.6952, lng: -17.4458, capacity: 800 },
  { id: 'G2', name: 'Entrée Nord',       lat: 14.6953, lng: -17.4441, capacity: 600 },
  { id: 'G3', name: 'Entrée Nord-Est',   lat: 14.6952, lng: -17.4424, capacity: 700 },
  { id: 'G4', name: 'Entrée Est',        lat: 14.6937, lng: -17.4419, capacity: 500 },
  { id: 'G5', name: 'Entrée Sud-Est',    lat: 14.6921, lng: -17.4424, capacity: 700 },
  { id: 'G6', name: 'Entrée Sud',        lat: 14.6920, lng: -17.4441, capacity: 900 },
  { id: 'G7', name: 'Entrée Sud-Ouest',  lat: 14.6921, lng: -17.4458, capacity: 800 },
  { id: 'G8', name: 'Entrée Ouest',      lat: 14.6937, lng: -17.4462, capacity: 600 },
]

// Each gate has one dedicated bin in the buffer zone (just outside the polygon)
// plus two strategic bins in the inner courtyard. Spacing avoids visual overlap.
export const BINS_BASE = [
  { id: 'B1',  lat: 14.6957, lng: -17.4462, nearGate: 'G1', label: 'Poubelle Nord-Ouest' },
  { id: 'B2',  lat: 14.6958, lng: -17.4441, nearGate: 'G2', label: 'Poubelle Nord' },
  { id: 'B3',  lat: 14.6957, lng: -17.4420, nearGate: 'G3', label: 'Poubelle Nord-Est' },
  { id: 'B4',  lat: 14.6937, lng: -17.4412, nearGate: 'G4', label: 'Poubelle Est' },
  { id: 'B5',  lat: 14.6916, lng: -17.4420, nearGate: 'G5', label: 'Poubelle Sud-Est' },
  { id: 'B6',  lat: 14.6914, lng: -17.4441, nearGate: 'G6', label: 'Poubelle Sud' },
  { id: 'B7',  lat: 14.6916, lng: -17.4462, nearGate: 'G7', label: 'Poubelle Sud-Ouest' },
  { id: 'B8',  lat: 14.6937, lng: -17.4470, nearGate: 'G8', label: 'Poubelle Ouest' },
  // Inner courtyard bins (between center and main gates)
  { id: 'B9',  lat: 14.6945, lng: -17.4441, nearGate: 'G2', label: 'Poubelle Cour Nord' },
  { id: 'B10', lat: 14.6929, lng: -17.4441, nearGate: 'G6', label: 'Poubelle Cour Sud' },
]

// ── Stable per-entity factors (pre-computed, tick-independent) ─────────────

/** Relative busyness per gate: some gates always busier than others */
const GATE_BASE_FACTORS = GATES.map((_, i) => {
  const r = createPRNG(i * 53 + 7)
  return 0.75 + r() * 0.5          // 0.75 – 1.25
})

/** Fill speed multiplier per bin */
const BIN_SPEED_FACTORS = BINS_BASE.map((_, i) => {
  const r = createPRNG(i * 73 + 19)
  return 0.8 + r() * 0.65          // 0.80 – 1.45
})

/** Baseline fill % per bin (5 – 15%) */
const BIN_BASELINES = BINS_BASE.map((_, i) => {
  const r = createPRNG(i * 97 + 11)
  return 5 + r() * 10
})

// ── Helpers ────────────────────────────────────────────────────────────────

export type DensityLevel = 'low' | 'moderate' | 'high' | 'critical'

function densityToLevel(d: number): { level: DensityLevel; color: string } {
  if (d > 0.75) return { level: 'critical', color: '#ef4444' }
  if (d > 0.50) return { level: 'high',     color: '#f97316' }
  if (d > 0.25) return { level: 'moderate', color: '#eab308' }
  return             { level: 'low',      color: '#22c55e' }
}

function fillToLevel(fill: number): { level: DensityLevel; color: string } {
  if (fill >= 75) return { level: 'critical', color: '#ef4444' }
  if (fill >= 50) return { level: 'high',     color: '#f97316' }
  if (fill >= 25) return { level: 'moderate', color: '#eab308' }
  return             { level: 'low',      color: '#22c55e' }
}

// ── Phase ──────────────────────────────────────────────────────────────────

export interface PhaseInfo {
  name: string
  label: string
  color: string
  densityRange: [number, number]
}

/** tick is 0-40 (snapshot index); realTick = tick*5, range 0-200 */
export function getPhase(tick: number): PhaseInfo {
  const rt = tick * 5
  if (rt < 30) {
    const p = rt / 30
    return { name: 'pre_event', label: 'Pré-événement', color: '#22c55e', densityRange: [0.12 + p * 0.38, 0.25 + p * 0.45] }
  }
  if (rt < 70)  return { name: 'event_peak',    label: "Pic d'affluence", color: '#ef4444', densityRange: [0.70, 0.95] }
  if (rt < 90)  return { name: 'event_ongoing', label: 'Match en cours',  color: '#f97316', densityRange: [0.60, 0.88] }
  const decay = (rt - 90) / 110
  return {
    name: 'post_event', label: 'Post-événement', color: '#eab308',
    densityRange: [Math.max(0.04, 0.88 - decay * 0.84), Math.max(0.08, 0.95 - decay * 0.87)],
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface GateState {
  id: string
  name: string
  lat: number
  lng: number
  capacity: number
  density: number
  crowdCount: number
  level: DensityLevel
  color: string
}

export interface PersonPoint {
  lat: number
  lng: number
  color: string
  gateRef: string
}

export interface BinState {
  id: string
  label: string
  lat: number
  lng: number
  nearGate: string | null
  fillPercent: number
  level: DensityLevel
  color: string
  alert: boolean
  currentLiters: number
  maxLiters: number
}

export interface SimAlert {
  id: string
  type: 'bin' | 'crowd'
  name: string
  severity: 'warning' | 'critical'
  description: string
  lat: number
  lng: number
  value: number
}

export interface SimulationSnapshot {
  tick: number
  realTick: number
  phase: PhaseInfo
  gates: GateState[]
  persons: PersonPoint[]
  bins: BinState[]
  alerts: SimAlert[]
  totalCrowd: number
  maxCapacity: number
  occupancyRate: number
}

// ── Core simulation function ───────────────────────────────────────────────

const MAX_LITERS = 240
const MAX_PERSONS_PER_GATE = 120

export function simulate(tick: number): SimulationSnapshot {
  const rand = createPRNG(tick * 137 + 42)
  const realTick = tick * 5
  const phase = getPhase(tick)
  const [dMin, dMax] = phase.densityRange
  const cosLat = Math.cos(STADIUM_CENTER[0] * Math.PI / 180)

  // ── Gates ────────────────────────────────────────────────────────────────
  const gates: GateState[] = GATES.map((gate, i) => {
    const globalFactor = dMin + rand() * (dMax - dMin)
    const density = Math.min(1.0, globalFactor * GATE_BASE_FACTORS[i])
    const crowdCount = Math.round(gate.capacity * density)
    const { level, color } = densityToLevel(density)
    return { ...gate, density, crowdCount, level, color }
  })

  // ── Persons (queues extending outward from each gate) ────────────────────
  // Each gate generates a directional queue: people line up perpendicular to
  // the polygon edge, density highest near the gate, tapering off outward.
  // A small fraction (~15%) walks along the perimeter between gates.
  const persons: PersonPoint[] = []
  gates.forEach(gate => {
    const count = Math.round(MAX_PERSONS_PER_GATE * gate.density)

    // Outward direction from stadium center to gate (visual-corrected)
    const dLat = gate.lat - STADIUM_CENTER[0]
    const dLngVis = (gate.lng - STADIUM_CENTER[1]) * cosLat
    const len = Math.hypot(dLat, dLngVis) || 1
    const outLat = dLat / len
    const outLngVis = dLngVis / len
    // Perpendicular (queue width direction)
    const perpLat = -outLngVis
    const perpLngVis = outLat

    for (let i = 0; i < count; i++) {
      const isInQueue = rand() < 0.85          // 85% queue, 15% perimeter walkers
      if (isInQueue) {
        // Queue extends outward, ~110m max, biased toward gate
        const dist  = Math.pow(rand(), 1.6) * 0.0011
        const width = (rand() - 0.5) * 0.00028
        const offLat = outLat * dist + perpLat * width
        const offLngVis = outLngVis * dist + perpLngVis * width
        persons.push({
          lat: gate.lat + offLat,
          lng: gate.lng + offLngVis / cosLat,
          color: gate.color,
          gateRef: gate.id,
        })
      } else {
        // Perimeter walkers: tangent to stadium, near the gate
        const tangentDist = (rand() - 0.5) * 0.0014
        const radialJit   = (rand() - 0.5) * 0.0003
        const offLat = perpLat * tangentDist + outLat * radialJit
        const offLngVis = perpLngVis * tangentDist + outLngVis * radialJit
        persons.push({
          lat: gate.lat + offLat,
          lng: gate.lng + offLngVis / cosLat,
          color: gate.color,
          gateRef: gate.id,
        })
      }
    }
  })

  // ── Bins ──────────────────────────────────────────────────────────────────
  const avgDensity = gates.reduce((s, g) => s + g.density, 0) / gates.length
  const bins: BinState[] = BINS_BASE.map((bin, i) => {
    const nearGateDensity = bin.nearGate
      ? (gates.find(g => g.id === bin.nearGate)?.density ?? avgDensity)
      : avgDensity
    const growth = nearGateDensity * BIN_SPEED_FACTORS[i] * (realTick / 200) * 90
    const fillPercent = Math.min(100, Math.round(BIN_BASELINES[i] + growth))
    const { level, color } = fillToLevel(fillPercent)
    return {
      id: bin.id,
      label: bin.label,
      lat: bin.lat,
      lng: bin.lng,
      nearGate: bin.nearGate,
      fillPercent,
      level,
      color,
      alert: fillPercent >= 75,
      currentLiters: Math.round(MAX_LITERS * fillPercent / 100),
      maxLiters: MAX_LITERS,
    }
  })

  // ── Alerts ────────────────────────────────────────────────────────────────
  const alerts: SimAlert[] = []
  bins.filter(b => b.alert).forEach(bin => {
    alerts.push({
      id: `alert-bin-${bin.id}`,
      type: 'bin',
      name: bin.label,
      severity: bin.fillPercent >= 90 ? 'critical' : 'warning',
      description: `Niveau ${bin.fillPercent}% — collecte urgente requise`,
      lat: bin.lat,
      lng: bin.lng,
      value: bin.fillPercent,
    })
  })
  gates.filter(g => g.level === 'critical' || g.level === 'high').forEach(gate => {
    alerts.push({
      id: `alert-gate-${gate.id}`,
      type: 'crowd',
      name: gate.name,
      severity: gate.level === 'critical' ? 'critical' : 'warning',
      description: `${gate.crowdCount} pers. · densité ${Math.round(gate.density * 100)}%`,
      lat: gate.lat,
      lng: gate.lng,
      value: gate.crowdCount,
    })
  })

  const totalCrowd = gates.reduce((s, g) => s + g.crowdCount, 0)
  const maxCapacity = GATES.reduce((s, g) => s + g.capacity, 0)

  return {
    tick,
    realTick,
    phase,
    gates,
    persons,
    bins,
    alerts,
    totalCrowd,
    maxCapacity,
    occupancyRate: Math.round((totalCrowd / maxCapacity) * 100),
  }
}

// Pre-generate all 41 snapshots once at module load
export const ALL_SNAPSHOTS: SimulationSnapshot[] = Array.from({ length: 41 }, (_, i) => simulate(i))
