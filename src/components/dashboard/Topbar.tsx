import { Search, Bell, ShieldAlert, Wifi } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchRiskIndex } from "@/api";

export function Topbar() {
  const { data: riskIndex } = useQuery({
    queryKey: ["risk-index"],
    queryFn: fetchRiskIndex,
    refetchInterval: 3000,
  });

  const isCritical = riskIndex?.level === 'critical' || riskIndex?.level === 'alert';

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-6 border-b border-[#2A2A2A] bg-[#0A0A0A]">
      
      {/* Search Bar */}
      <div className="flex items-center w-[300px] h-8 bg-[#111111] border border-[#2A2A2A] rounded-[4px] px-3 focus-within:border-[#3A3A3A] transition-colors">
        <Search size={14} className="text-[#555555] mr-2" />
        <input 
          type="text" 
          placeholder="Search sites, sensors or alerts..." 
          className="bg-transparent border-none outline-none text-[13px] text-[#EDEDED] w-full placeholder:text-[#555555]"
        />
        <div className="flex items-center gap-1">
          <kbd className="hidden md:inline-flex text-[10px] bg-[#1A1A1A] text-[#888888] px-1.5 py-0.5 rounded border border-[#2A2A2A] font-sans">⌘</kbd>
          <kbd className="hidden md:inline-flex text-[10px] bg-[#1A1A1A] text-[#888888] px-1.5 py-0.5 rounded border border-[#2A2A2A] font-sans">K</kbd>
        </div>
      </div>

      {/* Right Side Tools */}
      <div className="flex items-center gap-4">
        
        {/* System Health Status */}
        <div className="flex items-center gap-2 px-3 h-8 bg-[#111111] border border-[#2A2A2A] rounded-[4px]">
          <div className="flex items-center gap-1.5">
            <Wifi size={12} className="text-[#10B981]" />
            <span className="text-[12px] font-medium text-[#888888]">All Systems Operational</span>
          </div>
        </div>

        {/* Risk Index Badge */}
        <div className={`flex items-center gap-2 px-3 h-8 border rounded-[4px] ${isCritical ? 'bg-[#E5484D]/10 border-[#E5484D]/30 text-[#E5484D]' : 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]'}`}>
          <ShieldAlert size={14} />
          <span className="text-[12px] font-bold">IRG: {riskIndex?.score ?? 0}</span>
        </div>

      </div>
    </header>
  );
}