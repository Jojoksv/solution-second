// ─── Topbar ───────────────────────────────────────────────────────────────
// Search trigger (opens Command Palette via Ctrl+K), live KPIs, IRG badge.

import { useEffect, useMemo, useState } from 'react'
import { Search, ShieldAlert, Wifi, Users, TrendingUp } from 'lucide-react'
import { useDensity } from '@/hooks'
import { fmt } from '@/lib/utils'
import { CommandPalette } from '@/components/layout/CommandPalette'
import type { RiskLevel } from '@/types'

// Derive IRG from cached density — avoids a separate 3 s polling cycle that
// was making duplicate fetchDensity() HTTP calls on every tick.
function computeIrg(density: ReturnType<typeof useDensity>['data']) {
  if (!density?.sites) return { score: 0, level: 'nominal' as RiskLevel }
  const occs = density.sites.map((s) => s.occupancy_percentage)
  const avg = occs.reduce((a, b) => a + b, 0) / Math.max(1, occs.length)
  const peak = Math.max(...occs, 0)
  const score = Math.min(100, Math.round(avg * 0.55 + peak * 0.4))
  const level: RiskLevel =
    score > 90
      ? 'emergency'
      : score > 75
        ? 'critical'
        : score > 55
          ? 'alert'
          : score > 30
            ? 'vigilance'
            : 'nominal'
  return { score, level }
}

export function Topbar() {
  const [paletteOpen, setPaletteOpen] = useState(false)
  // OPTIMISATION: Fixed polling - demo mode doesn't affect polling frequency anymore
  const { data: density } = useDensity()

  const riskIndex = useMemo(() => computeIrg(density), [density])

  const isCritical =
    riskIndex.level === 'critical' ||
    riskIndex.level === 'alert' ||
    riskIndex.level === 'emergency'
  const totalPeople = density?.global_metrics.total_estimated_people ?? 0
  const sitesInAlert = density?.global_metrics.sites_in_alert ?? 0

  // Global keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-[#2A2A2A] bg-[#0A0A0A] gap-4">
        {/* ── Search trigger (opens palette) ── */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center w-[300px] h-8 bg-[#111111] border border-[#2A2A2A] rounded-[4px] px-3 hover:border-[#3A3A3A] transition-colors text-left"
        >
          <Search size={14} className="text-[#555555] mr-2 flex-none" />
          <span className="flex-1 text-[13px] text-[#555555]">
            Sites, zones, alertes…
          </span>
          <div className="flex items-center gap-1">
            <kbd className="hidden md:inline-flex text-[10px] bg-[#1A1A1A] text-[#888888] px-1.5 py-0.5 rounded border border-[#2A2A2A] font-sans">
              ⌘
            </kbd>
            <kbd className="hidden md:inline-flex text-[10px] bg-[#1A1A1A] text-[#888888] px-1.5 py-0.5 rounded border border-[#2A2A2A] font-sans">
              K
            </kbd>
          </div>
        </button>

        {/* ── Right Side Tools ── */}
        <div className="flex items-center gap-3">
          {/* Total people KPI */}
          <div className="hidden lg:flex items-center gap-2 px-3 h-8 bg-[#111111] border border-[#2A2A2A] rounded-[4px]">
            <Users size={12} className="text-[#0070F3]" />
            <span className="text-[12px] font-mono text-[#EDEDED]">
              {fmt(totalPeople)}
            </span>
            <span className="text-[10px] text-[#888888]">pers.</span>
          </div>

          {/* Sites in alert KPI */}
          {sitesInAlert > 0 && (
            <div className="flex items-center gap-2 px-3 h-8 bg-[#E5484D]/10 border border-[#E5484D]/30 rounded-[4px] status-pulse-red">
              <TrendingUp size={12} className="text-[#E5484D]" />
              <span className="text-[12px] font-bold text-[#E5484D]">
                {sitesInAlert}
              </span>
              <span className="text-[10px] text-[#E5484D]/80">
                site{sitesInAlert > 1 ? 's' : ''} en alerte
              </span>
            </div>
          )}

          {/* System Health Status */}
          <div className="flex items-center gap-2 px-3 h-8 bg-[#111111] border border-[#2A2A2A] rounded-[4px]">
            <Wifi size={12} className="text-[#10B981]" />
            <span className="text-[12px] font-medium text-[#888888]">
              Tous systèmes opérationnels
            </span>
          </div>

          {/* Risk Index Badge */}
          <div
            className={`flex items-center gap-2 px-3 h-8 border rounded-[4px] ${
              isCritical
                ? 'bg-[#E5484D]/10 border-[#E5484D]/30 text-[#E5484D]'
                : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'
            }`}
          >
            <ShieldAlert size={14} />
            <span className="text-[12px] font-bold">
              IRG : {riskIndex.score}
            </span>
          </div>
        </div>
      </header>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
      />
    </>
  )
}
