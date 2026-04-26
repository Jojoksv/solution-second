// ─── Topbar ───────────────────────────────────────────────────────────────
// Search trigger, live KPIs, IRG badge, and theme toggle.

import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldAlert, Wifi, Users, TrendingUp, Sun, Moon, AlertTriangle, Activity } from 'lucide-react'
import { useDensity } from '@/hooks'
import { useAlerts } from '@/hooks'
import { fmt } from '@/lib/utils'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { useTheme } from '@/stores/themeStore'
import type { RiskLevel } from '@/types'

function computeIrg(density: ReturnType<typeof useDensity>['data']) {
  if (!density?.sites) return { score: 0, level: 'nominal' as RiskLevel }
  const occs = density.sites.map(s => s.occupancy_percentage)
  const avg = occs.reduce((a, b) => a + b, 0) / Math.max(1, occs.length)
  const peak = Math.max(...occs, 0)
  const score = Math.min(100, Math.round(avg * 0.55 + peak * 0.4))
  const level: RiskLevel =
    score > 90 ? 'emergency' :
    score > 75 ? 'critical' :
    score > 55 ? 'alert' :
    score > 30 ? 'vigilance' : 'nominal'
  return { score, level }
}

export function Topbar() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const { data: density } = useDensity()
  const { data: alerts } = useAlerts()
  const { theme, toggleTheme } = useTheme()

  const riskIndex = useMemo(() => computeIrg(density), [density])
  const isCritical = riskIndex.level === 'critical' || riskIndex.level === 'alert' || riskIndex.level === 'emergency'
  const totalPeople = density?.global_metrics.total_estimated_people ?? 0
  const sitesInAlert = density?.global_metrics.sites_in_alert ?? 0
  const alertCount = alerts?.active_alerts.length ?? 0

  const riskColor =
    riskIndex.level === 'emergency' || riskIndex.level === 'critical' ? 'var(--accent-red)' :
    riskIndex.level === 'alert' || riskIndex.level === 'vigilance' ? 'var(--accent-orange)' :
    'var(--accent-green)'

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen(o => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header
        className="h-14 flex-shrink-0 flex items-center justify-between px-5 border-b gap-4"
        style={{
          background: 'var(--bg-panel)',
          borderColor: 'var(--border-subtle)',
          transition: 'background 0.3s ease, border-color 0.3s ease',
        }}
      >
        {/* Search trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center w-[260px] h-8 rounded-lg px-3 hover:opacity-80 transition-all text-left flex-none"
          style={{ background: 'var(--bg-panel-hover)', border: '1px solid var(--border-subtle)' }}
        >
          <Search size={13} className="mr-2 flex-none" style={{ color: 'var(--text-muted)' }} />
          <span className="flex-1 text-[12px]" style={{ color: 'var(--text-muted)' }}>
            Sites, zones, alertes…
          </span>
          <div className="flex items-center gap-0.5">
            <kbd className="hidden md:inline-flex text-[9px] px-1.5 py-0.5 rounded font-sans" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-focus)' }}>⌘</kbd>
            <kbd className="hidden md:inline-flex text-[9px] px-1.5 py-0.5 rounded font-sans" style={{ background: 'var(--bg-base)', color: 'var(--text-muted)', border: '1px solid var(--border-focus)' }}>K</kbd>
          </div>
        </button>

        {/* Center KPIs */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          {/* Total people */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-3 h-8 rounded-lg"
            style={{ background: 'var(--bg-panel-hover)', border: '1px solid var(--border-subtle)' }}
          >
            <Users size={12} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-[12px] font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(totalPeople)}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>pers.</span>
          </div>

          {/* Alerts */}
          {alertCount > 0 && (
            <div
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg status-pulse-red"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}
            >
              <AlertTriangle size={12} style={{ color: 'var(--accent-red)' }} />
              <span className="text-[12px] font-bold" style={{ color: 'var(--accent-red)' }}>{alertCount}</span>
              <span className="text-[10px]" style={{ color: 'var(--accent-red)', opacity: 0.8 }}>
                alerte{alertCount > 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* System health */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-3 h-8 rounded-lg"
            style={{ background: 'var(--bg-panel-hover)', border: '1px solid var(--border-subtle)' }}
          >
            <Wifi size={12} style={{ color: 'var(--accent-green)' }} />
            <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>Systèmes OK</span>
          </div>

          {/* Sites in alert */}
          {sitesInAlert > 0 && (
            <div
              className="hidden xl:flex items-center gap-1.5 px-3 h-8 rounded-lg"
              style={{ background: `rgba(239,68,68,0.08)`, border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <TrendingUp size={12} style={{ color: 'var(--accent-red)' }} />
              <span className="text-[11px] font-semibold" style={{ color: 'var(--accent-red)' }}>
                {sitesInAlert} site{sitesInAlert > 1 ? 's' : ''} en alerte
              </span>
            </div>
          )}
        </div>

        {/* Right: IRG + Theme Toggle */}
        <div className="flex items-center gap-2 flex-none">
          {/* IRG badge */}
          <div
            className={`flex items-center gap-2 px-3 h-8 rounded-lg ${isCritical ? 'risk-critical' : ''}`}
            style={{
              background: `${riskColor}12`,
              border: `1px solid ${riskColor}30`,
            }}
          >
            <ShieldAlert size={13} style={{ color: riskColor }} />
            <span className="text-[11px] font-bold" style={{ color: riskColor }}>
              IRG {riskIndex.score}
            </span>
            <span
              className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded"
              style={{ background: `${riskColor}20`, color: riskColor }}
            >
              {riskIndex.level === 'emergency' ? 'URGENCE' :
               riskIndex.level === 'critical' ? 'CRITIQUE' :
               riskIndex.level === 'alert' ? 'ALERTE' :
               riskIndex.level === 'vigilance' ? 'VIGILANCE' : 'NOMINAL'}
            </span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-8 flex items-center justify-center rounded-lg transition-all hover:opacity-80"
            style={{
              background: 'var(--bg-panel-hover)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            title={theme === 'dark' ? 'Passer en mode clair' : 'Passer en mode sombre'}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}
