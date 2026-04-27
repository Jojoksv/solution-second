// ─── Theme Store ────────────────────────────────────────────────────────────
// Module-level singleton — no Zustand/context overhead.
// Applies data-theme attribute to <html> so CSS custom properties cascade.

import { useState, useEffect } from 'react'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'joj-theme'

function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* ignore — SSR or private browsing */ }
  return 'dark'
}

let _theme: Theme = getInitialTheme()

// Apply immediately so first paint has the right theme
document.documentElement.setAttribute('data-theme', _theme)

const _listeners = new Set<() => void>()

function notify() {
  _listeners.forEach(fn => fn())
}

export function getTheme(): Theme {
  return _theme
}

export function setTheme(theme: Theme) {
  _theme = theme
  document.documentElement.setAttribute('data-theme', theme)
  try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore */ }
  notify()
}

export function toggleTheme() {
  setTheme(_theme === 'dark' ? 'light' : 'dark')
}

export function useTheme() {
  const [theme, setLocalTheme] = useState<Theme>(_theme)

  useEffect(() => {
    const fn = () => setLocalTheme(_theme)
    _listeners.add(fn)
    return () => { _listeners.delete(fn) }
  }, [])

  return { theme, toggleTheme }
}
