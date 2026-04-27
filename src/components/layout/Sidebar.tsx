// ─── Sidebar ──────────────────────────────────────────────────────────────
// Futuristic navigation sidebar with role switcher and live alert badges.

import {
  Activity,
  Map as MapIcon,
  Bell,
  Leaf,
  ArrowLeftRight,
  Settings,
  Zap,
  UserCheck,
  HardHat,
  ShieldAlert,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useAlerts } from '@/hooks'
import { useDemoState } from '@/stores/demoStore'
import { useBinTaskStore } from '@/stores/binTaskStore'
import { useTheme } from '@/stores/themeStore'

const NAV_PRIMARY = [
  { to: '/' as const, label: 'Tableau de bord', icon: Activity, exact: true },
  {
    to: '/map' as const,
    label: 'Carte temps réel',
    icon: MapIcon,
    exact: false,
  },
]

const NAV_MODULES = [
  { to: '/alerts' as const, label: 'Alertes', icon: Bell },
  { to: '/green' as const, label: 'Smart Green', icon: Leaf },
  { to: '/flows' as const, label: 'Flux & Sorties', icon: ArrowLeftRight },
]

export function Sidebar() {
  const { data: alerts } = useAlerts()
  const demoActive = useDemoState()
  const alertCount = alerts?.active_alerts.length ?? 0
  const { role, pendingTasks, assignedTasks, activeTasks, setRole } =
    useBinTaskStore()
  const binAlertCount =
    pendingTasks.length + assignedTasks.length + activeTasks.length
  const { theme } = useTheme()

  const badgeColors: Record<string, string> = {
    '/alerts': 'var(--accent-red)',
    '/green': 'var(--accent-green)',
  }
  const badgeCounts: Record<string, number> = {
    '/alerts': alertCount,
    '/green': binAlertCount,
  }

  return (
    <aside className="w-[240px] gradient-background shadow-2xl border-r border-[#2A2A2A] flex flex-col h-full flex-shrink-0 z-50">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white text-black flex items-center justify-center rounded-[4px]">
            <Command size={14} strokeWidth={3} />
          </div>
          <span className="text-white font-semibold text-[14px] tracking-tight">EcoFlow</span>
    <aside
      className="w-[232px] flex flex-col h-full flex-shrink-0 z-50 border-r"
      style={{
        background: 'var(--bg-panel)',
        borderColor: 'var(--border-subtle)',
        transition: 'background 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Brand */}
      <div
        className="h-14 flex items-center px-4 border-b flex-none"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-3 w-full">
          {/* Logo mark */}
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black tracking-tight flex-none"
            style={{
              background: 'var(--accent-violet)',
              color: '#fff',
              boxShadow: '0 0 12px var(--accent-violet-glow)',
            }}
          >
            JOJ
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="text-[13px] font-bold tracking-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              EcoFlow
            </div>
            <div
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--text-muted)' }}
            >
              Dakar 2026
            </div>
          </div>
          {/* Live indicator */}
          <div
            className="flex-none flex items-center gap-1 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded"
            style={{
              background: 'rgba(16,185,129,0.12)',
              color: 'var(--accent-green)',
              border: '1px solid rgba(16,185,129,0.25)',
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full status-pulse-green"
              style={{ background: 'var(--accent-green)' }}
            />
            live
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
        <div className="text-[10px] uppercase font-bold tracking-widest text-white mb-2 px-2">Vue</div>
        
        <Link 
          to="/" 
          className="flex items-center gap-3 px-2 py-2 text-[13px] text-white font-medium rounded-[6px] hover:bg-[#141414] hover:text-[#EDEDED] transition-colors"
          activeProps={{ className: "bg-[#141414] text-white" }} 
          activeOptions={{ exact: true }}
        >
          <Activity size={16} strokeWidth={2} />
          <span>Accueil</span>
        </Link>
        
        <Link 
          to="/map" 
          className="flex items-center gap-3 px-2 py-2 text-[13px] text-white font-medium rounded-[6px] hover:bg-[#141414] hover:text-[#EDEDED] transition-colors"
          activeProps={{ className: "bg-[#141414] text-[#EDEDED]" }}
        >
          <MapIcon size={16} strokeWidth={2} />
          <span>Carte</span>
        </Link>

        <div className="text-[10px] uppercase font-bold tracking-widest text-white mt-6 mb-2 px-2">Modules</div>

        <Link 
          to="/alerts" 
          className="flex items-center justify-between px-2 py-2 text-[13px] text-white font-medium rounded-[6px] hover:bg-[#141414] hover:text-[#EDEDED] transition-colors"
          activeProps={{ className: "bg-[#141414] text-[#EDEDED]" }}
        >
          <div className="flex items-center gap-3">
            <Bell size={16} strokeWidth={2} />
            <span>Alertes</span>
          </div>
          <div className="w-5 h-5 flex items-center justify-center bg-[#E5484D] text-[#FFF] text-[10px] rounded-[4px] font-bold">
            2
          </div>
        </Link>
        
        <Link 
          to="/green" 
          className="flex items-center gap-3 px-2 py-2 text-[13px] text-white font-medium rounded-[6px] hover:bg-[#141414] hover:text-[#EDEDED] transition-colors"
          activeProps={{ className: "bg-[#141414] text-[#EDEDED]" }}
        >
          <Leaf size={16} strokeWidth={2} />
          <span>Smart Green</span>
        </Link>
        
        <Link 
          to="/flows" 
          className="flex items-center gap-3 px-2 py-2 text-[13px] text-white font-medium rounded-[6px] hover:bg-[#141414] hover:text-[#EDEDED] transition-colors"
          activeProps={{ className: "bg-[#141414] text-[#EDEDED]" }}
        >
          <ArrowLeftRight size={16} strokeWidth={2} />
          <span>Control Flow</span>
        </Link>
      </nav>

      {/* Footer Profile */}
      <div className="p-3 border-t border-[#2A2A2A]">
        <a href="#" className="flex items-center gap-3 px-2 py-2 text-[13px] text-white font-medium rounded-[6px] hover:bg-[#141414] hover:text-[#EDEDED] transition-colors mb-2">
          <Settings size={16} strokeWidth={2} />
          <span>Paramètres</span>
        </a>
        <div className="flex items-center gap-3 px-2 py-2 rounded-[6px] hover:bg-[#141414] hover:text-white cursor-pointer transition-colors">
          <div className="w-7 h-7 bg-white rounded-[4px] flex items-center justify-center text-black text-[11px] font-bold">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-white text-[12px] font-medium leading-none mb-1">Superviseurs</span>
            <span className="text-white text-[10px] leading-none">Operations Dakar</span>
      <nav className="flex-1 py-4 px-3 flex flex-col gap-0.5 overflow-y-auto">
        {/* Primary */}
        <div
          className="text-[9px] font-bold uppercase tracking-widest mb-1.5 px-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Aperçu
        </div>

        {NAV_PRIMARY.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 px-3 py-2 text-[12px] font-medium rounded-lg transition-all"
            style={{ color: 'var(--text-secondary)' }}
            activeProps={{
              className:
                'flex items-center gap-3 px-3 py-2 text-[12px] font-medium rounded-lg transition-all nav-item-active',
              style: { color: 'var(--text-primary)' },
            }}
            activeOptions={{ exact }}
          >
            <Icon size={15} strokeWidth={2} />
            <span>{label}</span>
          </Link>
        ))}

        <div
          className="text-[9px] font-bold uppercase tracking-widest mt-5 mb-1.5 px-2"
          style={{ color: 'var(--text-muted)' }}
        >
          Modules
        </div>

        {NAV_MODULES.map(({ to, label, icon: Icon }) => {
          const count = badgeCounts[to] ?? 0
          const badgeColor = badgeColors[to] ?? 'var(--accent-violet)'
          return (
            <Link
              key={to}
              to={to}
              className="flex items-center justify-between px-3 py-2 text-[12px] font-medium rounded-lg transition-all"
              style={{ color: 'var(--text-secondary)' }}
              activeProps={{
                className:
                  'flex items-center justify-between px-3 py-2 text-[12px] font-medium rounded-lg transition-all nav-item-active',
                style: { color: 'var(--text-primary)' },
              }}
            >
              <div className="flex items-center gap-3">
                <Icon size={15} strokeWidth={2} />
                <span>{label}</span>
              </div>
              {count > 0 && (
                <span
                  className="min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[9px] font-black rounded-full"
                  style={{
                    background: badgeColor,
                    color: '#fff',
                    boxShadow: `0 0 8px ${badgeColor}60`,
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Demo mode */}
      {demoActive && (
        <div className="px-3 pb-2">
          <div
            className="rounded-lg p-2.5"
            style={{
              background: 'rgba(249,115,22,0.08)',
              border: '1px solid rgba(249,115,22,0.25)',
            }}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <Zap
                size={10}
                style={{ color: 'var(--accent-orange)' }}
                strokeWidth={2.5}
              />
              <span
                className="text-[9px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--accent-orange)' }}
              >
                Mode Démo Actif
              </span>
            </div>
            <div
              className="h-0.5 rounded-full overflow-hidden"
              style={{ background: 'var(--border-subtle)' }}
            >
              <div
                className="h-full demo-progress-bar"
                style={{ background: 'var(--accent-orange)' }}
              />
            </div>
            <div
              className="text-[9px] font-mono mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Refresh 2s · 30s restantes
            </div>
          </div>
        </div>
      )}

      {/* Role switcher */}
      <div className="px-3 pb-2">
        <div
          className="rounded-xl overflow-hidden border"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <button
            onClick={() => setRole('superviseur')}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-semibold transition-all"
            style={{
              background:
                role === 'superviseur'
                  ? 'var(--accent-orange)'
                  : 'var(--bg-panel-hover)',
              color: role === 'superviseur' ? '#fff' : 'var(--text-secondary)',
            }}
          >
            <UserCheck size={13} strokeWidth={2} />
            <span>Superviseur</span>
            {role === 'superviseur' && (
              <span className="ml-auto text-[8px] opacity-70 font-mono uppercase tracking-wider">
                Actif
              </span>
            )}
          </button>
          <button
            onClick={() => setRole('agent')}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-[11px] font-semibold transition-all border-t"
            style={{
              background:
                role === 'agent'
                  ? 'var(--accent-green)'
                  : 'var(--bg-panel-hover)',
              color: role === 'agent' ? '#fff' : 'var(--text-secondary)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <HardHat size={13} strokeWidth={2} />
            <span>Agent Propreté</span>
            {role === 'agent' && (
              <span className="ml-auto text-[8px] opacity-70 font-mono uppercase tracking-wider">
                Actif
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Footer profile */}
      <div
        className="px-3 pb-3 border-t"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <a
          href="#"
          className="flex items-center gap-3 px-2 py-2 text-[12px] font-medium rounded-lg mt-2 hover:opacity-80 transition-all"
          style={{ color: 'var(--text-secondary)' }}
        >
          <Settings size={14} strokeWidth={2} />
          <span>Paramètres</span>
        </a>
        <div
          className="flex items-center gap-3 px-2 py-2 rounded-lg cursor-pointer transition-all hover:opacity-80"
          style={{
            background: 'var(--bg-panel-hover)',
            border: '1px solid var(--border-subtle)',
            marginTop: '2px',
          }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-none"
            style={{
              background:
                role === 'agent'
                  ? 'var(--accent-green)'
                  : 'var(--accent-violet)',
              color: '#fff',
              boxShadow: `0 0 8px ${role === 'agent' ? 'var(--accent-green-glow)' : 'var(--accent-violet-glow)'}`,
            }}
          >
            {role === 'agent' ? 'AP' : 'SV'}
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className="text-[12px] font-semibold leading-none truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {role === 'agent' ? 'Agent Propreté' : 'Superviseur'}
            </span>
            <span
              className="text-[10px] leading-none mt-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Dakar Operations
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
