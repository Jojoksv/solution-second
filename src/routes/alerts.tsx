import { createFileRoute } from '@tanstack/react-router'
import { AlertsPanel } from '@/components/alerts/AlertsPanel'
import { ShieldAlert, Users } from 'lucide-react'

export const Route = createFileRoute('/alerts')({
  component: AlertsPage,
})

export function AlertsPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto h-full pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">Alerts & Incidents</h1>
        <p className="text-[13px] text-[#888888] mt-1">Manage thresholds, active incidents, and coordinate volunteer response.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1">
        {/* Main Panel */}
        <div className="panel flex flex-col flex-[2] min-h-[500px]">
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center gap-2">
            <ShieldAlert size={14} className="text-[#EDEDED]" />
            <h2 className="text-[13px] font-semibold text-[#EDEDED]">Active Missions & Queue</h2>
          </div>
          
          <div className="p-4 flex flex-col flex-1 overflow-hidden">
             {/* KPIs */}
             <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-[4px] p-3">
                   <div className="text-[11px] font-medium text-[#888888] uppercase tracking-wide">Avg Response Time</div>
                   <div className="text-lg font-semibold text-[#10B981] mt-1">2m 14s</div>
                </div>
                <div className="bg-[#141414] border border-[#2A2A2A] rounded-[4px] p-3">
                   <div className="text-[11px] font-medium text-[#888888] uppercase tracking-wide">Acknowledgment Rate</div>
                   <div className="text-lg font-semibold text-[#EDEDED] mt-1">92%</div>
                </div>
             </div>
             
             {/* Panel Component wrapper */}
             <div className="flex-1 overflow-y-auto pr-2">
                <AlertsPanel />
             </div>
          </div>
        </div>
        
        {/* Side Panel */}
        <div className="panel flex flex-col flex-1 min-h-[500px]">
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center gap-2">
            <Users size={14} className="text-[#EDEDED]" />
            <h2 className="text-[13px] font-semibold text-[#EDEDED]">Deployed Volunteers</h2>
          </div>
          <div className="p-4">
            <ul className="flex flex-col gap-2">
               <li className="flex justify-between items-center p-3 rounded-[4px] bg-[#141414] border border-[#2A2A2A]">
                 <div className="flex flex-col">
                   <strong className="text-[13px] text-[#EDEDED] font-medium">Agent 42</strong>
                   <span className="text-[11px] text-[#888888]">Stade A. Wade</span>
                 </div>
                 <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#E5484D]/10 text-[#E5484D] border border-[#E5484D]/20 rounded">ON MISSION</span>
               </li>
               <li className="flex justify-between items-center p-3 rounded-[4px] bg-[#141414] border border-[#2A2A2A]">
                 <div className="flex flex-col">
                   <strong className="text-[13px] text-[#EDEDED] font-medium">Agent 18</strong>
                   <span className="text-[11px] text-[#888888]">Corniche Ouest</span>
                 </div>
                 <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 rounded">AVAILABLE</span>
               </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
