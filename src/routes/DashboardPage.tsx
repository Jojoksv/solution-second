import { createFileRoute } from '@tanstack/react-router'
import { Topbar } from '@/components/dashboard/Topbar'
import { MapPanel } from '@/components/map/Mappanel'
import { AlertsPanel } from '@/components/alerts/AlertsPanel'
import { DensityChart } from '@/components/chart/DensityChart'
import { GreenPanel } from '@/components/green/GreenPanel'

export const Route = createFileRoute('/DashboardPage')({
  component: DashboardPage,
})

export function DashboardPage() {
  return (
    <main className="dashboard">
      <Topbar />
      <MapPanel />
      <AlertsPanel />
      <DensityChart />
      <GreenPanel />
    </main>
  )
}
