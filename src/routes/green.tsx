import { createFileRoute } from '@tanstack/react-router'
import { GreenPanel } from '@/components/green/GreenPanel'
import { Leaf, Award, BarChart2 } from 'lucide-react'

export const Route = createFileRoute('/green')({
  component: GreenPage,
})

export function GreenPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto h-full pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">Smart Green</h1>
        <p className="text-[13px] text-[#888888] mt-1">Participatory waste management via QR Codes and gamification.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1">
        {/* Main Panel */}
        <div className="panel flex flex-col flex-[2] min-h-[500px]">
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center gap-2">
            <Leaf size={14} className="text-[#10B981]" />
            <h2 className="text-[13px] font-semibold text-[#EDEDED]">Waste Bin Status & Grid</h2>
          </div>
          <div className="p-4 flex flex-col flex-1 overflow-hidden">
             <div className="flex-1 overflow-y-auto pr-2">
                <GreenPanel />
             </div>
          </div>
        </div>
        
        {/* Side Panel */}
        <div className="flex flex-col flex-1 gap-4">
          
          <div className="panel flex flex-col">
            <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center gap-2">
              <Award size={14} className="text-[#F5A623]" />
              <h2 className="text-[13px] font-semibold text-[#EDEDED]">Participant Leaderboard</h2>
            </div>
            <div className="p-4">
              <ul className="flex flex-col gap-2">
                 <li className="flex items-center gap-3 p-3 rounded-[4px] bg-[#141414] border border-[#F5A623]/30">
                   <div className="text-[14px] font-bold text-[#F5A623] w-4 text-center">1</div>
                   <div className="flex-1 flex flex-col">
                     <strong className="text-[13px] text-[#EDEDED] font-medium leading-none">77 654 ** **</strong>
                     <span className="text-[11px] text-[#F5A623] mt-1">Eco-Hero Badge</span>
                   </div>
                   <div className="text-[12px] font-bold text-[#EDEDED]">145 pts</div>
                 </li>
                 <li className="flex items-center gap-3 p-3 rounded-[4px] bg-[#141414] border border-[#2A2A2A]">
                   <div className="text-[14px] font-bold text-[#888888] w-4 text-center">2</div>
                   <div className="flex-1 flex flex-col">
                     <strong className="text-[13px] text-[#EDEDED] font-medium leading-none">78 123 ** **</strong>
                     <span className="text-[11px] text-[#10B981] mt-1">Eco-Actor</span>
                   </div>
                   <div className="text-[12px] font-bold text-[#EDEDED]">85 pts</div>
                 </li>
                 <li className="flex items-center gap-3 p-3 rounded-[4px] bg-[#141414] border border-[#2A2A2A]">
                   <div className="text-[14px] font-bold text-[#888888] w-4 text-center">3</div>
                   <div className="flex-1 flex flex-col">
                     <strong className="text-[13px] text-[#EDEDED] font-medium leading-none">76 999 ** **</strong>
                     <span className="text-[11px] text-[#888888] mt-1">Green Participant</span>
                   </div>
                   <div className="text-[12px] font-bold text-[#EDEDED]">40 pts</div>
                 </li>
              </ul>
            </div>
          </div>

          <div className="panel flex flex-col">
            <div className="px-4 py-3 border-b border-[#2A2A2A] flex items-center gap-2">
              <BarChart2 size={14} className="text-[#EDEDED]" />
              <h2 className="text-[13px] font-semibold text-[#EDEDED]">Daily Statistics</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
               <div className="p-3 bg-[#141414] border border-[#2A2A2A] rounded-[4px] text-center">
                 <div className="text-xl font-semibold text-[#10B981]">184</div>
                 <div className="text-[11px] mt-1 text-[#888888] uppercase tracking-wide">Valid Reports</div>
               </div>
               <div className="p-3 bg-[#141414] border border-[#2A2A2A] rounded-[4px] text-center">
                 <div className="text-xl font-semibold text-[#E5484D]">12</div>
                 <div className="text-[11px] mt-1 text-[#888888] uppercase tracking-wide">False Positives</div>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
