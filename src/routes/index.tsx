import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Activity, Users, Radio, AlertTriangle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchDensity } from '@/api'
import { useDemoState } from '@/stores/demoStore'
import { DensityChart } from '@/components/chart/DensityChart'
import { fmt } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: DashboardOverview,
})

function StatCard({ title, value, icon: Icon, trend, isAlert = false }: any) {
  return (
    <div className="panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className={isAlert ? 'text-[#E5484D]' : 'text-[#888888]'} />
          <span className="text-[12px] font-medium text-[#888888] tracking-wide uppercase">{title}</span>
        </div>
      </div>
      <div className="flex items-end justify-between mt-1">
        <span className={`text-2xl font-semibold tracking-tight ${isAlert ? 'text-[#E5484D]' : 'text-[#EDEDED]'}`}>
          {value}
        </span>
        {trend && (
          <div className="flex items-center gap-1 bg-[#141414] px-1.5 py-0.5 rounded-[4px] border border-[#2A2A2A]">
            <span className={`text-[11px] font-medium ${trend.startsWith('+') ? 'text-[#10B981]' : 'text-[#E5484D]'}`}>
              {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export function DashboardOverview() {
  const demoActive = useDemoState();
  const { data: density } = useQuery({
    queryKey: ['density'],
    queryFn: fetchDensity,
    refetchInterval: 3000,
  });

  const totalPeople = density?.global_metrics.total_estimated_people ?? 0;
  const sitesAlert = density?.global_metrics.sites_in_alert ?? 0;
  const activeSensors = 142; // Simulated

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#EDEDED] tracking-tight">Overview</h1>
        <p className="text-[13px] text-[#888888] mt-1">Real-time metrics from all deployed sensors.</p>
      </div>

      {/* 4x4 Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Crowd Count" 
          value={fmt(totalPeople)} 
          icon={Users} 
          trend="+5.2%" 
        />
        <StatCard 
          title="Active Sensors" 
          value={activeSensors} 
          icon={Radio} 
          trend="99.9%" 
        />
        <StatCard 
          title="Alerts Triggered" 
          value={sitesAlert} 
          icon={AlertTriangle} 
          trend={sitesAlert > 0 ? "+2" : "0"} 
          isAlert={sitesAlert > 0}
        />
        <StatCard 
          title="System Load" 
          value="42%" 
          icon={Activity} 
          trend="-1.5%" 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Chart Section */}
        <div className="lg:col-span-2 panel flex flex-col min-h-[400px]">
          <div className="px-4 py-3 border-b border-[#2A2A2A]">
            <h2 className="text-[13px] font-semibold text-[#EDEDED]">Crowd Density Simulation</h2>
          </div>
          <div className="p-4 flex-1">
            <DensityChart />
          </div>
        </div>

        {/* Activity Log / Sensors */}
        <div className="panel flex flex-col min-h-[400px]">
          <div className="px-4 py-3 border-b border-[#2A2A2A] flex justify-between items-center">
            <h2 className="text-[13px] font-semibold text-[#EDEDED]">Sensor Streams</h2>
            <div className="w-2 h-2 rounded-full bg-[#10B981] status-pulse-green"></div>
          </div>
          <div className="p-0 flex-1 overflow-y-auto">
             {/* We will build the SensorSimulationPanel here */}
             <SensorSimulationPanel />
          </div>
        </div>
      </div>
    </div>
  )
}


const MOCK_MESSAGES = [
  { msg: 'Data packet received: S-14A', status: 'ok' },
  { msg: 'Density threshold normal: Zone 2', status: 'ok' },
  { msg: 'Latency spike detected (42ms)', status: 'warn' },
  { msg: 'New connection: Gate B', status: 'ok' },
  { msg: 'Sensor calibration complete', status: 'ok' },
  { msg: 'Flow rate stabilized at Gate C', status: 'ok' },
  { msg: 'Syncing with upstream node', status: 'ok' },
  { msg: 'Minor packet loss recovered', status: 'warn' },
]

function SensorSimulationPanel() {
  const [logs, setLogs] = useState([
    { id: 100, time: new Date(), msg: 'System initialized', status: 'ok' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(prev => {
        const randomMsg = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];
        const newLog = {
          id: Date.now(),
          time: new Date(),
          msg: randomMsg.msg,
          status: randomMsg.status
        };
        // Keep only last 20
        return [newLog, ...prev].slice(0, 20);
      });
    }, 2500 + Math.random() * 2000); // Random interval between 2.5s and 4.5s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col">
      {logs.map((log) => {
        // Format time nicely e.g., 14:02:33
        const timeStr = log.time.toLocaleTimeString([], { hour12: false });
        
        return (
          <div key={log.id} className="flex items-start gap-3 px-4 py-3 border-b border-[#2A2A2A] last:border-0 hover:bg-[#141414] transition-colors animate-in fade-in slide-in-from-top-2 duration-300">
            <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${log.status === 'warn' ? 'bg-[#F5A623]' : 'bg-[#10B981]'}`}></div>
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#EDEDED] leading-snug">{log.msg}</span>
                <span className="text-[10px] text-[#555555] font-mono">{timeStr}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}