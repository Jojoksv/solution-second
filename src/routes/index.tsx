import { useState, useEffect } from 'react'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Activity, Users, Radio, AlertTriangle, ShieldAlert, ArrowRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchDensity, fetchRiskIndex } from '@/api'
import { useDemoState } from '@/stores/demoStore'
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
  accentColor?: string
}

function StatCard({ title, value, icon: Icon, trend, isAlert = false, accentColor }: StatCardProps) {
  const color = isAlert ? '#EF4444' : (accentColor ?? '#6B7280')
  return (
    <div className="panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color }} />
          <span className="text-[12px] font-medium text-[#6B7280] tracking-wide uppercase">{title}</span>
        </div>
      </div>
      <div className="flex items-end justify-between mt-1">
        <span className="text-2xl font-semibold tracking-tight" style={{ color: isAlert ? '#EF4444' : '#111827' }}>
          {value}
        </span>
        {trend && (
          <div className="flex items-center gap-1 bg-[#F4F5F7] px-1.5 py-0.5 rounded-[4px] border border-[#E5E7EB]">
            <span className={`text-[11px] font-medium ${trend.startsWith('+') ? 'text-[#10B981]' : trend.startsWith('-') ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}>
              {trend}
            </span>
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
    refetchInterval: 5000,
  })
  const score = riskIndex?.score ?? 0
  const level = riskIndex?.level ?? 'nominal'
  const trend = riskIndex?.trend ?? 'stable'

  const angle = (score / 100) * 270 - 135
  const color =
    level === 'emergency' ? '#EF4444' :
    level === 'critical'  ? '#EF4444' :
    level === 'alert'     ? '#FF6600' :
    level === 'vigilance' ? '#F59E0B' : '#10B981'

  const TrendIcon = trend === 'rising' ? TrendingUp : trend === 'falling' ? TrendingDown : Minus

  return (
    <div className="panel p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-[#6B7280]" />
          <span className="text-[12px] font-medium text-[#6B7280] tracking-wide uppercase">Indicateur Risque Global</span>
        </div>
        <div className="flex items-center gap-1 text-[11px]" style={{ color }}>
          <TrendIcon size={11} />
          <span className="capitalize font-medium">{trend === 'rising' ? 'En hausse' : trend === 'falling' ? 'En baisse' : 'Stable'}</span>
        </div>
      </div>

      <div className="flex items-center justify-center py-4 relative">
        <svg width="160" height="100" viewBox="0 0 160 100">
          {/* Background arc */}
          <path
            d="M 20 90 A 60 60 0 1 1 140 90"
            fill="none"
            stroke="#F4F5F7"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Filled arc */}
          <path
            d="M 20 90 A 60 60 0 1 1 140 90"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 282.7}, 282.7`}
            style={{ transition: 'stroke-dasharray 0.6s ease, stroke 0.4s ease' }}
          />
          {/* Needle */}
          <line
            x1="80" y1="90"
            x2={80 + Math.cos((angle * Math.PI) / 180) * 50}
            y2={90 + Math.sin((angle * Math.PI) / 180) * 50}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            style={{ transition: 'all 0.6s ease' }}
          />
          <circle cx="80" cy="90" r="4" fill={color} />
        </svg>
        <div className="absolute inset-x-0 bottom-2 flex flex-col items-center">
          <div className="text-[24px] font-bold font-mono leading-none" style={{ color }}>{score}</div>
          <div className="text-[9px] uppercase tracking-widest font-bold mt-0.5" style={{ color }}>{riskIndex?.label ?? 'NOMINAL'}</div>
        </div>
      </div>

      {riskIndex?.recommended_action && (
        <div className="text-[11px] text-[#6B7280] leading-snug border-t border-[#E5E7EB] pt-2">
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
      className="panel p-4 flex items-center justify-between gap-4 border border-[#EF4444]/30 bg-[#EF4444]/5 hover:bg-[#EF4444]/8 transition-colors status-pulse-red group"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#EF4444]/12 flex items-center justify-center flex-none">
          <AlertTriangle size={18} className="text-[#EF4444]" />
        </div>
        <div>
          <div className="text-[14px] font-semibold text-[#EF4444]">
            {count} alerte{count > 1 ? 's' : ''} active{count > 1 ? 's' : ''} — intervention requise
          </div>
          <div className="text-[11px] text-[#6B7280] mt-0.5">
            {alerts?.active_alerts.slice(0, 2).map(a => a.site_name).join(', ')}
            {count > 2 ? ` et ${count - 2} autre${count - 2 > 1 ? 's' : ''}` : ''}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[12px] text-[#EF4444] font-semibold group-hover:translate-x-1 transition-transform">
        <span>Voir toutes</span>
        <ArrowRight size={14} />
      </div>
    </Link>
  )
}

// ─── Sites Table ──────────────────────────────────────────────────────────

function SitesTable() {
  const demoActive = useDemoState()
  const { data: density } = useQuery({
    queryKey: ['density'],
    queryFn: fetchDensity,
    refetchInterval: demoActive ? 2000 : 5000,
  })

  return (
    <div className="panel flex flex-col">
      <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-[#111827]">Sites en surveillance</h2>
        <span className="text-[10px] text-[#9CA3AF] font-mono">{density?.sites.length ?? 0} sites</span>
      </div>
      <div className="overflow-y-auto max-h-[360px]">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 bg-white border-b border-[#E5E7EB]">
            <tr className="text-left text-[10px] text-[#9CA3AF] uppercase tracking-wider">
              <th className="px-4 py-2.5 font-semibold">Site</th>
              <th className="px-2 py-2.5 font-semibold">Ville</th>
              <th className="px-2 py-2.5 font-semibold text-right">Densité</th>
              <th className="px-2 py-2.5 font-semibold text-center">Statut</th>
              <th className="px-4 py-2.5 font-semibold text-right">Tendance</th>
            </tr>
          </thead>
          <tbody>
            {density?.sites.map(site => {
              const statusColor =
                site.status === 'red' ? '#EF4444' :
                site.status === 'orange' ? '#FF6600' : '#10B981'
              const TrendIcon =
                site.rise_rate_10min_percent > 5 ? TrendingUp :
                site.rise_rate_10min_percent < -5 ? TrendingDown : Minus
              return (
                <tr
                  key={site.site_id}
                  className="border-b border-[#F4F5F7] hover:bg-[#F9FAFB] transition-colors"
                >
                  <td className="px-4 py-2.5 font-medium text-[#111827] whitespace-nowrap">{site.site_name}</td>
                  <td className="px-2 py-2.5">
                    <span style={{ color: cityColor(site.city) }} className="text-[11px] font-medium">{site.city}</span>
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 bg-[#E5E7EB] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${site.occupancy_percentage}%`, background: statusColor }}
                        />
                      </div>
                      <span className="font-mono font-bold w-8 text-right" style={{ color: statusColor }}>
                        {site.occupancy_percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 text-center">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: statusColor, boxShadow: `0 0 5px ${statusColor}` }}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1 text-[11px] font-mono"
                      style={{ color: site.rise_rate_10min_percent > 5 ? '#EF4444' : site.rise_rate_10min_percent < -5 ? '#10B981' : '#9CA3AF' }}
                    >
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

export function DashboardOverview() {
  const demoActive = useDemoState()
  const { data: density } = useQuery({
    queryKey: ['density'],
    queryFn: fetchDensity,
    refetchInterval: demoActive ? 2000 : 5000,
  })

  const totalPeople = density?.global_metrics.total_estimated_people ?? 0
  const sitesAlert = density?.global_metrics.sites_in_alert ?? 0
  const activeSensors = 142

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Tableau de bord</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">Métriques temps-réel des capteurs déployés sur tous les sites JOJ Dakar 2026.</p>
      </div>

      {/* Alert Banner (visible only if active alerts) */}
      <AlertBanner />

      {/* KPI row + IRG gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <StatCard title="Foule totale" value={fmt(totalPeople)} icon={Users} trend="+5.2%" accentColor="#FF6600" />
        <StatCard title="Capteurs actifs" value={activeSensors} icon={Radio} trend="99.9%" accentColor="#10B981" />
        <StatCard
          title="Alertes actives"
          value={sitesAlert}
          icon={AlertTriangle}
          trend={sitesAlert > 0 ? `+${sitesAlert}` : '0'}
          isAlert={sitesAlert > 0}
        />
        <StatCard title="Charge système" value="42%" icon={Activity} trend="-1.5%" accentColor="#6B7280" />
      </div>

      {/* Main grid: Chart + IRG Gauge + Sites Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 panel flex flex-col min-h-[400px]">
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <h2 className="text-[13px] font-semibold text-[#111827]">Densité de foule — simulation temps réel</h2>
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
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex justify-between items-center">
            <h2 className="text-[13px] font-semibold text-[#111827]">Flux capteurs</h2>
            <div className="w-2 h-2 rounded-full bg-[#10B981] status-pulse-green" />
          </div>
          <div className="p-0 flex-1 overflow-y-auto max-h-[400px]">
            <SensorSimulationPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sensor Simulation Panel ──────────────────────────────────────────────

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
    const interval = setInterval(() => {
      setLogs(prev => {
        const m = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)]
        return [{ id: Date.now(), time: new Date(), msg: m.msg, status: m.status }, ...prev].slice(0, 20)
      })
    }, 2500 + Math.random() * 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col">
      {logs.map(log => {
        const timeStr = log.time.toLocaleTimeString([], { hour12: false })
        return (
          <div
            key={log.id}
            className="flex items-start gap-3 px-4 py-3 border-b border-[#F4F5F7] last:border-0 hover:bg-[#F9FAFB] transition-colors"
          >
            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.status === 'warn' ? 'bg-[#F59E0B]' : 'bg-[#10B981]'}`} />
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#374151] leading-snug">{log.msg}</span>
                <span className="text-[10px] text-[#9CA3AF] font-mono">{timeStr}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
