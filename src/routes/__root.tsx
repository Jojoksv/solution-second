import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/dashboard/Topbar'
import { useTheme } from '@/stores/themeStore'

import '../styles.css'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { theme } = useTheme()

  return (
    <div className="flex h-screen gradient-background-vers2 text-[#EDEDED] font-sans overflow-hidden">
    <div
      className="flex h-screen overflow-hidden"
      data-theme={theme}
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: "'Inter', sans-serif" }}
    >
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main
          className="flex-1 overflow-y-auto p-6 relative"
          style={{ background: 'var(--bg-base)' }}
        >
          <Outlet />
        </main>
      </div>

      {/* Devtools */}
      <TanStackDevtools
        config={{ position: 'bottom-right' }}
        plugins={[{ name: 'TanStack Router', render: <TanStackRouterDevtoolsPanel /> }]}
      />
    </div>
  )
}
