// ─── Demo Store ───────────────────────────────────────────────────────────
// FIX : le notify() global réveillait TOUS les composants abonnés à chaque
// tick, même si la valeur _active n'avait pas changé.
// Correction : on ne notifie que si la valeur a RÉELLEMENT changé.

import { useState, useEffect } from 'react'
import { DEMO } from '@/config'

type Listener = (active: boolean) => void

let _active = false
let _endAt: number | null = null
const _listeners = new Set<Listener>()

// FIX : notify conditionnel — stocke la dernière valeur notifiée
let _lastNotified: boolean | null = null

function notify() {
  // Ne réveille les listeners que si la valeur a changé
  if (_active === _lastNotified) return
  _lastNotified = _active
  _listeners.forEach((fn) => fn(_active))
}

export function startDemo() {
  _active = true
  _endAt  = Date.now() + DEMO.durationMs
  notify()

  setTimeout(() => {
    _active = false
    _endAt  = null
    notify()
  }, DEMO.durationMs)
}

export function isDemoActive() {
  return _active
}

export function demoProgress(): number {
  if (!_active || !_endAt) return 0
  return 1 - (_endAt - Date.now()) / DEMO.durationMs
}

// ── React hook ─────────────────────────────────────────────────────────────
export function useDemoState() {
  const [active, setActive] = useState(_active)

  useEffect(() => {
    const fn: Listener = (v) => setActive(v)
    _listeners.add(fn)
    return () => { _listeners.delete(fn) }
  }, [])

  return active
}