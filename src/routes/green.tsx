import { useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Leaf, Trash2, CheckCircle2, Clock, AlertTriangle, UserCheck, HardHat, Sparkles } from 'lucide-react'
import { useGreen } from '@/hooks'
import { useDemoState } from '@/stores/demoStore'
import {
  useBinTaskStore,
  checkAndGenerateTasks,
  getMonotonicFill,
  isResetBin,
} from '@/stores/binTaskStore'
import type { GreenSite } from '@/types'

export const Route = createFileRoute('/green')({
  component: GreenPage,
})

// ── Helpers ────────────────────────────────────────────────────────────────

function fillColor(pct: number) {
  if (pct >= 85) return '#EF4444'
  if (pct >= 65) return '#FF6600'
  return '#10B981'
}

function fillBg(pct: number) {
  if (pct >= 85) return 'bg-[#FEF2F2] border-[#EF4444]/25'
  if (pct >= 65) return 'bg-[#FFF7ED] border-[#FF6600]/20'
  return 'bg-[#F0FDF4] border-[#10B981]/20'
}

function timeAgo(ms: number) {
  const s = Math.round((Date.now() - ms) / 1000)
  if (s < 60) return `il y a ${s}s`
  const m = Math.round(s / 60)
  return `il y a ${m}min`
}

// ── Main component ─────────────────────────────────────────────────────────

export function GreenPage() {
  const demoActive = useDemoState()
  const { data: green } = useGreen(demoActive)
  const store = useBinTaskStore()

  // Auto-generate tasks whenever green data updates
  useEffect(() => {
    if (green?.sites) {
      checkAndGenerateTasks(green.sites)
    }
  }, [green])

  // Apply monotonic fill to a site's zones for display
  function stabilizedSite(site: GreenSite): GreenSite {
    const zones = site.zones.map(z => {
      const binId = `${site.site_id}::${z.zone_name}`
      const fill = isResetBin(binId) ? 0 : getMonotonicFill(binId, z.fill_percentage)
      return {
        ...z,
        fill_percentage: fill,
        status: (fill >= 85 ? 'red' : fill >= 65 ? 'orange' : 'green') as typeof z.status,
      }
    })
    const maxFill = Math.max(...zones.map(z => z.fill_percentage), 0)
    return {
      ...site,
      zones,
      max_fill_percentage: maxFill,
      site_fill_status: (maxFill >= 85 ? 'red' : maxFill >= 65 ? 'orange' : 'green') as typeof site.site_fill_status,
    }
  }

  const sites = green?.sites.map(stabilizedSite) ?? []

  if (store.role === 'agent') {
    return <AgentView store={store} />
  }

  return <SupervisorView sites={sites} store={store} />
}

// ── Supervisor View ────────────────────────────────────────────────────────

function SupervisorView({
  sites,
  store,
}: {
  sites: GreenSite[]
  store: ReturnType<typeof useBinTaskStore>
}) {
  const urgentCount = sites.reduce(
    (acc, s) => acc + s.zones.filter(z => z.fill_percentage >= 85).length,
    0
  )

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto h-full pb-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Smart Green</h1>
          <p className="text-[13px] text-[#6B7280] mt-1">
            Gestion des déchets — vue superviseur
          </p>
        </div>
        {urgentCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 bg-[#FEF2F2] border border-[#EF4444]/30 rounded-[8px]">
            <AlertTriangle size={14} className="text-[#EF4444]" />
            <span className="text-[12px] font-semibold text-[#EF4444]">{urgentCount} poubelle{urgentCount > 1 ? 's' : ''} urgente{urgentCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1">

        {/* Left — bin status per site */}
        <div className="panel flex flex-col flex-[2] min-h-[500px] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2">
            <Leaf size={14} className="text-[#10B981]" />
            <h2 className="text-[13px] font-semibold text-[#111827]">État des poubelles par site</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {sites.length === 0 && (
              <div className="text-center text-[13px] text-[#9CA3AF] py-8">Chargement des données...</div>
            )}
            {sites.map(site => (
              <div key={site.site_id} className="border border-[#E5E7EB] rounded-[8px] overflow-hidden">
                {/* Site header */}
                <div className="flex items-center justify-between px-3 py-2 bg-[#F9FAFB] border-b border-[#E5E7EB]">
                  <span className="text-[13px] font-semibold text-[#111827]">{site.site_name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[#6B7280]">{site.city}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-[4px]"
                      style={{
                        color: fillColor(site.max_fill_percentage),
                        background: `${fillColor(site.max_fill_percentage)}15`,
                        border: `1px solid ${fillColor(site.max_fill_percentage)}30`,
                      }}
                    >
                      {site.max_fill_percentage}%
                    </span>
                  </div>
                </div>

                {/* Zone grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
                  {site.zones.map(zone => {
                    const binId = `${site.site_id}::${zone.zone_name}`
                    const isBeingCleaned = isResetBin(binId)
                    const c = fillColor(zone.fill_percentage)
                    const activeTask = store.tasks.find(
                      t => t.bin_id === binId && (t.status === 'assigned' || t.status === 'en_cours')
                    )
                    return (
                      <div
                        key={zone.zone_name}
                        className={`p-2 rounded-[6px] border ${isBeingCleaned ? 'bg-[#F0FDF4] border-[#10B981]/30' : 'bg-white border-[#E5E7EB]'}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-[#6B7280] truncate max-w-[80px]" title={zone.zone_name}>
                            {zone.zone_name}
                          </span>
                          {isBeingCleaned && <span className="text-[9px] text-[#10B981] font-bold">EN COURS</span>}
                          {activeTask && !isBeingCleaned && (
                            <span className="text-[9px] font-bold" style={{ color: activeTask.status === 'en_cours' ? '#10B981' : '#FF6600' }}>
                              {activeTask.status === 'en_cours' ? 'AGENT' : 'ASSIGNÉ'}
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden mb-1">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${zone.fill_percentage}%`, background: isBeingCleaned ? '#10B981' : c }}
                          />
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: isBeingCleaned ? '#10B981' : c }}>
                          {isBeingCleaned ? '0%' : `${zone.fill_percentage}%`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — task management */}
        <div className="flex flex-col flex-1 gap-4 min-h-[500px]">

          {/* Pending alerts — assign to agent */}
          <div className="panel flex flex-col flex-1 min-h-[200px]">
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-[#EF4444]" />
                <h2 className="text-[13px] font-semibold text-[#111827]">Alertes en attente</h2>
              </div>
              {store.pendingTasks.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#EF4444] text-white rounded-[4px]">
                  {store.pendingTasks.length}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {store.pendingTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-[12px] text-[#9CA3AF] py-6">
                  <CheckCircle2 size={22} className="mb-2 text-[#10B981]" />
                  <span>Aucune alerte active</span>
                </div>
              )}
              {store.pendingTasks.map(task => (
                <div
                  key={task.id}
                  className={`p-3 rounded-[8px] border ${fillBg(task.fill_pct)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Trash2 size={11} style={{ color: fillColor(task.fill_pct) }} />
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: fillColor(task.fill_pct) }}>
                          {task.fill_pct >= 85 ? 'Urgent' : 'Alerte'}
                        </span>
                      </div>
                      <div className="text-[12px] font-semibold text-[#111827] truncate">{task.zone_name}</div>
                      <div className="text-[11px] text-[#6B7280] mt-0.5 truncate">{task.site_name}</div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="h-1 w-16 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${task.fill_pct}%`, background: fillColor(task.fill_pct) }} />
                        </div>
                        <span className="text-[11px] font-bold" style={{ color: fillColor(task.fill_pct) }}>{task.fill_pct}%</span>
                      </div>
                    </div>
                    <button
                      onClick={() => store.assignTask(task.id)}
                      className="flex-none flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 bg-[#111827] text-white rounded-[6px] hover:bg-[#374151] transition-colors whitespace-nowrap"
                    >
                      <HardHat size={10} />
                      Assigner
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active tasks (assigned + en cours) */}
          <div className="panel flex flex-col flex-1 min-h-[200px]">
            <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#FF6600]" />
                <h2 className="text-[13px] font-semibold text-[#111827]">Tâches en cours</h2>
              </div>
              {(store.assignedTasks.length + store.activeTasks.length) > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FF6600] text-white rounded-[4px]">
                  {store.assignedTasks.length + store.activeTasks.length}
                </span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {store.assignedTasks.length + store.activeTasks.length === 0 && (
                <div className="text-center text-[12px] text-[#9CA3AF] py-4">Aucune tâche active</div>
              )}
              {[...store.assignedTasks, ...store.activeTasks].map(task => (
                <div key={task.id} className="flex items-center justify-between p-2.5 bg-[#F9FAFB] border border-[#E5E7EB] rounded-[6px]">
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-[#111827] truncate">{task.zone_name}</div>
                    <div className="text-[10px] text-[#6B7280] truncate">{task.site_name}</div>
                  </div>
                  <span
                    className="flex-none text-[9px] font-bold px-2 py-1 rounded-[4px] ml-2"
                    style={{
                      color: task.status === 'en_cours' ? '#10B981' : '#FF6600',
                      background: task.status === 'en_cours' ? '#10B98115' : '#FF660015',
                      border: `1px solid ${task.status === 'en_cours' ? '#10B98130' : '#FF660030'}`,
                    }}
                  >
                    {task.status === 'en_cours' ? 'EN COURS' : 'ASSIGNÉ'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent completions */}
          {store.completedTasks.length > 0 && (
            <div className="panel flex flex-col">
              <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2">
                <CheckCircle2 size={14} className="text-[#10B981]" />
                <h2 className="text-[13px] font-semibold text-[#111827]">Récemment terminé</h2>
              </div>
              <div className="p-3 flex flex-col gap-1.5">
                {store.completedTasks.slice(-3).reverse().map(task => (
                  <div key={task.id} className="flex items-center justify-between text-[12px] py-1 border-b border-[#F4F5F7] last:border-0">
                    <div className="flex items-center gap-2 text-[#374151] truncate">
                      <Sparkles size={11} className="text-[#10B981] flex-none" />
                      <span className="truncate">{task.zone_name} — {task.site_name}</span>
                    </div>
                    <span className="text-[10px] text-[#9CA3AF] flex-none ml-2 font-mono">
                      {task.completed_at ? timeAgo(task.completed_at) : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Agent View ─────────────────────────────────────────────────────────────

function AgentView({ store }: { store: ReturnType<typeof useBinTaskStore> }) {
  const myTasks = [...store.assignedTasks, ...store.activeTasks]

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto h-full pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-[#10B981] rounded-[6px] flex items-center justify-center text-white">
          <HardHat size={16} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Mes tâches — Agent Propreté</h1>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            {myTasks.length === 0
              ? 'Aucune tâche assignée pour le moment'
              : `${myTasks.length} tâche${myTasks.length > 1 ? 's' : ''} en attente`
            }
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 flex-1">

        {/* Assigned tasks */}
        <div className="panel flex flex-col flex-[2] min-h-[400px]">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2">
            <UserCheck size={14} className="text-[#10B981]" />
            <h2 className="text-[13px] font-semibold text-[#111827]">Tâches assignées</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
            {myTasks.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 gap-3">
                <div className="w-12 h-12 bg-[#10B981]/10 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={22} className="text-[#10B981]" />
                </div>
                <div>
                  <div className="text-[14px] font-semibold text-[#374151]">Tout est propre !</div>
                  <div className="text-[12px] text-[#9CA3AF] mt-1">Le superviseur vous assignera une tâche dès qu'une poubelle nécessite une intervention.</div>
                </div>
              </div>
            )}

            {myTasks.map(task => (
              <div
                key={task.id}
                className="border border-[#E5E7EB] rounded-[10px] overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Trash2 size={14} style={{ color: fillColor(task.fill_pct) }} />
                        <span className="text-[14px] font-semibold text-[#111827]">{task.zone_name}</span>
                      </div>
                      <div className="text-[12px] text-[#6B7280] mb-3">{task.site_name}</div>

                      {/* Fill indicator */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${task.fill_pct}%`, background: fillColor(task.fill_pct) }}
                          />
                        </div>
                        <span className="text-[13px] font-bold" style={{ color: fillColor(task.fill_pct) }}>
                          {task.fill_pct}%
                        </span>
                      </div>

                      {task.assigned_at && (
                        <div className="text-[10px] text-[#9CA3AF] font-mono">
                          Assignée {timeAgo(task.assigned_at)}
                        </div>
                      )}
                    </div>

                    {/* Status badge */}
                    <span
                      className="flex-none text-[10px] font-bold px-2 py-1 rounded-[4px]"
                      style={{
                        color: task.status === 'en_cours' ? '#10B981' : '#FF6600',
                        background: task.status === 'en_cours' ? '#10B98115' : '#FF660015',
                        border: `1px solid ${task.status === 'en_cours' ? '#10B98130' : '#FF660030'}`,
                      }}
                    >
                      {task.status === 'en_cours' ? 'EN COURS' : 'ASSIGNÉ'}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-2">
                    {task.status === 'assigned' && (
                      <button
                        onClick={() => store.acceptTask(task.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#FF6600] hover:bg-[#e55c00] text-white text-[12px] font-semibold rounded-[6px] transition-colors"
                      >
                        <UserCheck size={13} />
                        Accepter la tâche
                      </button>
                    )}
                    {task.status === 'en_cours' && (
                      <button
                        onClick={() => store.completeTask(task.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#10B981] hover:bg-[#059669] text-white text-[12px] font-semibold rounded-[6px] transition-colors"
                      >
                        <CheckCircle2 size={13} />
                        Marquer comme terminé
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Completed tasks history */}
        <div className="panel flex flex-col flex-1 min-h-[200px]">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2">
            <CheckCircle2 size={14} className="text-[#10B981]" />
            <h2 className="text-[13px] font-semibold text-[#111827]">Historique</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {store.completedTasks.length === 0 && (
              <div className="text-center text-[12px] text-[#9CA3AF] py-6">Aucune tâche complétée</div>
            )}
            {store.completedTasks.slice().reverse().map(task => (
              <div key={task.id} className="flex items-start gap-3 p-2.5 bg-[#F0FDF4] border border-[#10B981]/20 rounded-[6px]">
                <CheckCircle2 size={14} className="text-[#10B981] flex-none mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-[#111827] truncate">{task.zone_name}</div>
                  <div className="text-[11px] text-[#6B7280] truncate">{task.site_name}</div>
                  {task.completed_at && (
                    <div className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">{timeAgo(task.completed_at)}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
