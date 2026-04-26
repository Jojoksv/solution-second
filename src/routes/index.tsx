import { useMemo, useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Radio,
  Activity,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchDensity, fetchRiskIndex } from '@/api'
import { useAlerts } from '@/hooks'
import { DensityChart } from '@/components/chart/DensityChart'
import { fmt, cityColor } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: DashboardOverview,
})

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: string
  isAlert?: boolean
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  isAlert = false,
}: StatCardProps) {
  const alertColor = 'var(--accent-red)'
  const normalColor = 'var(--text-secondary)'
  const trendColor = trend?.startsWith('+') ? 'var(--accent-green)' : trend?.startsWith('-') ? 'var(--accent-red)' : 'var(--text-secondary)'

  return (
    <div className="panel p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color: isAlert ? alertColor : normalColor }} />
        <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {title}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-[26px] font-bold tracking-tight leading-none" style={{ color: isAlert ? alertColor : 'var(--text-primary)' }}>
          {value}
        </span>
        {trend && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded"
            style={{ background: 'var(--bg-panel-hover)', border: '1px solid var(--border-subtle)' }}
          >
            <span className="text-[11px] font-semibold" style={{ color: trendColor }}>{trend}</span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── IRG Gauge ────────────────────────────────────────────────────────────

function IrgGauge() {
  const { data: riskIndex } = useQuery({
    queryKey: ['risk-index'],
    queryFn: fetchRiskIndex,
    refetchInterval: 3000,
  })

  // OPTIMISATION: Memoize computed values to avoid recalculation on every render
  const score = riskIndex?.score ?? 0
  const level = riskIndex?.level ?? 'nominal'
  const trend = riskIndex?.trend ?? 'stable'

  // Arc: 0–100% maps to a 270° gauge starting from -135°
  const angle = useMemo(() => (score / 100) * 270 - 135, [score])
  const color = useMemo(
    () =>
      level === 'emergency'
        ? '#E5484D'
        : level === 'critical'
          ? '#E5484D'
          : level === 'alert'
            ? '#F5A623'
            : level === 'vigilance'
              ? '#F5A623'
              : '#10B981',
    [level],
  )

  const TrendIcon = useMemo(
    () =>
      trend === 'rising'
        ? TrendingUp
        : trend === 'falling'
          ? TrendingDown
          : Minus,
    [trend],
  )

  return (
    <div className="panel p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} style={{ color: 'var(--text-secondary)' }} />
          <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
            Indicateur Risque Global
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px]" style={{ color }}>
          <TrendIcon size={11} />
          <span className="font-semibold">
            {trend === 'rising' ? 'En hausse' : trend === 'falling' ? 'En baisse' : 'Stable'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center py-4 relative">
        <svg width="160" height="100" viewBox="0 0 160 100">
          <path d="M 20 90 A 60 60 0 1 1 140 90" fill="none" stroke="var(--bg-panel-hover)" strokeWidth="10" strokeLinecap="round" />
          <path
            d="M 20 90 A 60 60 0 1 1 140 90"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 282.7}, 282.7`}
            style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s ease' }}
          />
          <line
            x1="80" y1="90"
            x2={80 + Math.cos((angle * Math.PI) / 180) * 50}
            y2={90 + Math.sin((angle * Math.PI) / 180) * 50}
            stroke={color} strokeWidth="2.5" strokeLinecap="round"
            style={{ transition: 'all 0.6s ease' }}
          />
          <circle cx="80" cy="90" r="5" fill={color} />
        </svg>
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
          <div className="text-[26px] font-bold font-mono leading-none" style={{ color }}>{score}</div>
          <div
            className="text-[9px] uppercase tracking-widest font-black mt-0.5 px-2 py-0.5 rounded"
            style={{ color: '#fff', background: color }}
          >
            {riskIndex?.label ?? 'NOMINAL'}
          </div>
        </div>
      </div>

      {riskIndex?.recommended_action && (
        <div className="text-[11px] leading-snug border-t pt-2" style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
          {riskIndex.recommended_action}
        </div>
      )}
    </div>
  )
}

// ─── Alert Banner ─────────────────────────────────────────────────────────

function AlertBanner() {
  const { data: alerts } = useAlerts()
  const count = alerts?.active_alerts.length ?? 0
  if (count === 0) return null

  return (
    <Link
      to="/alerts"
      className="panel p-4 flex items-center justify-between gap-4 group status-pulse-red transition-all hover:opacity-90"
      style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.3)' }}
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-none" style={{ background: 'rgba(239,68,68,0.12)' }}>
          <AlertTriangle size={18} style={{ color: 'var(--accent-red)' }} />
        </div>
        <div>
          <div className="text-[14px] font-bold" style={{ color: 'var(--accent-red)' }}>
            {count} alerte{count > 1 ? 's' : ''} active{count > 1 ? 's' : ''} — intervention requise
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {alerts?.active_alerts.slice(0, 2).map(a => a.site_name).join(', ')}
            {count > 2 ? ` et ${count - 2} autre${count - 2 > 1 ? 's' : ''}` : ''}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[12px] font-bold group-hover:translate-x-1 transition-transform" style={{ color: 'var(--accent-red)' }}>
        <span>Voir toutes</span>
        <ArrowRight size={14} />
      </div>
    </Link>
  )
}

// ─── Sites Table ──────────────────────────────────────────────────────────

function SitesTable() {
  // OPTIMISATION: Fixed polling - demo mode doesn't affect polling frequency
  const { data: density } = useQuery({
    queryKey: ['density'],
    queryFn: fetchDensity,
    refetchInterval: 3000,
  })

  return (
    <div className="panel flex flex-col">
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-subtle)' }}>
        <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Sites en surveillance</h2>
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>{density?.sites.length ?? 0} sites</span>
      </div>
      <div className="overflow-y-auto max-h-[360px]">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 border-b" style={{ background: 'var(--bg-panel)', borderColor: 'var(--border-subtle)' }}>
            <tr className="text-left text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              <th className="px-4 py-2.5 font-bold">Site</th>
              <th className="px-2 py-2.5 font-bold">Ville</th>
              <th className="px-2 py-2.5 font-bold text-right">Densité</th>
              <th className="px-2 py-2.5 font-bold text-center">État</th>
              <th className="px-4 py-2.5 font-bold text-right">Tendance</th>
            </tr>
          </thead>
          <tbody>
            {density?.sites.map(site => {
              const statusColor =
                site.status === 'red' ? 'var(--accent-red)' :
                site.status === 'orange' ? 'var(--accent-orange)' : 'var(--accent-green)'
              const TrendIcon = site.rise_rate_10min_percent > 5 ? TrendingUp : site.rise_rate_10min_percent < -5 ? TrendingDown : Minus
              const trendColor = site.rise_rate_10min_percent > 5 ? 'var(--accent-red)' : site.rise_rate_10min_percent < -5 ? 'var(--accent-green)' : 'var(--text-muted)'
              return (
                <tr
                  key={site.site_id}
                  className="border-b transition-colors"
                  style={{ borderColor: 'var(--border-subtle)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-panel-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td className="px-4 py-2.5 font-semibold whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
                    {site.site_name}
                  </td>
                  <td className="px-2 py-2.5">
                    <span className="text-[11px] font-medium" style={{ color: cityColor(site.city) }}>{site.city}</span>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1 rounded-full overflow-hidden" style={{ background: 'var(--bg-panel-hover)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${site.occupancy_percentage}%`, background: statusColor }} />
                      </div>
                      <span className="font-mono font-bold w-9 text-right" style={{ color: statusColor }}>
                        {site.occupancy_percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span className="inline-block w-2 h-2 rounded-full" style={{ background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1 text-[11px] font-mono" style={{ color: trendColor }}>
                      <TrendIcon size={11} />
                      <span>{site.rise_rate_10min_percent > 0 ? '+' : ''}{site.rise_rate_10min_percent}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Main Dashboard ───────────────────────────────────────────────────────

function DashboardOverview() {
  // OPTIMISATION: Fixed polling - demo mode doesn't affect polling frequency
  const { data: density } = useQuery({
    queryKey: ['density'],
    queryFn: fetchDensity,
    refetchInterval: 3000,
  })

  const totalPeople = density?.global_metrics.total_estimated_people ?? 0
  const sitesAlert = density?.global_metrics.sites_in_alert ?? 0
  const activeSensors = 142

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-[20px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Tableau de bord
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
          Métriques temps-réel des capteurs déployés sur tous les sites JOJ Dakar 2026.
        </p>
      </div>

      {/* Alert Banner (visible only if active alerts) */}
      <AlertBanner />

      {/* KPI row + IRG gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard
          title="Foule totale"
          value={fmt(totalPeople)}
          icon={Users}
          trend="+5.2%"
        />
        <StatCard
          title="Capteurs actifs"
          value={activeSensors}
          icon={Radio}
          trend="99.9%"
        />
        <StatCard
          title="Alertes actives"
          value={sitesAlert}
          icon={AlertTriangle}
          trend={sitesAlert > 0 ? `+${sitesAlert}` : '0'}
          isAlert={sitesAlert > 0}
        />
        <StatCard
          title="Charge système"
          value="42%"
          icon={Activity}
          trend="-1.5%"
        />
      </div>

      {/* Main grid: Chart + IRG Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 panel flex flex-col min-h-[400px]">
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>
              Densité de foule — simulation temps réel
            </h2>
          </div>
          <div className="p-4 flex-1">
            <DensityChart />
          </div>
        </div>
        <IrgGauge />
      </div>

      {/* Sites table + sensor stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SitesTable />
        </div>
        <div className="panel flex flex-col min-h-[400px]">
          <div className="px-4 py-3 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-subtle)' }}>
            <h2 className="text-[13px] font-semibold" style={{ color: 'var(--text-primary)' }}>Flux capteurs</h2>
            <div className="w-2 h-2 rounded-full status-pulse-green" style={{ background: 'var(--accent-green)' }} />
          </div>
          <div className="flex-1 overflow-y-auto max-h-[400px]">
            <SensorSimulationPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sensor Simulation Panel (kept, translated to FR) ──────────────────────

const MOCK_MESSAGES = [
  { msg: 'Paquet de données reçu : capteur S-14A', status: 'ok' },
  { msg: 'Densité normale : Zone 2', status: 'ok' },
  { msg: 'Pic de latence détecté (42 ms)', status: 'warn' },
  { msg: 'Nouvelle connexion : Porte B', status: 'ok' },
  { msg: 'Calibration capteur terminée', status: 'ok' },
  { msg: 'Flux stabilisé à la Porte C', status: 'ok' },
  { msg: 'Synchronisation avec le nœud amont', status: 'ok' },
  { msg: 'Perte de paquets mineure récupérée', status: 'warn' },
]

function SensorSimulationPanel() {
  const [logs, setLogs] = useState([
    { id: 100, time: new Date(), msg: 'Système initialisé', status: 'ok' },
  ])

  useEffect(() => {
    const interval = setInterval(
      () => {
        setLogs((prev) => {
          const m =
            MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)]
          return [
            { id: Date.now(), time: new Date(), msg: m.msg, status: m.status },
            ...prev,
          ].slice(0, 20)
        })
      },
      2500 + Math.random() * 2000,
    )
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col">
      {logs.map(log => {
        const timeStr = log.time.toLocaleTimeString([], { hour12: false })
        const dotColor = log.status === 'warn' ? 'var(--accent-orange)' : 'var(--accent-green)'
        return (
          <div
            key={log.id}
            className="flex items-start gap-3 px-4 py-2.5 border-b last:border-0 transition-colors"
            style={{ borderColor: 'var(--border-subtle)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-panel-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: dotColor }} />
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-[12px] leading-snug" style={{ color: 'var(--text-primary)' }}>{log.msg}</span>
              <span className="text-[10px] font-mono flex-none" style={{ color: 'var(--text-muted)' }}>{timeStr}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
