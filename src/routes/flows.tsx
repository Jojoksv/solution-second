import { createFileRoute } from '@tanstack/react-router'
import { ArrowRight, AlertTriangle, GitMerge } from 'lucide-react'

export const Route = createFileRoute('/flows')({
  component: FlowsPage,
})

export function FlowsPage() {
  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto h-full pb-6">
      <div>
        <h1 className="text-xl font-semibold text-[#111827] tracking-tight">Contrôle des flux</h1>
        <p className="text-[13px] text-[#6B7280] mt-1">Recommandations de redirection et prévention des goulots d'étranglement.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1">

        {/* Main Panel */}
        <div className="panel flex flex-col flex-[2] min-h-[500px]">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2">
            <AlertTriangle size={14} className="text-[#FF6600]" />
            <h2 className="text-[13px] font-semibold text-[#111827]">Recommandations de routage actives</h2>
          </div>

          <div className="p-4 flex flex-col gap-4 overflow-y-auto">
            <div className="p-4 bg-[#FEF2F2] border border-[#EF4444]/25 rounded-[8px]">
              <div className="text-[11px] text-[#EF4444] font-bold tracking-widest uppercase mb-3">Capacité critique</div>
              <div className="flex items-center gap-4 text-base font-semibold text-[#111827]">
                <span>Stade A. Wade</span>
                <ArrowRight className="text-[#9CA3AF]" size={16} />
                <span className="text-[#10B981]">Dakar Arena</span>
              </div>
              <p className="text-[12px] mt-2 text-[#6B7280] leading-relaxed">
                <strong className="text-[#111827]">Action requise :</strong> Rediriger 4 000 spectateurs vers Dakar Arena (9 000 places disponibles).<br/>
                <strong className="text-[#111827]">Vecteur :</strong> Déployer +2 rames TER / heure.
              </p>
              <div className="mt-4 flex gap-2">
                <button className="bg-[#111827] text-white px-3 py-1.5 rounded-[6px] font-semibold text-[12px] hover:bg-[#374151] transition-colors">
                  Exécuter le routage
                </button>
                <button className="bg-transparent border border-[#E5E7EB] text-[#6B7280] px-3 py-1.5 rounded-[6px] font-medium text-[12px] hover:bg-[#F4F5F7] transition-colors">
                  Ignorer
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#FFF7ED] border border-[#FF6600]/20 rounded-[8px]">
              <div className="text-[11px] text-[#FF6600] font-bold tracking-widest uppercase mb-3">Vigilance</div>
              <div className="flex items-center gap-4 text-base font-semibold text-[#111827]">
                <span>Corniche Ouest</span>
                <ArrowRight className="text-[#9CA3AF]" size={16} />
                <span>Tour de l'Œuf</span>
              </div>
              <p className="text-[12px] mt-2 text-[#6B7280] leading-relaxed">
                <strong className="text-[#111827]">Action requise :</strong> Recommander l'ouverture des voies secondaires.
              </p>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="panel flex flex-col flex-1 min-h-[500px]">
          <div className="px-4 py-3 border-b border-[#E5E7EB] flex items-center gap-2">
            <GitMerge size={14} className="text-[#374151]" />
            <h2 className="text-[13px] font-semibold text-[#111827]">Capacité globale des sites</h2>
          </div>

          <div className="p-4 flex flex-col gap-6">
            {[
              { name: 'Stade Abdoulaye Wade', pct: 92, color: '#EF4444' },
              { name: 'Corniche Ouest', pct: 72, color: '#FF6600' },
              { name: 'Stade Iba Mar Diop', pct: 50, color: '#10B981' },
              { name: 'Dakar Arena', pct: 13, color: '#10B981', note: 'Forte disponibilité détectée' },
            ].map(({ name, pct, color, note }) => (
              <div key={name}>
                <div className="flex justify-between text-[12px] font-medium mb-1.5">
                  <span className="text-[#111827]">{name}</span>
                  <span style={{ color }}>{pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
                {note && <div className="text-[10px] text-[#9CA3AF] mt-1.5 tracking-wide uppercase">{note}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
