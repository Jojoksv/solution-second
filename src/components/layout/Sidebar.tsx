import {
  Activity,
  Map as MapIcon,
  Bell,
  Leaf,
  ArrowLeftRight,
  Settings,
  Command,
  Zap,
  UserCheck,
  HardHat,
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useAlerts } from '@/hooks'
import { useDemoState } from '@/stores/demoStore'
import { useBinTaskStore } from '@/stores/binTaskStore'

export function Sidebar() {
  const { data: alerts } = useAlerts()
  const demoActive = useDemoState()
  const alertCount = alerts?.active_alerts.length ?? 0
  const { role, pendingTasks, activeTasks, assignedTasks, setRole } = useBinTaskStore()
  const binAlertCount = pendingTasks.length + assignedTasks.length + activeTasks.length

  return (
    <aside className="w-[240px] bg-white border-r border-[#E5E7EB] flex flex-col h-full flex-shrink-0 z-50">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-[#FF6600] text-white flex items-center justify-center rounded-[4px]">
            <Command size={14} strokeWidth={3} />
          </div>
          <span className="text-[#111827] font-semibold text-[14px] tracking-tight">CrowdFlow</span>
          <span className="ml-auto text-[8px] uppercase tracking-wider text-[#9CA3AF] font-mono">JOJ&nbsp;26</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1 overflow-y-auto">
        <div className="text-[10px] uppercase font-bold tracking-widest text-[#9CA3AF] mb-2 px-2">Aperçu</div>

        <Link
          to="/"
          className="flex items-center gap-3 px-2 py-2 text-[13px] text-[#6B7280] font-medium rounded-[6px] hover:bg-[#F4F5F7] hover:text-[#111827] transition-colors"
          activeProps={{ className: 'bg-[#FFF3EB] text-[#FF6600] font-semibold' }}
          activeOptions={{ exact: true }}
        >
          <Activity size={16} strokeWidth={2} />
          <span>Tableau de bord</span>
        </Link>

        <Link
          to="/map"
          className="flex items-center gap-3 px-2 py-2 text-[13px] text-[#6B7280] font-medium rounded-[6px] hover:bg-[#F4F5F7] hover:text-[#111827] transition-colors"
          activeProps={{ className: 'bg-[#FFF3EB] text-[#FF6600] font-semibold' }}
        >
          <MapIcon size={16} strokeWidth={2} />
          <span>Carte temps réel</span>
        </Link>

        <div className="text-[10px] uppercase font-bold tracking-widest text-[#9CA3AF] mt-6 mb-2 px-2">Modules</div>

        <Link
          to="/alerts"
          className="flex items-center justify-between px-2 py-2 text-[13px] text-[#6B7280] font-medium rounded-[6px] hover:bg-[#F4F5F7] hover:text-[#111827] transition-colors"
          activeProps={{ className: 'bg-[#FFF3EB] text-[#FF6600] font-semibold' }}
        >
          <div className="flex items-center gap-3">
            <Bell size={16} strokeWidth={2} />
            <span>Alertes</span>
          </div>
          {alertCount > 0 && (
            <div
              className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-[#EF4444] text-white text-[10px] rounded-[4px] font-bold ${alertCount > 0 ? 'status-pulse-red' : ''}`}
            >
              {alertCount}
            </div>
          )}
        </Link>

        <Link
          to="/green"
          className="flex items-center justify-between px-2 py-2 text-[13px] text-[#6B7280] font-medium rounded-[6px] hover:bg-[#F4F5F7] hover:text-[#111827] transition-colors"
          activeProps={{ className: 'bg-[#FFF3EB] text-[#FF6600] font-semibold' }}
        >
          <div className="flex items-center gap-3">
            <Leaf size={16} strokeWidth={2} />
            <span>Smart Green</span>
          </div>
          {binAlertCount > 0 && (
            <div className="min-w-[20px] h-5 px-1.5 flex items-center justify-center bg-[#10B981] text-white text-[10px] rounded-[4px] font-bold">
              {binAlertCount}
            </div>
          )}
        </Link>

        <Link
          to="/flows"
          className="flex items-center gap-3 px-2 py-2 text-[13px] text-[#6B7280] font-medium rounded-[6px] hover:bg-[#F4F5F7] hover:text-[#111827] transition-colors"
          activeProps={{ className: 'bg-[#FFF3EB] text-[#FF6600] font-semibold' }}
        >
          <ArrowLeftRight size={16} strokeWidth={2} />
          <span>Contrôle des flux</span>
        </Link>
      </nav>

      {/* Demo mode indicator */}
      {demoActive && (
        <div className="px-3 pb-2">
          <div className="bg-[#FF6600]/10 border border-[#FF6600]/30 rounded-[6px] p-2.5">
            <div className="flex items-center gap-2 mb-1.5">
              <Zap size={11} className="text-[#FF6600]" strokeWidth={2.5} />
              <div className="text-[10px] text-[#FF6600] uppercase tracking-wider font-bold">Mode Démo Actif</div>
            </div>
            <div className="h-1 bg-[#E5E7EB] rounded-full overflow-hidden">
              <div className="h-full bg-[#FF6600] demo-progress-bar" />
            </div>
            <div className="text-[9px] text-[#6B7280] mt-1 font-mono">Refresh 2s · 30s restantes</div>
          </div>
        </div>
      )}

      {/* Role switcher */}
      <div className="px-3 pb-2">
        <div className="border border-[#E5E7EB] rounded-[8px] overflow-hidden">
          <button
            onClick={() => setRole('superviseur')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium transition-colors ${
              role === 'superviseur'
                ? 'bg-[#FF6600] text-white'
                : 'bg-white text-[#6B7280] hover:bg-[#F4F5F7]'
            }`}
          >
            <UserCheck size={13} strokeWidth={2} />
            <span>Superviseur</span>
            {role === 'superviseur' && <span className="ml-auto text-[9px] opacity-80 font-mono">ACTIF</span>}
          </button>
          <button
            onClick={() => setRole('agent')}
            className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium transition-colors border-t border-[#E5E7EB] ${
              role === 'agent'
                ? 'bg-[#10B981] text-white'
                : 'bg-white text-[#6B7280] hover:bg-[#F4F5F7]'
            }`}
          >
            <HardHat size={13} strokeWidth={2} />
            <span>Agent Propreté</span>
            {role === 'agent' && <span className="ml-auto text-[9px] opacity-80 font-mono">ACTIF</span>}
          </button>
        </div>
      </div>

      {/* Footer Profile */}
      <div className="p-3 border-t border-[#E5E7EB]">
        <a
          href="#"
          className="flex items-center gap-3 px-2 py-2 text-[13px] text-[#6B7280] font-medium rounded-[6px] hover:bg-[#F4F5F7] hover:text-[#111827] transition-colors mb-2"
        >
          <Settings size={16} strokeWidth={2} />
          <span>Paramètres</span>
        </a>
        <div className="flex items-center gap-3 px-2 py-2 rounded-[6px] hover:bg-[#F4F5F7] cursor-pointer transition-colors">
          <div
            className="w-7 h-7 rounded-[4px] flex items-center justify-center text-white text-[11px] font-bold"
            style={{ background: role === 'agent' ? '#10B981' : '#FF6600' }}
          >
            {role === 'agent' ? 'AP' : 'SV'}
          </div>
          <div className="flex flex-col">
            <span className="text-[#111827] text-[12px] font-medium leading-none mb-1">
              {role === 'agent' ? 'Agent Propreté' : 'Superviseur'}
            </span>
            <span className="text-[#9CA3AF] text-[10px] leading-none">Dakar Operations</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
