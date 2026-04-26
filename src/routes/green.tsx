import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Leaf, Award, BarChart2, QrCode, Sparkles } from 'lucide-react'
import { GreenPanel } from '@/components/green/GreenPanel'
import { QUERY_KEYS, useGreen } from '@/hooks'
import { useDemoState } from '@/stores/demoStore'
import type { GreenPayload } from '@/types'

export const Route = createFileRoute('/green')({
  component: GreenPage,
})

// Local leaderboard state — points accumulated through QR scans (in-session)
let localScans = 0
let localPoints = 145

export function GreenPage() {
  const demoActive = useDemoState()
  const { data: green } = useGreen(demoActive)
  const qc = useQueryClient()
  const [lastScan, setLastScan] = useState<{ site: string; zone: string; gain: number } | null>(null)
  const [, force] = useState(0)

  function simulateQrScan() {
    if (!green?.sites.length) return

    // Pick a random site/zone
    const site = green.sites[Math.floor(Math.random() * green.sites.length)]
    if (!site.zones.length) return
    const zone = site.zones[Math.floor(Math.random() * site.zones.length)]
    const gain = 5

    // Mutate local cache directly — invalidation will trigger UI update
    qc.setQueryData<GreenPayload>(QUERY_KEYS.green, (prev) => {
      if (!prev) return prev
      const next: GreenPayload = JSON.parse(JSON.stringify(prev))
      const targetSite = next.sites.find(s => s.site_id === site.site_id)
      if (!targetSite) return prev
      const targetZone = targetSite.zones.find(z => z.zone_name === zone.zone_name)
      if (!targetZone) return prev
      targetZone.fill_percentage = Math.min(100, targetZone.fill_percentage + gain)
      // Update site rollup
      targetSite.max_fill_percentage = Math.max(...targetSite.zones.map(z => z.fill_percentage))
      targetSite.site_fill_status =
        targetSite.max_fill_percentage > 75 ? 'red' :
        targetSite.max_fill_percentage > 50 ? 'orange' : 'green'
      return next
    })

    localScans += 1
    localPoints += gain
    setLastScan({ site: site.site_name, zone: zone.zone_name, gain })
    force(n => n + 1)
    setTimeout(() => setLastScan(null), 3500)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto h-full pb-6">
      <div>
        <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">Smart Green</h1>
        <p className="text-[13px] text-[#888888] mt-1">
          Gestion participative des déchets via QR Codes et gamification.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1">
        {/* Main Panel */}
        <div className="panel flex flex-col flex-[2] min-h-[500px]">
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf size={14} className="text-[#10B981]" />
              <h2 className="text-[13px] font-semibold text-[#EDEDED]">État des poubelles & maillage</h2>
            </div>
            <button
              onClick={simulateQrScan}
              className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30 rounded px-3 py-1.5 transition-all hover:scale-[1.02]"
            >
              <QrCode size={12} />
              Simuler scan QR
            </button>
          </div>

          {lastScan && (
            <div className="px-4 py-2 bg-[#10B981]/10 border-b border-[#10B981]/20 flex items-center gap-2 text-[12px] text-[#10B981] toast-slide-in">
              <Sparkles size={12} />
              <span><strong>+{lastScan.gain} %</strong> à {lastScan.zone} ({lastScan.site}) · +{lastScan.gain} points</span>
            </div>
          )}

          <div className="p-4 flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-2">
              <GreenPanel />
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="flex flex-col flex-1 gap-4">
          <div className="panel flex flex-col">
            <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center gap-2">
              <Award size={14} className="text-[#F5A623]" />
              <h2 className="text-[13px] font-semibold text-[#EDEDED]">Classement participants</h2>
            </div>
            <div className="p-4">
              <ul className="flex flex-col gap-2">
                <li className="flex items-center gap-3 p-3 rounded-[4px] bg-[#141414] border border-[#F5A623]/30">
                  <div className="text-[14px] font-bold text-[#F5A623] w-4 text-center">1</div>
                  <div className="flex-1 flex flex-col">
                    <strong className="text-[13px] text-[#EDEDED] font-medium leading-none">77 654 ** **</strong>
                    <span className="text-[11px] text-[#F5A623] mt-1">Badge Eco-Hero</span>
                  </div>
                  <div className="text-[12px] font-bold text-[#EDEDED]">{localPoints} pts</div>
                </li>
                <li className="flex items-center gap-3 p-3 rounded-[4px] bg-[#141414] border border-[#2A2A2A]">
                  <div className="text-[14px] font-bold text-[#888888] w-4 text-center">2</div>
                  <div className="flex-1 flex flex-col">
                    <strong className="text-[13px] text-[#EDEDED] font-medium leading-none">78 123 ** **</strong>
                    <span className="text-[11px] text-[#10B981] mt-1">Eco-Acteur</span>
                  </div>
                  <div className="text-[12px] font-bold text-[#EDEDED]">85 pts</div>
                </li>
                <li className="flex items-center gap-3 p-3 rounded-[4px] bg-[#141414] border border-[#2A2A2A]">
                  <div className="text-[14px] font-bold text-[#888888] w-4 text-center">3</div>
                  <div className="flex-1 flex flex-col">
                    <strong className="text-[13px] text-[#EDEDED] font-medium leading-none">76 999 ** **</strong>
                    <span className="text-[11px] text-[#888888] mt-1">Participant Vert</span>
                  </div>
                  <div className="text-[12px] font-bold text-[#EDEDED]">40 pts</div>
                </li>
              </ul>
            </div>
          </div>

          <div className="panel flex flex-col">
            <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center gap-2">
              <BarChart2 size={14} className="text-[#EDEDED]" />
              <h2 className="text-[13px] font-semibold text-[#EDEDED]">Statistiques journalières</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#141414] border border-[#2A2A2A] rounded-[4px] text-center">
                <div className="text-xl font-semibold text-[#10B981]">{184 + localScans}</div>
                <div className="text-[11px] mt-1 text-[#888888] uppercase tracking-wide">Signalements valides</div>
              </div>
              <div className="p-3 bg-[#141414] border border-[#2A2A2A] rounded-[4px] text-center">
                <div className="text-xl font-semibold text-[#E5484D]">12</div>
                <div className="text-[11px] mt-1 text-[#888888] uppercase tracking-wide">Faux positifs</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
