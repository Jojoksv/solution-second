// ─── Simulation Store ──────────────────────────────────────────────────────
// Module-level reactive state — same pattern as demoStore.ts

import { useState, useEffect } from 'react'
import { ALL_SNAPSHOTS } from '@/lib/stadiumSimulation'
import type { SimulationSnapshot } from '@/lib/stadiumSimulation'

type Listener = () => void
const _listeners = new Set<Listener>()
function _notify() { _listeners.forEach(fn => fn()) }

let _tick = 0
let _isPlaying = false
let _speed = 1
let _intervalId: ReturnType<typeof setInterval> | null = null

function _clearTimer() {
  if (_intervalId !== null) {
    clearInterval(_intervalId)
    _intervalId = null
  }
}

// ── Public actions ─────────────────────────────────────────────────────────

export function simSetTick(t: number) {
  _tick = Math.max(0, Math.min(40, t))
  _notify()
}

export function simPause() {
  if (!_isPlaying) return
  _isPlaying = false
  _clearTimer()
  _notify()
}

export function simPlay() {
  if (_isPlaying) return
  _isPlaying = true
  _notify()
  _intervalId = setInterval(() => {
    if (_tick >= 40) {
      simPause()
      return
    }
    _tick += 1
    _notify()
  }, Math.round(800 / _speed))
}

export function simToggle() {
  _isPlaying ? simPause() : simPlay()
}

export function simReset() {
  simPause()
  simSetTick(0)
}

export function simGoToPeak() {
  simPause()
  simSetTick(14) // realTick 70 = peak
}

export function simSetSpeed(s: number) {
  _speed = s
  const wasPlaying = _isPlaying
  if (wasPlaying) {
    _isPlaying = false
    _clearTimer()
  }
  if (wasPlaying) simPlay()
  else _notify()
}

// ── React hook ─────────────────────────────────────────────────────────────

export interface SimStore {
  tick: number
  isPlaying: boolean
  speed: number
  snapshot: SimulationSnapshot
  setTick: typeof simSetTick
  toggle: typeof simToggle
  reset: typeof simReset
  goToPeak: typeof simGoToPeak
  setSpeed: typeof simSetSpeed
}

export function useSimulationStore(): SimStore {
  const [, rerender] = useState(0)

  useEffect(() => {
    const fn = () => rerender(n => n + 1)
    _listeners.add(fn)
    return () => { _listeners.delete(fn) }
  }, [])

  return {
    tick: _tick,
    isPlaying: _isPlaying,
    speed: _speed,
    snapshot: ALL_SNAPSHOTS[_tick],
    setTick: simSetTick,
    toggle: simToggle,
    reset: simReset,
    goToPeak: simGoToPeak,
    setSpeed: simSetSpeed,
  }
}
