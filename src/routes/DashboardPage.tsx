import { createFileRoute } from '@tanstack/react-router'
import { Topbar } from '@/components/dashboard/Topbar'
import { MapPanel } from '@/components/map/Mappanel'
import { AlertsPanel } from '@/components/alerts/AlertsPanel'
import { DensityChart } from '@/components/chart/DensityChart'
import { GreenPanel } from '@/components/green/GreenPanel'
import { Sidebar } from '@/components/layout/Sidebar'

export const Route = createFileRoute('/DashboardPage')({
  component: DashboardPage,
})

export function DashboardPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="dashboard-content">
        <Topbar />
        <div className="dashboard-grid">
          <MapPanel />
          <AlertsPanel />
          <DensityChart />
          <GreenPanel />
        </div>
      </main>
    </div>
  )
}
