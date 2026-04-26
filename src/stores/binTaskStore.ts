// ─── Bin Task Store ────────────────────────────────────────────────────────
// Manages:
//   • User role (superviseur / agent)
//   • Bin cleaning tasks: pending → assigned → en_cours → terminé
//   • Monotonic fill tracking: fill levels only ever increase until cleaned
//
// Module-level reactive pattern — no Zustand/context needed.

import { useState, useEffect } from 'react'
import type { GreenSite } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────

export type UserRole = 'superviseur' | 'agent'
export type TaskStatus = 'pending' | 'assigned' | 'en_cours' | 'terminé'

export interface BinTask {
  id: string
  bin_id: string       // `${site_id}::${zone_name}`
  site_id: string
  site_name: string
  zone_name: string
  fill_pct: number     // fill % when task was created
  status: TaskStatus
  created_at: number
  assigned_at?: number
  completed_at?: number
}

// ── Module state ───────────────────────────────────────────────────────────

let _role: UserRole = 'superviseur'
let _tasks: BinTask[] = []

// Tracks the highest fill seen per bin (monotonic enforcement)
const _prevFills: Record<string, number> = {}
// Bins currently being emptied — their fill is suppressed to 0
const _resetBins: Set<string> = new Set()

type Listener = () => void
const _listeners = new Set<Listener>()

function notify() {
  _listeners.forEach(fn => fn())
}

// ── Role ───────────────────────────────────────────────────────────────────

export function getRole(): UserRole { return _role }

export function setRole(r: UserRole) {
  _role = r
  notify()
}

// ── Monotonic fill ─────────────────────────────────────────────────────────
// Returns the corrected fill for a bin. Call with every raw value from the API.
export function getMonotonicFill(binId: string, rawFill: number): number {
  if (_resetBins.has(binId)) return 0
  const prev = _prevFills[binId] ?? 0
  const stable = Math.max(prev, rawFill)
  _prevFills[binId] = stable
  return stable
}

export function isResetBin(binId: string): boolean {
  return _resetBins.has(binId)
}

// ── Task generation ────────────────────────────────────────────────────────
// Call whenever fresh green data arrives. Auto-creates tasks for bins ≥ 75%.
export function checkAndGenerateTasks(sites: GreenSite[]) {
  let changed = false
  sites.forEach(site => {
    site.zones.forEach(zone => {
      const binId = `${site.site_id}::${zone.zone_name}`
      const fill = getMonotonicFill(binId, zone.fill_percentage)
      if (fill < 75) return
      const alreadyActive = _tasks.some(
        t => t.bin_id === binId &&
             (t.status === 'pending' || t.status === 'assigned' || t.status === 'en_cours')
      )
      if (alreadyActive) return
      _tasks = [..._tasks, {
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        bin_id: binId,
        site_id: site.site_id,
        site_name: site.site_name,
        zone_name: zone.zone_name,
        fill_pct: fill,
        status: 'pending',
        created_at: Date.now(),
      }]
      changed = true
    })
  })
  if (changed) notify()
}

// ── Task lifecycle ─────────────────────────────────────────────────────────

export function assignTask(taskId: string) {
  _tasks = _tasks.map(t =>
    t.id === taskId
      ? { ...t, status: 'assigned' as TaskStatus, assigned_at: Date.now() }
      : t
  )
  notify()
}

export function acceptTask(taskId: string) {
  _tasks = _tasks.map(t =>
    t.id === taskId ? { ...t, status: 'en_cours' as TaskStatus } : t
  )
  notify()
}

export function completeTask(taskId: string) {
  const task = _tasks.find(t => t.id === taskId)
  if (!task) return

  _tasks = _tasks.map(t =>
    t.id === taskId
      ? { ...t, status: 'terminé' as TaskStatus, completed_at: Date.now() }
      : t
  )

  // Suppress fill immediately, re-enable after 5 s (bin starts refilling)
  const { bin_id } = task
  _resetBins.add(bin_id)
  _prevFills[bin_id] = 0
  notify()

  setTimeout(() => {
    _resetBins.delete(bin_id)
    notify()
  }, 5000)
}

// ── React hook ────────────────────────────────────────────────────────────

export function useBinTaskStore() {
  const [, setTick] = useState(0)

  useEffect(() => {
    const fn = () => setTick(n => n + 1)
    _listeners.add(fn)
    return () => { _listeners.delete(fn) }
  }, [])

  return {
    role:           _role,
    tasks:          _tasks,
    pendingTasks:   _tasks.filter(t => t.status === 'pending'),
    assignedTasks:  _tasks.filter(t => t.status === 'assigned'),
    activeTasks:    _tasks.filter(t => t.status === 'en_cours'),
    completedTasks: _tasks.filter(t => t.status === 'terminé').slice(-10),
    setRole,
    assignTask,
    acceptTask,
    completeTask,
  }
}
