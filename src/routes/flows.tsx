import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, AlertTriangle, GitMerge } from 'lucide-react'

export const Route = createFileRoute('/flows')({
  component: FlowsPage,
})

function FlowsPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto h-full pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">Flow Control & Routing</h1>
        <p className="text-[13px] text-[#888888] mt-1">AI-driven crowd redirection and bottleneck prevention.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1">
        
        {/* Main Panel */}
        <div className="panel flex flex-col flex-[2] min-h-[500px]">
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center gap-2">
            <AlertTriangle size={14} className="text-[#F5A623]" />
            <h2 className="text-[13px] font-semibold text-[#EDEDED]">Active Routing Recommendations</h2>
          </div>
          
          <div className="p-4 flex flex-col gap-4 overflow-y-auto">
             <div className="p-4 bg-[#141414] border border-[#E5484D]/30 rounded-[6px]">
                <div className="text-[11px] text-[#E5484D] font-bold tracking-widest uppercase mb-3">Critical Capacity</div>
                <div className="flex items-center gap-4 text-base font-semibold text-[#EDEDED]">
                   <span>Stade A. Wade</span>
                   <ArrowRight className="text-[#555555]" size={16} />
                   <span className="text-[#10B981]">Dakar Arena</span>
                </div>
                <p className="text-[12px] mt-2 text-[#888888] leading-relaxed">
                  <strong className="text-[#EDEDED]">Action Required:</strong> Redirect 4,000 attendees to Dakar Arena (9,000 seats available).<br/>
                  <strong className="text-[#EDEDED]">Vector:</strong> Dispatch +2 TER trains/hour.
                </p>
                <div className="mt-4 flex gap-2">
                   <button className="bg-[#EDEDED] text-[#000000] px-3 py-1.5 rounded-[4px] font-semibold text-[12px] hover:bg-white transition-colors">
                      Execute Routing
                   </button>
                   <button className="bg-transparent border border-[#2A2A2A] text-[#EDEDED] px-3 py-1.5 rounded-[4px] font-medium text-[12px] hover:bg-[#2A2A2A] transition-colors">
                      Dismiss
                   </button>
                </div>
             </div>
             
             <div className="p-4 bg-[#141414] border border-[#2A2A2A] rounded-[6px]">
                <div className="text-[11px] text-[#F5A623] font-bold tracking-widest uppercase mb-3">Vigilance</div>
                <div className="flex items-center gap-4 text-base font-semibold text-[#EDEDED]">
                   <span>Corniche Ouest</span>
                   <ArrowRight className="text-[#555555]" size={16} />
                   <span>Tour de l'Œuf</span>
                </div>
                <p className="text-[12px] mt-2 text-[#888888] leading-relaxed">
                  <strong className="text-[#EDEDED]">Action Required:</strong> Recommend opening secondary pathways.
                </p>
             </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="panel flex flex-col flex-1 min-h-[500px]">
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center gap-2">
            <GitMerge size={14} className="text-[#EDEDED]" />
            <h2 className="text-[13px] font-semibold text-[#EDEDED]">Global Capacity Syntax</h2>
          </div>
          
          <div className="p-4 flex flex-col gap-6">
             <div>
                <div className="flex justify-between text-[12px] font-medium mb-1.5">
                   <span className="text-[#EDEDED]">Stade Abdoulaye Wade</span>
                   <span className="text-[#E5484D]">92%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                   <div className="h-full bg-[#E5484D]" style={{width: '92%'}}></div>
                </div>
             </div>
             
             <div>
                <div className="flex justify-between text-[12px] font-medium mb-1.5">
                   <span className="text-[#EDEDED]">Corniche Ouest</span>
                   <span className="text-[#F5A623]">72%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                   <div className="h-full bg-[#F5A623]" style={{width: '72%'}}></div>
                </div>
             </div>
             
             <div>
                <div className="flex justify-between text-[12px] font-medium mb-1.5">
                   <span className="text-[#EDEDED]">Stade Iba Mar Diop</span>
                   <span className="text-[#10B981]">50%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                   <div className="h-full bg-[#10B981]" style={{width: '50%'}}></div>
                </div>
             </div>
             
             <div>
                <div className="flex justify-between text-[12px] font-medium mb-1.5">
                   <span className="text-[#EDEDED]">Dakar Arena</span>
                   <span className="text-[#10B981]">13%</span>
                </div>
                <div className="h-1.5 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                   <div className="h-full bg-[#10B981]" style={{width: '13%'}}></div>
                </div>
                <div className="text-[10px] text-[#555555] mt-2 tracking-wide uppercase">Massive availability detected</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
