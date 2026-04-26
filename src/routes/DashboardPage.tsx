// ─── DashboardPage (legacy multi-panel route) ─────────────────────────────
// Sidebar + Topbar are now provided by __root.tsx — this file only renders
// the dashboard grid content.

import { createFileRoute } from '@tanstack/react-router'
import { MapPanel } from '@/components/map/Mappanel'
import { AlertsPanel } from '@/components/alerts/AlertsPanel'
import { DensityChart } from '@/components/chart/DensityChart'
import { GreenPanel } from '@/components/green/GreenPanel'

export const Route = createFileRoute('/DashboardPage')({
  component: DashboardPage,
})

export function DashboardPage() {
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-4 h-full min-h-[700px]">
      <div className="panel flex flex-col overflow-hidden">
        <MapPanel />
      </div>
      <div className="panel flex flex-col overflow-hidden">
        <AlertsPanel />
      </div>
      <div className="panel flex flex-col overflow-hidden">
        <DensityChart />
      </div>
      <div className="panel flex flex-col overflow-hidden">
        <GreenPanel />
      </div>
    </div>
  )
}
