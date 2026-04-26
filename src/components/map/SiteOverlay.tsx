import type { SiteData } from "@/types";
import { cityColor, fmt } from "@/lib/utils";

interface Props {
  site: SiteData | null;
  onClose: () => void;
}

export function SiteOverlay({ site, onClose }: Props) {
  return (
    <aside className={`absolute top-0 right-0 h-full w-[340px] bg-white border-l border-[#E5E7EB] z-[500] transform transition-transform duration-300 ease-in-out flex flex-col ${site ? "translate-x-0" : "translate-x-full"}`}>
      <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
        <strong className="text-[14px] text-[#111827]">{site?.site_name ?? "Vue détaillée du site"}</strong>
        <button className="text-[#9CA3AF] hover:text-[#374151] transition-colors" onClick={onClose}>✕</button>
      </div>

      {site && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="text-[13px] text-[#6B7280]">
              <span style={{ color: cityColor(site.city), fontWeight: "bold" }}>
                {site.city}
              </span>{" "}
              &bull; {site.crowd_type}
            </div>
            <div className="flex gap-4 text-[12px]">
              <span>
                <span className="text-[#FF6600]">Orange</span>
                {" > "}
                {site.site_thresholds?.orange_percent_gt ?? 65}%
              </span>
              <span>
                <span className="text-[#EF4444]">Rouge</span>
                {" > "}
                {site.site_thresholds?.red_percent_gt ?? 85}%
              </span>
            </div>
          </div>

          <div>
            <div className="text-[11px] text-[#6B7280] mb-3 uppercase tracking-wider font-semibold">
              Zones internes
            </div>
            <div className="grid grid-cols-2 gap-3">
              {site.zones.map((z, i) => {
                const statusColor = z.status === 'red'
                  ? 'text-[#EF4444] bg-[#EF4444]/8 border-[#EF4444]/20'
                  : z.status === 'orange'
                  ? 'text-[#FF6600] bg-[#FF6600]/8 border-[#FF6600]/20'
                  : 'text-[#10B981] bg-[#10B981]/8 border-[#10B981]/20'
                return (
                  <div className="bg-[#F9FAFB] border border-[#E5E7EB] p-3 rounded-[6px]" key={z.zone_name}>
                    <div className="text-[#9CA3AF] text-[10px] mb-1 font-mono">Z{i + 1}</div>
                    <div
                      className="font-semibold text-[#111827] text-[12px] mb-2 whitespace-nowrap overflow-hidden text-ellipsis"
                      title={z.zone_name}
                    >
                      {z.zone_name}
                    </div>
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-bold border rounded-[4px] ${statusColor}`}>
                      {z.occupancy_percentage}%
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div>
            <div className="text-[11px] text-[#6B7280] mb-3 uppercase tracking-wider font-semibold">
              Flux aux sorties
            </div>
            <div className="flex flex-col gap-2">
              {site.exits.map((e) => {
                const statusColor = e.status === 'red'
                  ? 'text-[#EF4444] bg-[#EF4444]/8 border-[#EF4444]/20'
                  : e.status === 'orange'
                  ? 'text-[#FF6600] bg-[#FF6600]/8 border-[#FF6600]/20'
                  : 'text-[#10B981] bg-[#10B981]/8 border-[#10B981]/20'
                return (
                  <div className="flex items-center justify-between bg-[#F9FAFB] border border-[#E5E7EB] p-3 rounded-[6px]" key={e.exit_name}>
                    <div className="flex flex-col gap-1">
                      <strong className="text-[12px] text-[#111827]">{e.exit_name}</strong>
                      <div className="text-[10px] text-[#6B7280] font-mono">
                        ↓ IN: {e.incoming_flow_per_min}/m &nbsp; ↑ OUT:{" "}
                        {e.outgoing_flow_per_min}/m
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-[4px] uppercase ${statusColor}`}>{e.status}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-[#FFF3EB] border border-[#FF6600]/25 p-3 rounded-[6px]">
            <strong className="text-[#FF6600] text-[12px] block mb-1">Action Recommandée :</strong>
            <span className="text-[13px] text-[#374151] leading-snug">
              {site.site_recommendation ?? "Maintenir supervision."}
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
