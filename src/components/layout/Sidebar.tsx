import { Activity, Map as MapIcon, Bell, Leaf, ArrowLeftRight, Settings, Command } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function Sidebar() {
  return (
    <aside className="w-[240px] gradient-background shadow-2xl border-r border-[#2A2A2A] flex flex-col h-full flex-shrink-0 z-50">
      {/* Brand Header */}
      <div className="h-14 flex items-center px-4 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-white text-black flex items-center justify-center rounded-[4px]">
            <Command size={14} strokeWidth={3} />
          </div>
          <span className="text-white font-semibold text-[14px] tracking-tight">EcoFlow</span>
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
          </div>
        </div>
      </div>
    </aside>
  );
}
