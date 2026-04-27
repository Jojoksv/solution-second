// ─── Stadium Side Panel ────────────────────────────────────────────────────
// Foule | Poubelles | Alertes tabs + simulation controls

import { useState } from 'react'
import type { SimStore } from '@/stores/simulationStore'

interface Props {
  sim: SimStore
  onClose: () => void
  onFlyToGate: (lat: number, lng: number) => void
  onFlyToBin: (lat: number, lng: number) => void
}

const PHASE_TICKS = [
  { tick: 0,  label: 'Début',           color: '#22c55e' },
  { tick: 6,  label: "Pic d'affluence", color: '#ef4444' },
  { tick: 14, label: 'Match',           color: '#f97316' },
  { tick: 18, label: 'Post',            color: '#eab308' },
]

export function StadiumPanel({ sim, onClose, onFlyToGate, onFlyToBin }: Props) {
  const [activeTab, setActiveTab] = useState<'crowd' | 'bins' | 'alerts'>('crowd')
  const { snapshot, tick, isPlaying, speed, setTick, toggle, reset, goToPeak, setSpeed } = sim

  const alertCount = snapshot.alerts.length
  const criticalBins = snapshot.bins.filter(b => b.alert).length
  const sortedBins = [...snapshot.bins].sort((a, b) => b.fillPercent - a.fillPercent)

  return (
    <aside className="absolute top-0 right-0 h-full w-[360px] z-[500] flex flex-col bg-[#03050a] border-l border-[#0f1827]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#0f1827]">
        <div className="flex items-center gap-2.5">
          <div className="relative w-2.5 h-2.5">
            <div className="absolute inset-0 rounded-full bg-[#f5c842] animate-ping opacity-50" />
            <div className="absolute inset-0 rounded-full bg-[#f5c842]" />
          </div>
          <div>
            <div className="text-[13px] font-bold text-[#ededed] leading-tight">Stade Iba Mar Diop</div>
            <div className="text-[10px] font-mono text-[#4a6080] mt-0.5">
              Dakar · JOJ 2026 · Live Monitor
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded text-[#4a6080] hover:text-[#ededed] hover:bg-[#0f1827] transition-colors text-[14px] font-bold"
        >
          ✕
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-4 border-b border-[#0f1827]">
        {[
          {
            label: 'Personnes',
            value: snapshot.totalCrowd.toLocaleString('fr-FR'),
            color: '#00d4aa',
          },
          {
            label: 'Occupation',
            value: `${snapshot.occupancyRate}%`,
            color: snapshot.occupancyRate > 75 ? '#ef4444' : snapshot.occupancyRate > 50 ? '#f97316' : '#22c55e',
          },
          {
            label: 'Poubelles',
            value: criticalBins.toString(),
            color: criticalBins > 0 ? '#ef4444' : '#22c55e',
          },
          {
            label: 'Alertes',
            value: alertCount.toString(),
            color: alertCount > 0 ? '#ef4444' : '#4a6080',
          },
        ].map(kpi => (
          <div
            key={kpi.label}
            className="flex flex-col items-center justify-center py-2.5 border-r border-[#0f1827] last:border-0"
          >
            <div className="text-[15px] font-bold font-mono leading-tight" style={{ color: kpi.color }}>
              {kpi.value}
            </div>
            <div className="text-[8px] text-[#4a6080] uppercase tracking-wider mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Phase badge ── */}
      <div
        className="flex items-center justify-between px-4 py-1.5 border-b border-[#0f1827] text-[10px] font-mono"
        style={{ background: snapshot.phase.color + '12' }}
      >
        <span style={{ color: snapshot.phase.color }} className="font-semibold uppercase tracking-wide">
          ● {snapshot.phase.label}
        </span>
        <span className="text-[#4a6080]">Tick {snapshot.realTick} / 200</span>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-[#0f1827]">
        {[
          { id: 'crowd'  as const, label: 'Foule' },
          { id: 'bins'   as const, label: `Poubelles${criticalBins > 0 ? ` (${criticalBins})` : ''}` },
          { id: 'alerts' as const, label: `Alertes${alertCount > 0 ? ` (${alertCount})` : ''}` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? 'border-b-2 border-[#f5c842] text-[#f5c842]'
                : 'text-[#4a6080] hover:text-[#8090a0]'
            }${tab.id === 'alerts' && alertCount > 0 && activeTab !== 'alerts' ? ' !text-[#ef4444]' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 overflow-y-auto">

        {/* CROWD TAB */}
        {activeTab === 'crowd' && (
          <div className="p-3 space-y-1.5">
            {snapshot.gates.map(gate => (
              <button
                key={gate.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors hover:bg-[#0f1827] border border-transparent hover:border-[#1a2a3a]"
                onClick={() => onFlyToGate(gate.lat, gate.lng)}
              >
                {/* Density indicator dot */}
                <div
                  className="w-2 h-2 rounded-full flex-none ring-2 ring-offset-1 ring-offset-[#03050a]"
                  style={{ background: gate.color, boxShadow: `0 0 6px ${gate.color}80` }}
                />

                {/* Gate info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-[#cedde8] truncate leading-tight">
                    {gate.name}
                  </div>
                  <div className="text-[9px] text-[#4a6080] font-mono mt-0.5">
                    Cap. {gate.capacity.toLocaleString('fr-FR')}
                  </div>
                </div>

                {/* Density bar + percentage */}
                <div className="flex flex-col items-end gap-1 w-16 flex-none">
                  <div className="text-[12px] font-bold font-mono" style={{ color: gate.color }}>
                    {Math.round(gate.density * 100)}%
                  </div>
                  <div className="w-full bg-[#0f1827] rounded-full h-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${Math.round(gate.density * 100)}%`, background: gate.color }}
                    />
                  </div>
                  <div className="text-[8px] text-[#4a6080] font-mono">
                    {gate.crowdCount.toLocaleString('fr-FR')} pers.
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* BINS TAB */}
        {activeTab === 'bins' && (
          <div className="p-3 space-y-2">
            {sortedBins.map(bin => (
              <button
                key={bin.id}
                className={`w-full rounded-md p-3 text-left transition-all border ${
                  bin.alert
                    ? 'bg-[#1a0a0a] border-[#ef4444]/30 bin-alert-card'
                    : 'bg-[#070b10] border-[#0f1827] hover:border-[#1a2a3a] hover:bg-[#0d1420]'
                }`}
                onClick={() => onFlyToBin(bin.lat, bin.lng)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]">
                      {bin.level === 'critical' ? '🚨' : bin.level === 'high' ? '⚠️' : bin.level === 'moderate' ? '🟡' : '✅'}
                    </span>
                    <span className="text-[11px] font-semibold text-[#cedde8]">{bin.label}</span>
                  </div>
                  {bin.alert && (
                    <span className="text-[8px] bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30 rounded px-1.5 py-0.5 font-bold uppercase tracking-wide">
                      Alerte
                    </span>
                  )}
                </div>

                {/* Fill bar */}
                <div className="bg-[#0d1420] rounded h-2 overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded transition-all duration-700"
                    style={{ width: `${bin.fillPercent}%`, background: bin.color, boxShadow: bin.alert ? `0 0 4px ${bin.color}` : 'none' }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-[#4a6080] font-mono">
                    {bin.currentLiters}L / {bin.maxLiters}L
                  </span>
                  <span className="text-[12px] font-bold font-mono" style={{ color: bin.color }}>
                    {bin.fillPercent}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ALERTS TAB */}
        {activeTab === 'alerts' && (
          <div className="p-3 space-y-2">
            {snapshot.alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="text-[32px] mb-3">✅</div>
                <div className="text-[12px] font-semibold text-[#4a6080]">Aucune alerte active</div>
                <div className="text-[10px] text-[#2a3a4a] mt-1">Situation nominale — surveillance continue</div>
              </div>
            ) : (
              snapshot.alerts.map(alert => (
                <div
                  key={alert.id}
                  className={`rounded-md p-3 border ${
                    alert.severity === 'critical'
                      ? 'bg-[#1a0808] border-[#ef4444]/35'
                      : 'bg-[#130e04] border-[#f97316]/25'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-[14px] flex-none mt-0.5">
                      {alert.type === 'bin' ? '🗑️' : '👥'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[11px] font-semibold text-[#ededed] truncate">{alert.name}</span>
                        <span
                          className={`ml-auto text-[7px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border flex-none ${
                            alert.severity === 'critical'
                              ? 'text-[#ef4444] bg-[#ef4444]/10 border-[#ef4444]/30'
                              : 'text-[#f97316] bg-[#f97316]/10 border-[#f97316]/30'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#4a6080] font-mono leading-relaxed">
                        {alert.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Simulation Controls ── */}
      <div className="border-t border-[#0f1827] p-3 space-y-2.5 bg-[#03050a]">

        {/* Play controls row */}
        <div className="flex items-center gap-2">
          <button
            onClick={reset}
            title="Retour au début"
            className="w-8 h-8 flex items-center justify-center rounded-md bg-[#0f1827] hover:bg-[#1a2235] border border-[#1a2235] text-[#4a6080] hover:text-[#ededed] transition-colors text-sm"
          >
            ⏮
          </button>
          <button
            onClick={toggle}
            className={`flex-1 h-8 rounded-md font-bold text-[11px] uppercase tracking-wider transition-all border ${
              isPlaying
                ? 'bg-[#f5c842]/10 hover:bg-[#f5c842]/20 border-[#f5c842]/40 text-[#f5c842]'
                : 'bg-[#f5c842]/15 hover:bg-[#f5c842]/25 border-[#f5c842]/30 text-[#f5c842]'
            }`}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button
            onClick={goToPeak}
            title="Sauter au pic d'affluence"
            className="px-2.5 h-8 rounded-md bg-[#0f1827] hover:bg-[#1a2235] border border-[#1a2235] text-[#4a6080] hover:text-[#ef4444] transition-colors text-[10px] font-bold uppercase tracking-wide"
          >
            ⚡Pic
          </button>
        </div>

        {/* Timeline slider */}
        <div className="flex items-center gap-2">
          <span className="text-[8px] text-[#2a3a4a] font-mono w-5">0</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min={0}
              max={40}
              value={tick}
              onChange={e => setTick(Number(e.target.value))}
              className="w-full h-1 cursor-pointer sim-slider"
            />
            {/* Phase markers */}
            <div className="absolute inset-x-0 -bottom-3 flex justify-between pointer-events-none">
              {PHASE_TICKS.map(pt => (
                <div
                  key={pt.tick}
                  className="absolute w-0.5 h-1.5 rounded-full"
                  style={{ left: `${(pt.tick / 40) * 100}%`, background: pt.color }}
                />
              ))}
            </div>
          </div>
          <span className="text-[8px] text-[#2a3a4a] font-mono w-6 text-right">200</span>
        </div>

        {/* Speed selector */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[8px] text-[#2a3a4a] uppercase tracking-wide mr-1">Vitesse</span>
          {[0.5, 1, 2, 4].map(s => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`flex-1 h-6 rounded text-[9px] font-bold transition-all border ${
                speed === s
                  ? 'bg-[#f5c842]/15 text-[#f5c842] border-[#f5c842]/40'
                  : 'bg-[#0f1827] text-[#4a6080] border-[#0f1827] hover:text-[#8090a0] hover:border-[#1a2235]'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
