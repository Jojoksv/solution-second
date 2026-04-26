// ─── Demo Store ───────────────────────────────────────────────────────────
// A tiny, context-free store for demo mode state shared across components.
// Using a simple module-level reactive pattern (no Zustand / Jotai needed).

import { useState, useEffect } from 'react'
import { DEMO } from '@/config'

type Listener = (active: boolean) => void

// ── Module state ───────────────────────────────────────────────────────────
let _active = false
let _endAt: number | null = null
const _listeners = new Set<Listener>()

function notify() {
  _listeners.forEach((fn) => fn(_active))
}

export function startDemo() {
  _active = true
  _endAt = Date.now() + DEMO.durationMs
  notify()

  setTimeout(() => {
    _active = false
    _endAt = null
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

// ── React hook ────────────────────────────────────────────────────────────
// OPTIMISATION: Added useCallback to stabilize the listener function
export function useDemoState() {
  const [active, setActive] = useState(_active)

  useEffect(() => {
    const fn: Listener = (v) => setActive(v)
    _listeners.add(fn)
    return () => {
      _listeners.delete(fn)
    }
  }, []) // Empty deps - fn is stable because setActive is stable

  return active
}
