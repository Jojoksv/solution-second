import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ShieldAlert, Users, Clock, CheckCircle2 } from 'lucide-react'
import { useAlerts, useAcknowledgeAlert } from '@/hooks'
import { useDemoState } from '@/stores/demoStore'
import type { Alert } from '@/types'
import { AlertsPanel } from '@/components/alerts/AlertsPanel'

export const Route = createFileRoute('/alerts')({
  component: AlertsPage,
})

// ─── Acknowledgement Timer ───────────────────────────────────────────────
// Compte le temps écoulé depuis created_at — devient rouge après 5 min.

function AckTimer({ createdAt, acknowledged }: { createdAt: string; acknowledged: boolean }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (acknowledged) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [acknowledged])

  if (acknowledged) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#10B981]">
        <CheckCircle2 size={11} />
        Acquitté
      </span>
    )
  }

  const elapsed = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000))
  const min = Math.floor(elapsed / 60)
  const sec = elapsed % 60
  const isLate = elapsed > 300
  const formatted = min > 0 ? `${min}m ${sec.toString().padStart(2, '0')}s` : `${sec}s`

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
        isLate
          ? 'text-[#E5484D] bg-[#E5484D]/10 border-[#E5484D]/30 status-pulse-red'
          : 'text-[#F5A623] bg-[#F5A623]/10 border-[#F5A623]/30'
      }`}
    >
      <Clock size={10} />
      {formatted}
    </span>
  )
}

// ─── Alert Card ──────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: Alert }) {
  const { mutate: acknowledge, isPending } = useAcknowledgeAlert()
  const color = alert.alert_level === 'red' ? '#E5484D' : '#F5A623'

  return (
    <div
      className={`panel p-4 flex flex-col gap-3 border ${alert.alert_level === 'red' ? 'border-[#E5484D]/30' : 'border-[#F5A623]/30'} ${alert.acknowledged ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{ color, background: `${color}15`, borderColor: `${color}40` }}
            >
              {alert.alert_level}
            </span>
            <AckTimer createdAt={alert.created_at} acknowledged={alert.acknowledged} />
          </div>
          <div className="text-[14px] font-semibold text-[#EDEDED] truncate">{alert.site_name}</div>
          <div className="text-[11px] text-[#888888] mt-0.5">
            {alert.city} · {alert.occupancy_percentage}% · {alert.estimated_real_crowd.toLocaleString('fr-FR')} pers.
          </div>
        </div>
      </div>

      <div className="text-[12px] text-[#EDEDED] leading-snug bg-[#141414] border border-[#2A2A2A] rounded p-2.5">
        {alert.site_recommendation}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-[#888888]">
          <Users size={11} />
          <span>Bénévole : <span className="text-[#EDEDED] font-medium">{alert.assigned_volunteer}</span></span>
        </div>
        {!alert.acknowledged && (
          <button
            disabled={isPending}
            onClick={() => acknowledge(alert.id)}
            className="text-[11px] font-semibold uppercase tracking-wide bg-[#10B981]/15 hover:bg-[#10B981]/25 text-[#10B981] border border-[#10B981]/30 rounded px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Acquittement…' : 'Acquitter'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────

export function AlertsPage() {
  const demoActive = useDemoState()
  const { data: alerts } = useAlerts(demoActive)
  const active = alerts?.active_alerts ?? []

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto h-full pb-6">
      <div>
        <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">Alertes & Incidents</h1>
        <p className="text-[13px] text-[#888888] mt-1">
          Gérer les seuils, les incidents actifs et coordonner la réponse des bénévoles.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1">
        <div className="panel flex flex-col flex-[2] min-h-[500px]">
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-[#EDEDED]" />
              <h2 className="text-[13px] font-semibold text-[#EDEDED]">Missions actives & file d'attente</h2>
            </div>
            <span className="text-[10px] text-[#888888] font-mono">{active.length} alerte{active.length > 1 ? 's' : ''}</span>
          </div>

          <div className="p-4 flex flex-col flex-1 overflow-hidden">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-[4px] p-3">
                <div className="text-[11px] font-medium text-[#888888] uppercase tracking-wide">Temps réponse moyen</div>
                <div className="text-lg font-semibold text-[#10B981] mt-1">2 min 14 s</div>
              </div>
              <div className="bg-[#141414] border border-[#2A2A2A] rounded-[4px] p-3">
                <div className="text-[11px] font-medium text-[#888888] uppercase tracking-wide">Taux d'acquittement</div>
                <div className="text-lg font-semibold text-[#EDEDED] mt-1">92 %</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
              {active.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 size={36} className="text-[#10B981] mb-3" />
                  <div className="text-[13px] font-semibold text-[#EDEDED]">Aucune alerte active</div>
                  <div className="text-[11px] text-[#888888] mt-1">Surveillance continue sur tous les sites.</div>
                </div>
              ) : (
                active.map(alert => <AlertCard key={alert.id} alert={alert} />)
              )}
            </div>

            {/* Embedded raw panel for additional context */}
            <details className="mt-4 group">
              <summary className="text-[11px] text-[#888888] cursor-pointer hover:text-[#EDEDED] transition-colors uppercase tracking-wider font-semibold">
                Vue détaillée brute
              </summary>
              <div className="mt-3"><AlertsPanel /></div>
            </details>
          </div>
        </div>

        {/* Volunteers side panel */}
        <div className="panel flex flex-col flex-1 min-h-[500px]">
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center gap-2">
            <Users size={14} className="text-[#EDEDED]" />
            <h2 className="text-[13px] font-semibold text-[#EDEDED]">Bénévoles déployés</h2>
          </div>
          <div className="p-4">
            <ul className="flex flex-col gap-2">
              {[
                { name: 'Agent 42', site: 'Stade A. Wade', status: 'on_mission' },
                { name: 'Agent 18', site: 'Corniche Ouest', status: 'available' },
                { name: 'Agent 07', site: 'Plage Saly Ouest', status: 'available' },
                { name: 'Agent 31', site: 'Stade Iba Mar Diop', status: 'on_mission' },
              ].map(v => {
                const isMission = v.status === 'on_mission'
                return (
                  <li
                    key={v.name}
                    className="flex justify-between items-center p-3 rounded-[4px] bg-[#141414] border border-[#2A2A2A]"
                  >
                    <div className="flex flex-col">
                      <strong className="text-[13px] text-[#EDEDED] font-medium">{v.name}</strong>
                      <span className="text-[11px] text-[#888888]">{v.site}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        isMission
                          ? 'bg-[#E5484D]/10 text-[#E5484D] border-[#E5484D]/20'
                          : 'bg-[#10B981]/10 text-[#10B981] border-[#10B981]/20'
                      }`}
                    >
                      {isMission ? 'EN MISSION' : 'DISPO'}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
