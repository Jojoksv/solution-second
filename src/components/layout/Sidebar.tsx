import {
  Activity,
  Map as MapIcon,
  Bell,
  Leaf,
  ArrowLeftRight,
  Settings,
  Command,
  Zap,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useAlerts } from '@/hooks'
import { useDemoState } from '@/stores/demoStore'

export function Sidebar() {
  const { data: alerts } = useAlerts()
  const demoActive = useDemoState()
  const alertCount = alerts?.active_alerts.length ?? 0

  return (
    <aside className="w-[240px] bg-[#0A0A0A] border-r border-[#2A2A2A] flex flex-col h-full flex-shrink-0 z-50">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[#EDEDED] text-[#0A0A0A] flex items-center justify-center rounded-[4px]">
            <Command size={14} strokeWidth={3} />
          </div>
          <span className="text-[#EDEDED] font-semibold text-[14px] tracking-tight">CrowdFlow</span>
          <span className="ml-auto text-[8px] uppercase tracking-wider text-[#555555] font-mono">JOJ&nbsp;26</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold tracking-widest text-[#555555] mb-2 px-2">Aperçu</div>

        <Link
          to="/"
          className="flex items-center gap-3 px-2 py-2 text-[13px] text-[#888888] font-medium rounded-[6px] hover:bg-[#141414] hover:text-[#EDEDED] transition-colors"
          activeProps={{ className: 'bg-[#141414] text-[#EDEDED]' }}
          activeOptions={{ exact: true }}
        >
          <Activity size={16} strokeWidth={2} />
          <span>Tableau de bord</span>
        </Link>

        <Link
          to="/map"
          className="flex items-center gap-3 px-2 py-2 text-[13px] text-[#888888] font-medium rounded-[6px] hover:bg-[#141414] hover:text-[#EDEDED] transition-colors"
          activeProps={{ className: 'bg-[#141414] text-[#EDEDED]' }}
        >
          <MapIcon size={16} strokeWidth={2} />
          <span>Carte temps réel</span>
        </Link>

        <div className="text-[10px] uppercase font-bold tracking-widest text-[#555555] mt-6 mb-2 px-2">Modules</div>

        <Link
          to="/alerts"
          className="flex items-center justify-between px-2 py-2 text-[13px] text-[#888888] font-medium rounded-[6px] hover:bg-[#141414] hover:text-[#EDEDED] transition-colors"
          activeProps={{ className: 'bg-[#141414] text-[#EDEDED]' }}
        >
          <div className="flex items-center gap-3">
            <Bell size={16} strokeWidth={2} />
            <span>Alertes</span>
          </div>
          {alertCount > 0 && (
            <div
              className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-[#E5484D] text-[#FFF] text-[10px] rounded-[4px] font-bold ${alertCount > 0 ? 'status-pulse-red' : ''}`}
            >
              {alertCount}
            </div>
          )}
        </Link>

        <Link
          to="/green"
          className="flex items-center gap-3 px-2 py-2 text-[13px] text-[#888888] font-medium rounded-[6px] hover:bg-[#141414] hover:text-[#EDEDED] transition-colors"
          activeProps={{ className: 'bg-[#141414] text-[#EDEDED]' }}
        >
          <Leaf size={16} strokeWidth={2} />
          <span>Smart Green</span>
        </Link>

        <Link
          to="/flows"
          className="flex items-center gap-3 px-2 py-2 text-[13px] text-[#888888] font-medium rounded-[6px] hover:bg-[#141414] hover:text-[#EDEDED] transition-colors"
          activeProps={{ className: 'bg-[#141414] text-[#EDEDED]' }}
        >
          <ArrowLeftRight size={16} strokeWidth={2} />
          <span>Contrôle des flux</span>
        </Link>
      </nav>

      {/* Demo mode indicator */}
      {demoActive && (
        <div className="px-3 pb-2">
          <div className="bg-[#F5A623]/10 border border-[#F5A623]/30 rounded-[6px] p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap size={11} className="text-[#F5A623]" strokeWidth={2.5} />
              <div className="text-[10px] text-[#F5A623] uppercase tracking-wider font-bold">Mode Démo Actif</div>
            </div>
            <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
              <div className="h-full bg-[#F5A623] demo-progress-bar" />
            </div>
            <div className="text-[9px] text-[#888888] mt-1 font-mono">Refresh 2s · 30s restantes</div>
          </div>
        </div>
      )}

      {/* Footer Profile */}
      <div className="p-3 border-t border-[#2A2A2A]">
        <a
          href="#"
          className="flex items-center gap-3 px-2 py-2 text-[13px] text-[#888888] font-medium rounded-[6px] hover:bg-[#141414] hover:text-[#EDEDED] transition-colors mb-2"
        >
          <Settings size={16} strokeWidth={2} />
          <span>Paramètres</span>
        </a>
        <div className="flex items-center gap-3 px-2 py-2 rounded-[6px] hover:bg-[#141414] cursor-pointer transition-colors">
          <div className="w-7 h-7 bg-[#2A2A2A] rounded-[4px] flex items-center justify-center text-[#EDEDED] text-[11px] font-bold">
            JD
          </div>
          <div className="flex flex-col">
            <span className="text-[#EDEDED] text-[12px] font-medium leading-none mb-1">Superviseur</span>
            <span className="text-[#555555] text-[10px] leading-none">Dakar Operations</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
