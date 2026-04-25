import { createFileRoute } from '@tanstack/react-router'
import { MapPanel } from '@/components/map/Mappanel'

export const Route = createFileRoute('/map')({
  component: MapPage,
})

export function MapPage() {
  return (
    <div className="flex flex-col h-full w-full max-w-[1600px] mx-auto gap-4">
      <div className="flex-none">
        <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">Carte Temps Réel</h1>
        <p className="text-[13px] text-[#888888] mt-1">
          Monitoring en direct de la densité de foule sur tous les sites via antennes SONATEL.
        </p>
      </div>

      <div className="flex-1 relative min-h-[600px] panel flex flex-col overflow-hidden">
        <MapPanel />
      </div>
    </div>
  )
}
