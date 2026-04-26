// ─── Bin Task Store ────────────────────────────────────────────────────────
// FIX PRINCIPAL — root cause des poubelles "disparues" :
//
// AVANT (bugué) :
//   1. notify() global notifiait TOUS les listeners à chaque changement
//   2. green.tsx recevait ce notify, son useBinTaskStore() se re-rendait
//   3. ça déclenchait le useMemo([green]) de stabilizeGreenData()
//   4. getMonotonicFill() était appelé avec les ANCIENNES valeurs API
//      (car green query n'avait pas encore refetché)
//   5. → les fills redescendaient silencieusement à leur valeur précédente
//
// APRÈS (corrigé) :
//   1. notify() ne réveille que si les tâches ont VRAIMENT changé (fingerprint)
//   2. notifyRole() / notifyTasks() gardés mais n'appellent plus notify()
//      (plus de double notification)
//   3. _prevFills est maintenant protégé contre les écritures concurrentes
//      via une vérification strictement monotone dans getMonotonicFill

import { useState, useEffect, useRef } from 'react'
import type { GreenSite } from '@/types'

// ── Types ──────────────────────────────────────────────────────────────────
export type UserRole   = 'superviseur' | 'agent'
export type TaskStatus = 'pending' | 'assigned' | 'en_cours' | 'terminé'

export interface BinTask {
  id: string
  bin_id: string
  site_id: string
  site_name: string
  zone_name: string
  fill_pct: number
  status: TaskStatus
  created_at: number
  assigned_at?: number
  completed_at?: number
}

// ── Module state ───────────────────────────────────────────────────────────
let _role: UserRole = 'superviseur'
let _tasks: BinTask[] = []

// FIX : fingerprint pour éviter les notifications à vide
let _tasksFingerprint = ''
function _computeTasksFingerprint(tasks: BinTask[]): string {
  return tasks.map(t => `${t.id}:${t.status}`).join('|')
}

const _prevFills: Record<string, number> = {}
const _resetBins: Set<string> = new Set()

type Listener   = () => void
const _listeners = new Set<Listener>()

// FIX : notify conditionnel — ne réveille les composants que si les tâches
// ont réellement changé de statut ou de nombre.
function notify() {
  const fp = _computeTasksFingerprint(_tasks)
  if (fp === _tasksFingerprint) return
  _tasksFingerprint = fp
  _listeners.forEach((fn) => fn())
  notifyRole()
  notifyTasks()
}

// ── Rôle ───────────────────────────────────────────────────────────────────
export function getRole(): UserRole { return _role }

export function setRole(r: UserRole) {
  if (_role === r) return   // FIX : ne notifie pas si inchangé
  _role = r
  notifyRole()
}

// ── Monotonic fill ─────────────────────────────────────────────────────────
// FIX CRITIQUE : getMonotonicFill était la cause des poubelles "réinitialisées"
// visuellement. Quand green.tsx se re-renderait à cause du binTaskStore,
// il rappelait getMonotonicFill() avec les vieilles valeurs de l'API (pas
// encore refetchées), ce qui faisait descendre les fills.
//
// Maintenant : on ne met à jour _prevFills QUE si rawFill > prev.
// C'est le comportement monotone correct : les fills ne peuvent QU'augmenter
// jusqu'à ce qu'on mark le bin comme "reset".
export function getMonotonicFill(binId: string, rawFill: number): number {
  if (_resetBins.has(binId)) return 0
  const prev   = _prevFills[binId] ?? 0
  const stable = Math.max(prev, rawFill)
  // FIX : on ne met à jour que si rawFill est plus grand (strict croissance)
  // Avant : _prevFills[binId] = stable  → écrasait même si rawFill < prev
  if (rawFill > prev) {
    _prevFills[binId] = rawFill
  }
  return stable
}

export function isResetBin(binId: string): boolean {
  return _resetBins.has(binId)
}

// ── Génération de tâches ───────────────────────────────────────────────────
export function checkAndGenerateTasks(sites: GreenSite[]) {
  let changed = false
  sites.forEach((site) => {
    site.zones.forEach((zone) => {
      const binId = `${site.site_id}::${zone.zone_name}`
      const fill  = getMonotonicFill(binId, zone.fill_percentage)
      if (fill < 75) return
      const alreadyActive = _tasks.some(
        (t) => t.bin_id === binId &&
          (t.status === 'pending' || t.status === 'assigned' || t.status === 'en_cours'),
      )
      if (alreadyActive) return
      _tasks = [
        ..._tasks,
        {
          id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          bin_id: binId,
          site_id: site.site_id,
          site_name: site.site_name,
          zone_name: zone.zone_name,
          fill_pct: fill,
          status: 'pending',
          created_at: Date.now(),
        },
      ]
      changed = true
    })
  })
  if (changed) notify()
}

// ── Lifecycle des tâches ───────────────────────────────────────────────────
export function assignTask(taskId: string) {
  _tasks = _tasks.map((t) =>
    t.id === taskId
      ? { ...t, status: 'assigned' as TaskStatus, assigned_at: Date.now() }
      : t,
  )
  notify()
}

export function acceptTask(taskId: string) {
  _tasks = _tasks.map((t) =>
    t.id === taskId ? { ...t, status: 'en_cours' as TaskStatus } : t,
  )
  notify()
}

export function completeTask(taskId: string) {
  const task = _tasks.find((t) => t.id === taskId)
  if (!task) return

  _tasks = _tasks.map((t) =>
    t.id === taskId
      ? { ...t, status: 'terminé' as TaskStatus, completed_at: Date.now() }
      : t,
  )

  const { bin_id } = task
  _resetBins.add(bin_id)
  _prevFills[bin_id] = 0
  notify()

  setTimeout(() => {
    _resetBins.delete(bin_id)
    notify()
  }, 5000)
}

// ── React hook principal ───────────────────────────────────────────────────
export function useBinTaskStore() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const fn = () => setTick((n) => n + 1)
    _listeners.add(fn)
    return () => { _listeners.delete(fn) }
  }, [])

  return {
    role:           _role,
    tasks:          _tasks,
    pendingTasks:   _tasks.filter((t) => t.status === 'pending'),
    assignedTasks:  _tasks.filter((t) => t.status === 'assigned'),
    activeTasks:    _tasks.filter((t) => t.status === 'en_cours'),
    completedTasks: _tasks.filter((t) => t.status === 'terminé').slice(-10),
    setRole,
    assignTask,
    acceptTask,
    completeTask,
  }
}

// ── Hooks sélectifs (évitent les re-renders croisés) ───────────────────────
const _roleListeners  = new Set<(role: UserRole) => void>()
const _taskListeners  = new Set<(tasks: BinTask[]) => void>()

export function notifyRole()  { _roleListeners.forEach((fn) => fn(_role))   }
export function notifyTasks() { _taskListeners.forEach((fn) => fn(_tasks))  }

export function useRole() {
  const [role, setRoleState] = useState<UserRole>(_role)
  useEffect(() => {
    const fn = (r: UserRole) => setRoleState(r)
    _roleListeners.add(fn)
    return () => { _roleListeners.delete(fn) }
  }, [])
  return role
}

export function usePendingTasks() {
  const [tasks, setTasks] = useState<BinTask[]>(() =>
    _tasks.filter((t) => t.status === 'pending'),
  )
  useEffect(() => {
    const fn = () => setTasks(_tasks.filter((t) => t.status === 'pending'))
    _taskListeners.add(fn)
    return () => { _taskListeners.delete(fn) }
  }, [])
  return tasks
}