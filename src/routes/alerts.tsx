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

// ─── Acknowledgement Timer ────────────────────────────────────────────────

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
          ? 'text-[#EF4444] bg-[#EF4444]/8 border-[#EF4444]/25 status-pulse-red'
          : 'text-[#FF6600] bg-[#FF6600]/8 border-[#FF6600]/25'
      }`}
    >
      <Clock size={10} />
      {formatted}
    </span>
  )
}

// ─── Alert Card ───────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: Alert }) {
  const { mutate: acknowledge, isPending } = useAcknowledgeAlert()
  const color = alert.alert_level === 'red' ? '#EF4444' : '#FF6600'

  return (
    <div
      className={`panel p-4 flex flex-col gap-3 border ${alert.alert_level === 'red' ? 'border-[#EF4444]/30' : 'border-[#FF6600]/30'} ${alert.acknowledged ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border"
              style={{ color, background: `${color}12`, borderColor: `${color}35` }}
            >
              {alert.alert_level}
            </span>
            <AckTimer createdAt={alert.created_at} acknowledged={alert.acknowledged} />
          </div>
          <div className="text-[14px] font-semibold text-[#111827] truncate">{alert.site_name}</div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            {alert.city} · {alert.occupancy_percentage}% · {alert.estimated_real_crowd.toLocaleString('fr-FR')} pers.
          </div>
        </div>
      </div>

      <div className="text-[12px] text-[#374151] leading-snug bg-[#F9FAFB] border border-[#E5E7EB] rounded-[6px] p-2.5">
        {alert.site_recommendation}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] text-[#6B7280]">
          <Users size={11} />
          <span>Bénévole : <span className="text-[#111827] font-medium">{alert.assigned_volunteer}</span></span>
        </div>
        {!alert.acknowledged && (
          <button
            disabled={isPending}
            onClick={() => acknowledge(alert.id)}
            className="text-[11px] font-semibold uppercase tracking-wide bg-[#10B981]/10 hover:bg-[#10B981]/18 text-[#10B981] border border-[#10B981]/25 rounded-[6px] px-3 py-1.5 transition-colors disabled:opacity-50"
          >
            {isPending ? 'Acquittement…' : 'Acquitter'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export function AlertsPage() {
  const demoActive = useDemoState()
  const { data: alerts } = useAlerts(demoActive)
  const active = alerts?.active_alerts ?? []

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto h-full pb-6">
      <div>
        <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Alertes & Incidents</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">
          Gérer les seuils, les incidents actifs et coordonner la réponse des bénévoles.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1">
        {/* Main panel */}
        <div className="panel flex flex-col flex-[2] min-h-[500px]">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={14} className="text-[#374151]" />
              <h2 className="text-[13px] font-semibold text-[#111827]">Missions actives & file d'attente</h2>
            </div>
            <span className="text-[10px] text-[#9CA3AF] font-mono">{active.length} alerte{active.length > 1 ? 's' : ''}</span>
          </div>

          <div className="p-4 flex flex-col flex-1 overflow-hidden">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[6px] p-3">
                <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">Temps réponse moyen</div>
                <div className="text-lg font-semibold text-[#10B981] mt-1">2 min 14 s</div>
              </div>
              <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-[6px] p-3">
                <div className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide">Taux d'acquittement</div>
                <div className="text-lg font-semibold text-[#111827] mt-1">92 %</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
              {active.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 size={36} className="text-[#10B981] mb-3" />
                  <div className="text-[13px] font-semibold text-[#111827]">Aucune alerte active</div>
                  <div className="text-[11px] text-[#6B7280] mt-1">Surveillance continue sur tous les sites.</div>
                </div>
              ) : (
                active.map(alert => <AlertCard key={alert.id} alert={alert} />)
              )}
            </div>

            <details className="mt-4 group">
              <summary className="text-[11px] text-[#9CA3AF] cursor-pointer hover:text-[#374151] transition-colors uppercase tracking-wider font-semibold">
                Vue détaillée brute
              </summary>
              <div className="mt-3"><AlertsPanel /></div>
            </details>
          </div>
        </div>

        {/* Volunteers side panel */}
        <div className="panel flex flex-col flex-1 min-h-[500px]">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2">
            <Users size={14} className="text-[#374151]" />
            <h2 className="text-[13px] font-semibold text-[#111827]">Bénévoles déployés</h2>
          </div>
          <div className="p-4">
            <ul className="flex flex-col gap-2">
              {[
                { name: 'Awa Ndiaye', site: 'Stade A. Wade', status: 'on_mission' },
                { name: 'Moussa Diop', site: 'Corniche Ouest', status: 'available' },
                { name: 'Fatou Sarr', site: 'Plage Saly Ouest', status: 'available' },
                { name: 'Cheikh Ba', site: 'Stade Iba Mar Diop', status: 'on_mission' },
                { name: 'Mame Fall', site: 'Dakar Arena', status: 'available' },
              ].map(v => {
                const isMission = v.status === 'on_mission'
                return (
                  <li
                    key={v.name}
                    className="flex justify-between items-center p-3 rounded-[6px] bg-[#F9FAFB] border border-[#E5E7EB]"
                  >
                    <div className="flex flex-col">
                      <strong className="text-[13px] text-[#111827] font-medium">{v.name}</strong>
                      <span className="text-[11px] text-[#6B7280]">{v.site}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        isMission
                          ? 'bg-[#EF4444]/8 text-[#EF4444] border-[#EF4444]/20'
                          : 'bg-[#10B981]/8 text-[#10B981] border-[#10B981]/20'
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
