// ─── Topbar ───────────────────────────────────────────────────────────────
// Search trigger (opens Command Palette via Ctrl+K), live KPIs, IRG badge.

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, ShieldAlert, Wifi, Users, TrendingUp } from 'lucide-react'
import { fetchRiskIndex } from '@/api'
import { useDensity } from '@/hooks'
import { useDemoState } from '@/stores/demoStore'
import { fmt } from '@/lib/utils'
import { CommandPalette } from '@/components/layout/CommandPalette'

export function Topbar() {
  const demoActive = useDemoState()
  const [paletteOpen, setPaletteOpen] = useState(false)

  const { data: riskIndex } = useQuery({
    queryKey: ['risk-index'],
    queryFn: fetchRiskIndex,
    refetchInterval: 5000,
  })
  const { data: density } = useDensity(demoActive)

  const isCritical = riskIndex?.level === 'critical' || riskIndex?.level === 'emergency'
  const isAlert = riskIndex?.level === 'alert'
  const totalPeople = density?.global_metrics.total_estimated_people ?? 0
  const sitesInAlert = density?.global_metrics.sites_in_alert ?? 0

  // Global keyboard shortcut: Ctrl+K / Cmd+K
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

  const riskColor = isCritical ? '#EF4444' : isAlert ? '#FF6600' : '#10B981'

  return (
    <>
      <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-[#E5E7EB] bg-white gap-4">

        {/* ── Search trigger (opens palette) ── */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex items-center w-[300px] h-8 bg-[#F4F5F7] border border-[#E5E7EB] rounded-[6px] px-3 hover:border-[#D1D5DB] transition-colors text-left"
        >
          <Search size={14} className="text-[#9CA3AF] mr-2 flex-none" />
          <span className="flex-1 text-[13px] text-[#9CA3AF]">Sites, zones, alertes…</span>
          <div className="flex items-center gap-1">
            <kbd className="hidden md:inline-flex text-[10px] bg-white text-[#9CA3AF] px-1.5 py-0.5 rounded border border-[#E5E7EB] font-sans">⌘</kbd>
            <kbd className="hidden md:inline-flex text-[10px] bg-white text-[#9CA3AF] px-1.5 py-0.5 rounded border border-[#E5E7EB] font-sans">K</kbd>
          </div>
        </button>

        {/* ── Right Side Tools ── */}
        <div className="flex items-center gap-3">

          {/* Total people KPI */}
          <div className="hidden lg:flex items-center gap-2 px-3 h-8 bg-[#F4F5F7] border border-[#E5E7EB] rounded-[6px]">
            <Users size={12} className="text-[#FF6600]" />
            <span className="text-[12px] font-mono text-[#111827] font-semibold">{fmt(totalPeople)}</span>
            <span className="text-[10px] text-[#6B7280]">pers.</span>
          </div>

          {/* Sites in alert KPI */}
          {sitesInAlert > 0 && (
            <div className="flex items-center gap-2 px-3 h-8 bg-[#EF4444]/8 border border-[#EF4444]/25 rounded-[6px] status-pulse-red">
              <TrendingUp size={12} className="text-[#EF4444]" />
              <span className="text-[12px] font-bold text-[#EF4444]">{sitesInAlert}</span>
              <span className="text-[10px] text-[#EF4444]/80">site{sitesInAlert > 1 ? 's' : ''} en alerte</span>
            </div>
          )}

          {/* System Health Status */}
          <div className="flex items-center gap-2 px-3 h-8 bg-[#F4F5F7] border border-[#E5E7EB] rounded-[6px]">
            <Wifi size={12} className="text-[#10B981]" />
            <span className="text-[12px] font-medium text-[#6B7280]">Tous systèmes opérationnels</span>
          </div>

          {/* Risk Index Badge */}
          <div
            className="flex items-center gap-2 px-3 h-8 border rounded-[6px]"
            style={{
              background: `${riskColor}12`,
              borderColor: `${riskColor}35`,
              color: riskColor,
            }}
          >
            <ShieldAlert size={14} />
            <span className="text-[12px] font-bold">IRG : {riskIndex?.score ?? 0}</span>
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}
