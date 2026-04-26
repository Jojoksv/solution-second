// ─── Map Command Center ───────────────────────────────────────────────────
// Full-screen fixed overlay: slim left toggles | map | compact alert panel.
// Layout rule: map always takes 75–85 % of the screen.

import { useState, useMemo, useEffect, useCallback } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  Bell,
  Users,
  Trash2,
  Activity,
  AlertTriangle,
  CheckCircle2,
  HardHat,
  UserCheck,
  Sun,
  Moon,
  Layers,
  Eye,
  EyeOff,
  X,
  TriangleAlert,
  Navigation,
} from 'lucide-react'
import { MapPanel } from '@/components/map/Mappanel'
import type { MapLayers } from '@/components/map/Mappanel'
import { useAlerts, useDensity } from '@/hooks'
import { useBinTaskStore } from '@/stores/binTaskStore'
import { useTheme } from '@/stores/themeStore'
import { useBinSimulation, assignBinAgent, markBinCleaned } from '@/stores/binSimulationStore'
import type { SimBin, SimBinAlert } from '@/stores/binSimulationStore'

export const Route = createFileRoute('/map')({
  component: MapCommandCenter,
})

// ─── Bin Detail Floating Panel ────────────────────────────────────────────

function BinDetailPanel({
  bin,
  onClose,
  onAssign,
  role,
}: {
  bin: SimBin
  onClose: () => void
  onAssign: (binId: string) => void
  role: string
}) {
  const color =
    bin.status === 'red'    ? 'var(--accent-red)' :
    bin.status === 'orange' ? 'var(--accent-orange)' : 'var(--accent-green)'

  const maxHistory = Math.max(...bin.history, 1)

  return (
    <div
      className="absolute bottom-16 left-4 z-[600] w-[218px] rounded-xl shadow-2xl fade-slide-in"
      style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${color}35`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${color}20`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Trash2 size={12} style={{ color }} />
          <span className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>{bin.id}</span>
        </div>
        <button onClick={onClose} className="hover:opacity-60 transition-opacity" style={{ color: 'var(--text-muted)' }}>
          <X size={13} />
        </button>
      </div>

      {/* Fill level */}
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-end justify-between mb-1.5">
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Remplissage
          </span>
          <span className="text-[24px] font-black leading-none" style={{ color }}>
            {bin.fillPct}<span className="text-[14px]">%</span>
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-panel-hover)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${bin.fillPct}%`, background: color, boxShadow: bin.status === 'red' ? `0 0 6px ${color}` : 'none' }}
          />
        </div>

        {/* History mini chart */}
        <div className="mt-2.5 mb-1">
          <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Historique
          </span>
          <div className="flex items-end gap-0.5 mt-1 h-8">
            {bin.history.map((v, i) => {
              const h = Math.max(2, Math.round((v / Math.max(maxHistory, 1)) * 32))
              const c = toStatusColor(v)
              return (
                <div
                  key={i}
                  className="flex-1 rounded-sm transition-all duration-500"
                  style={{ height: `${h}px`, background: c, opacity: 0.6 + (i / bin.history.length) * 0.4 }}
                />
              )
            })}
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div>
            <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{bin.site_name}</div>
            <div className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>{bin.zone_name}</div>
          </div>
          {bin.warningCount > 0 && (
            <div
              className="flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)' }}
            >
              <TriangleAlert size={9} style={{ color: 'var(--accent-red)' }} />
              <span className="text-[9px] font-bold" style={{ color: 'var(--accent-red)' }}>{bin.warningCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      {!bin.resetting && bin.status !== 'green' && (
        <div className="px-3 pb-3">
          {role === 'superviseur' ? (
            <button
              onClick={() => onAssign(bin.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all hover:opacity-90"
              style={{ background: 'var(--accent-violet)', color: '#fff' }}
            >
              <HardHat size={11} />
              Assigner un agent
            </button>
          ) : (
            <button
              onClick={() => markBinCleaned(bin.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-all hover:opacity-90"
              style={{ background: 'var(--accent-green)', color: '#fff' }}
            >
              <CheckCircle2 size={11} />
              Marquer nettoyé
            </button>
          )}
        </div>
      )}

      {bin.resetting && (
        <div className="px-3 pb-3">
          <div
            className="flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold"
            style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <Navigation size={10} />
            Agent en route…
          </div>
        </div>
      )}
    </div>
  )
}

function toStatusColor(pct: number) {
  if (pct >= 80) return '#EF4444'
  if (pct >= 50) return '#F97316'
  return '#10B981'
}

// ─── Alert Card (compact) ──────────────────────────────────────────────────

function AlertCard({
  alert,
  onAssign,
  role,
}: {
  alert: SimBinAlert
  onAssign: (binId: string) => void
  role: string
}) {
  const isRed = alert.severity === 'red'
  const color = isRed ? 'var(--accent-red)' : 'var(--accent-orange)'
  const border = isRed ? 'rgba(239,68,68,0.28)' : 'rgba(249,115,22,0.22)'
  const bg = isRed ? 'rgba(239,68,68,0.07)' : 'rgba(249,115,22,0.06)'
  const isAssigned = !!alert.assignedAt

  const elapsed = useMemo(() => {
    const s = Math.round((Date.now() - alert.createdAt) / 1000)
    if (s < 60) return `${s}s`
    return `${Math.round(s / 60)}min`
  }, [alert.createdAt])

  return (
    <div
      className={`rounded-lg p-2.5 fade-slide-in ${isRed && !isAssigned ? 'bin-alert-card' : ''}`}
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <div className="flex items-start gap-2">
        <Trash2 size={11} style={{ color, marginTop: 1, flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color }}>
              {isRed ? '🔴 CRITIQUE' : '🟠 ALERTE'} · {alert.fillPct}%
            </span>
            <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>{elapsed}</span>
          </div>
          <div className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {alert.zone_name}
          </div>
          <div className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
            {alert.site_name}
          </div>
          <div className="mt-1.5 h-0.5 w-full rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)' }}>
            <div className="h-full rounded-full" style={{ width: `${alert.fillPct}%`, background: color }} />
          </div>
        </div>
      </div>

      {!isAssigned && (
        <div className="mt-2">
          {role === 'superviseur' ? (
            <button
              onClick={() => onAssign(alert.bin_id)}
              className="w-full flex items-center justify-center gap-1 text-[9px] font-bold py-1.5 rounded-md transition-all hover:opacity-80"
              style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}
            >
              <HardHat size={9} />
              Assigner agent
            </button>
          ) : (
            <button
              onClick={() => markBinCleaned(alert.bin_id)}
              className="w-full flex items-center justify-center gap-1 text-[9px] font-bold py-1.5 rounded-md transition-all hover:opacity-80"
              style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.3)' }}
            >
              <CheckCircle2 size={9} />
              Nettoyé
            </button>
          )}
        </div>
      )}

      {isAssigned && (
        <div
          className="mt-2 flex items-center gap-1 text-[9px] font-bold py-1 px-2 rounded-md"
          style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--accent-green)' }}
        >
          <Navigation size={9} />
          Agent en route…
        </div>
      )}
    </div>
  )
}

// ─── Crowd Alert Card ──────────────────────────────────────────────────────

function CrowdAlertCard({ alert }: { alert: { site_name: string; occupancy_percentage: number; city: string; alert_level: string; created_at: string } }) {
  const isRed = alert.alert_level === 'red'
  const color = isRed ? 'var(--accent-red)' : 'var(--accent-orange)'

  return (
    <div
      className={`rounded-lg p-2.5 fade-slide-in ${isRed ? 'bin-alert-card' : ''}`}
      style={{ background: isRed ? 'rgba(239,68,68,0.07)' : 'rgba(249,115,22,0.06)', border: `1px solid ${isRed ? 'rgba(239,68,68,0.28)' : 'rgba(249,115,22,0.22)'}` }}
    >
      <div className="flex items-start gap-2">
        <Users size={11} style={{ color, marginTop: 1, flexShrink: 0 }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color }}>
              {isRed ? '🔴 FOULE CRITIQUE' : '🟠 FOULE ÉLEVÉE'} · {alert.occupancy_percentage}%
            </span>
          </div>
          <div className="text-[11px] font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {alert.site_name}
          </div>
          <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{alert.city}</div>
        </div>
      </div>
    </div>
  )
}

// ─── Right Alert Panel ────────────────────────────────────────────────────

function RightAlertPanel({
  binAlerts,
  role,
  onAssign,
}: {
  binAlerts: SimBinAlert[]
  role: string
  onAssign: (binId: string) => void
}) {
  const { data: apiAlerts } = useAlerts()
  const crowdAlerts = apiAlerts?.active_alerts ?? []
  const totalCount = binAlerts.length + crowdAlerts.length

  return (
    <div
      className="w-[256px] flex-none flex flex-col border-l cc-panel"
      style={{ borderColor: 'var(--border-subtle)' }}
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
        <div className="flex items-center gap-2">
          <Bell size={12} style={{ color: totalCount > 0 ? 'var(--accent-red)' : 'var(--text-muted)' }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-primary)' }}>
            Alertes
          </span>
        </div>
        {totalCount > 0 ? (
          <span
            className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
            style={{ background: 'var(--accent-red)', color: '#fff' }}
          >
            {totalCount}
          </span>
        ) : (
          <span className="text-[8px] font-mono" style={{ color: 'var(--text-muted)' }}>0</span>
        )}
      </div>

      {/* Alert list */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
        {totalCount === 0 ? (
          <div className="flex flex-col items-center py-6 gap-2 opacity-60">
            <CheckCircle2 size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>No active alerts</span>
          </div>
        ) : (
          <>
            {/* Crowd alerts first */}
            {crowdAlerts.map(a => (
              <CrowdAlertCard key={a.id} alert={a} />
            ))}
            {/* Bin alerts */}
            {binAlerts.map(a => (
              <AlertCard key={a.id} alert={a} onAssign={onAssign} role={role} />
            ))}
          </>
        )}
      </div>

      {/* Footer summary */}
      {totalCount > 0 && (
        <div className="px-3 py-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
            {binAlerts.filter(a => a.severity === 'red').length + crowdAlerts.filter(a => a.alert_level === 'red').length} critique{' '}·{' '}
            {binAlerts.filter(a => a.severity === 'orange').length + crowdAlerts.filter(a => a.alert_level === 'orange').length} modérée
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Left Layer Panel (slim, icon-only) ───────────────────────────────────

const LAYERS_DEF = [
  { key: 'crowd' as const,   icon: Users,    label: 'Densité foule',  color: 'var(--accent-blue)' },
  { key: 'bins'  as const,   icon: Trash2,   label: 'Poubelles',      color: 'var(--accent-green)' },
  { key: 'heatmap' as const, icon: Activity, label: 'Heatmap',        color: 'var(--accent-orange)' },
]

function LeftLayerPanel({
  layers,
  onToggle,
}: {
  layers: MapLayers
  onToggle: (key: keyof MapLayers) => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      className="flex-none flex flex-col border-r cc-panel transition-all duration-300"
      style={{
        width: expanded ? '152px' : '48px',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="h-10 flex items-center justify-center border-b transition-all hover:opacity-70"
        style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}
        title={expanded ? 'Réduire' : 'Couches carte'}
      >
        <Layers size={14} />
      </button>

      {/* Layer toggles */}
      <div className="flex flex-col gap-1 p-1.5 flex-1">
        {LAYERS_DEF.map(({ key, label, color }) => {
          const active = layers[key] !== false
          return (
            <button
              key={key}
              onClick={() => onToggle(key)}
              className="flex items-center gap-2 px-1.5 py-2 rounded-lg transition-all"
              style={{
                background: active ? `${color}15` : 'transparent',
                border: `1px solid ${active ? color + '35' : 'transparent'}`,
                justifyContent: expanded ? 'flex-start' : 'center',
              }}
              title={label}
            >
              {active
                ? <Eye size={13} style={{ color, flexShrink: 0 }} />
                : <EyeOff size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              }
              {expanded && (
                <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: active ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {label}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Agent Task Card (floating overlay on map) ────────────────────────────

function AgentTaskCard({ bins }: { bins: SimBin[] }) {
  // Find bin with an active alert (assigned to agent)
  const { alerts } = useBinSimulation()
  const myAlert = alerts.find(a => a.assignedAt)
  const myBin = myAlert ? bins.find(b => b.id === myAlert.bin_id) : null

  if (!myAlert && alerts.length === 0) {
    return (
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[600] rounded-xl px-4 py-3 flex items-center gap-3"
        style={{ background: 'var(--bg-glass)', backdropFilter: 'blur(24px)', border: '1px solid var(--border-subtle)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
      >
        <CheckCircle2 size={16} style={{ color: 'var(--accent-green)' }} />
        <div>
          <div className="text-[12px] font-bold" style={{ color: 'var(--text-primary)' }}>Aucune tâche assignée</div>
          <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>En attente d'instructions du superviseur</div>
        </div>
      </div>
    )
  }

  // Unassigned alerts the agent can pick up
  const unassigned = alerts.filter(a => !a.assignedAt)
  const target = myAlert ?? unassigned[0]
  const targetBin = myBin ?? (target ? bins.find(b => b.id === target.bin_id) : null)

  if (!target || !targetBin) return null

  const color = target.severity === 'red' ? 'var(--accent-red)' : 'var(--accent-orange)'
  const isAssigned = !!target.assignedAt

  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[600] rounded-xl shadow-2xl fade-slide-in"
      style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(24px)',
        border: `1px solid ${color}35`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${color}15`,
        minWidth: '320px',
        maxWidth: '400px',
      }}
    >
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 size={14} style={{ color }} />
          <span className="text-[12px] font-black uppercase tracking-wider" style={{ color }}>
            {target.severity === 'red' ? 'Urgence — poubelle pleine' : 'Tâche assignée'}
          </span>
        </div>
        <div className="text-[15px] font-bold" style={{ color: 'var(--text-primary)' }}>
          {target.zone_name}
        </div>
        <div className="text-[11px] mb-3" style={{ color: 'var(--text-secondary)' }}>
          {target.site_name} · {targetBin.fillPct}% de remplissage
        </div>

        {/* Fill bar */}
        <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: 'var(--bg-panel-hover)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${targetBin.fillPct}%`, background: color }}
          />
        </div>

        <div className="flex gap-2">
          {!isAssigned && (
            <button
              onClick={() => assignBinAgent(target.bin_id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-bold transition-all hover:opacity-90"
              style={{ background: 'var(--accent-orange)', color: '#fff' }}
            >
              <Navigation size={13} />
              Prendre en charge
            </button>
          )}
          {isAssigned && !targetBin.resetting && (
            <button
              onClick={() => markBinCleaned(target.bin_id)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-bold transition-all hover:opacity-90"
              style={{ background: 'var(--accent-green)', color: '#fff' }}
            >
              <CheckCircle2 size={13} />
              Marquer comme nettoyé
            </button>
          )}
          {targetBin.resetting && (
            <div
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-[12px] font-semibold"
              style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.25)' }}
            >
              <Navigation size={13} />
              En route vers la zone…
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Command Topbar ───────────────────────────────────────────────────────

function CommandTopbar({
  role,
  onRoleChange,
}: {
  role: string
  onRoleChange: (r: 'superviseur' | 'agent') => void
}) {
  const { theme, toggleTheme } = useTheme()
  const { data: density } = useDensity()
  const { alerts: binAlerts } = useBinSimulation()
  const { data: apiAlerts } = useAlerts()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const totalAlerts = binAlerts.length + (apiAlerts?.active_alerts.length ?? 0)
  const hasCritical = binAlerts.some(a => a.severity === 'red') || (apiAlerts?.active_alerts.some(a => a.alert_level === 'red') ?? false)
  const totalPeople = density?.global_metrics.total_estimated_people ?? 0

  return (
    <header
      className="h-11 flex-none flex items-center justify-between px-3 border-b cc-panel gap-3"
      style={{ borderColor: 'var(--border-subtle)', borderRadius: 0 }}
    >
      {/* Left: back + brand */}
      <div className="flex items-center gap-2 flex-none">
        <Link
          to="/"
          className="flex items-center gap-1 px-2 py-1 rounded-md transition-all hover:opacity-70"
          style={{ color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
        >
          <ArrowLeft size={11} />
          <span className="text-[10px] font-medium hidden lg:block">Dashboard</span>
        </Link>
        <div className="vdivider h-5" />
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 rounded text-[8px] font-black flex items-center justify-center"
            style={{ background: 'var(--accent-violet)', color: '#fff' }}
          >
            JOJ
          </div>
          <span className="text-[12px] font-bold hidden lg:block" style={{ color: 'var(--text-primary)' }}>CrowdFlow</span>
          <div
            className="flex items-center gap-1 text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent-green)', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <div className="w-1 h-1 rounded-full status-pulse-green" style={{ background: 'var(--accent-green)' }} />
            live
          </div>
        </div>
      </div>

      {/* Center: Mode toggle + status */}
      <div className="flex items-center gap-3 flex-1 justify-center">
        {/* Role toggle — centered and prominent */}
        <div
          className="flex rounded-lg overflow-hidden border"
          style={{ borderColor: 'var(--border-subtle)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
        >
          <button
            onClick={() => onRoleChange('superviseur')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
            style={{
              background: role === 'superviseur' ? 'var(--accent-orange)' : 'var(--bg-panel-hover)',
              color: role === 'superviseur' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            <UserCheck size={10} />
            Superviseur
          </button>
          <div className="w-px" style={{ background: 'var(--border-subtle)' }} />
          <button
            onClick={() => onRoleChange('agent')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all"
            style={{
              background: role === 'agent' ? 'var(--accent-green)' : 'var(--bg-panel-hover)',
              color: role === 'agent' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            <HardHat size={10} />
            Agent
          </button>
        </div>

        {/* Status pills */}
        <div className="hidden md:flex items-center gap-1.5">
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-md"
            style={{ background: 'var(--bg-panel-hover)', border: '1px solid var(--border-subtle)' }}
          >
            <Users size={10} style={{ color: 'var(--accent-blue)' }} />
            <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text-primary)' }}>
              {totalPeople > 0 ? `${(totalPeople / 1000).toFixed(0)}k` : '—'}
            </span>
          </div>

          {totalAlerts > 0 ? (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md ${hasCritical ? 'status-pulse-red' : 'status-pulse-orange'}`}
              style={{ background: hasCritical ? 'rgba(239,68,68,0.12)' : 'rgba(249,115,22,0.12)', border: `1px solid ${hasCritical ? 'rgba(239,68,68,0.35)' : 'rgba(249,115,22,0.3)'}` }}
            >
              <AlertTriangle size={10} style={{ color: hasCritical ? 'var(--accent-red)' : 'var(--accent-orange)' }} />
              <span className="text-[10px] font-bold" style={{ color: hasCritical ? 'var(--accent-red)' : 'var(--accent-orange)' }}>
                {totalAlerts} alerte{totalAlerts > 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <CheckCircle2 size={10} style={{ color: 'var(--accent-green)' }} />
              <span className="text-[10px] font-semibold" style={{ color: 'var(--accent-green)' }}>OK</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: theme + clock */}
      <div className="flex items-center gap-2 flex-none">
        <div
          className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md font-mono text-[10px]"
          style={{ background: 'var(--bg-panel-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}
        >
          {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
        <button
          onClick={toggleTheme}
          className="w-7 h-7 flex items-center justify-center rounded-md transition-all hover:opacity-70"
          style={{ background: 'var(--bg-panel-hover)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
          title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        >
          {theme === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
        </button>
      </div>
    </header>
  )
}

// ─── Main Command Center ──────────────────────────────────────────────────

function MapCommandCenter() {
  const { theme } = useTheme()
  const store = useBinTaskStore()
  const { bins, alerts: binAlerts } = useBinSimulation()

  const [layers, setLayers] = useState<MapLayers>({ bins: true, crowd: true, heatmap: true })
  const [role, setRole] = useState<'superviseur' | 'agent'>(store.role)
  const [selectedBin, setSelectedBin] = useState<SimBin | null>(null)

  // Keep binTaskStore in sync with local role
  useEffect(() => {
    store.setRole(role)
  }, [role])

  function handleToggleLayer(key: keyof MapLayers) {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleBinClick = useCallback((bin: SimBin) => {
    setSelectedBin(prev => (prev?.id === bin.id ? null : bin))
  }, [])

  const handleAssign = useCallback((binId: string) => {
    assignBinAgent(binId)
    setSelectedBin(null)
  }, [])

  // Keep selected bin data fresh
  const freshSelectedBin = selectedBin
    ? bins.find(b => b.id === selectedBin.id) ?? null
    : null

  // Agent mode: strip panels, show full-screen map + task overlay
  if (role === 'agent') {
    return (
      <div
        className="fixed inset-0 z-[200] flex flex-col"
        data-theme={theme}
        style={{ background: 'var(--bg-base)', fontFamily: "'Inter', sans-serif" }}
      >
        <CommandTopbar role={role} onRoleChange={setRole} />
        <div className="flex-1 relative min-h-0 overflow-hidden">
          <MapPanel layers={layers} bins={bins} onBinClick={handleBinClick} />
          <AgentTaskCard bins={bins} />
          {freshSelectedBin && (
            <BinDetailPanel
              bin={freshSelectedBin}
              onClose={() => setSelectedBin(null)}
              onAssign={handleAssign}
              role={role}
            />
          )}
        </div>
      </div>
    )
  }

  // Supervisor mode: slim left | map | alert panel
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col"
      data-theme={theme}
      style={{ background: 'var(--bg-base)', fontFamily: "'Inter', sans-serif" }}
    >
      <CommandTopbar role={role} onRoleChange={setRole} />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <LeftLayerPanel layers={layers} onToggle={handleToggleLayer} />

        {/* Map container — position relative so floating panels anchor to it */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          <MapPanel layers={layers} bins={bins} onBinClick={handleBinClick} />

          {/* Floating bin detail panel */}
          {freshSelectedBin && (
            <BinDetailPanel
              bin={freshSelectedBin}
              onClose={() => setSelectedBin(null)}
              onAssign={handleAssign}
              role={role}
            />
          )}
        </div>

        <RightAlertPanel binAlerts={binAlerts} role={role} onAssign={handleAssign} />
      </div>
    </div>
  )
}
