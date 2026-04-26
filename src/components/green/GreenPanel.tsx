// ─── GreenPanel ───────────────────────────────────────────────────────────
// Compact bin status panel used in the legacy DashboardPage grid.
import { useGreen } from '@/hooks'
import { useDemoState } from '@/stores/demoStore'
import { shortTime } from '@/lib/utils'

function fillColor(pct: number) {
  if (pct >= 85) return '#EF4444'
  if (pct >= 65) return '#FF6600'
  return '#10B981'
}

export function GreenPanel() {
  const demoActive = useDemoState()
  const { data: green, isLoading } = useGreen(demoActive)

  const fullBins = green?.sites.reduce(
    (acc, s) => acc + s.zones.filter(z => z.fill_percentage >= 80).length,
    0,
  ) ?? 0

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[14px]">🗑️</span>
          <h2 className="text-[13px] font-semibold text-[#111827]">Smart Green</h2>
          {fullBins > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#EF4444] text-white rounded-[3px]">
              {fullBins} alerte{fullBins > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#9CA3AF] font-mono">
          {green?.timestamp ? shortTime(green.timestamp) : ''}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {isLoading && (
          <div className="text-center text-[13px] text-[#9CA3AF] py-6">Chargement...</div>
        )}

        {green?.sites.map(site => {
          const pct = site.max_fill_percentage
          const color = fillColor(pct)
          return (
            <div key={site.site_id} className="p-2 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[6px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[12px] font-medium text-[#111827] truncate max-w-[160px]">
                  {site.site_name}
                  {site.early_crowd_alert && ' ⚠️'}
                </span>
                <span className="text-[11px] font-bold ml-2" style={{ color }}>{pct}%</span>
              </div>
              <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <div className="text-[10px] text-[#9CA3AF] mt-1">{site.zones.length} zones</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
