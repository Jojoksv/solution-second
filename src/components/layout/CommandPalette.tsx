// ─── Command Palette ──────────────────────────────────────────────────────
// Cmd+K / Ctrl+K global search across sites, alerts and zones.
// Filters in real time, navigates via TanStack Router.

import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Search, MapPin, Bell, Layers, ArrowRight, X } from 'lucide-react'
import { useDensity, useAlerts } from '@/hooks'

interface Props {
  open: boolean
  onClose: () => void
}

interface SearchResult {
  type: 'site' | 'alert' | 'zone'
  id: string
  title: string
  subtitle: string
  path: string
  color: string
}

export function CommandPalette({ open, onClose }: Props) {
  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const { data: density } = useDensity()
  const { data: alerts } = useAlerts()

  // ── Reset query / focus when opened ─────────────────────────────────────
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      // Defer focus to next tick (after modal is mounted)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  // ── Build searchable index ──────────────────────────────────────────────
  const allResults = useMemo<SearchResult[]>(() => {
    const out: SearchResult[] = []

    // Sites
    density?.sites.forEach(site => {
      out.push({
        type: 'site',
        id: site.site_id,
        title: site.site_name,
        subtitle: `${site.city} · ${site.occupancy_percentage}% · ${site.estimated_real_crowd.toLocaleString('fr-FR')} pers.`,
        path: '/map',
        color:
          site.status === 'red' ? '#E5484D' :
          site.status === 'orange' ? '#F5A623' : '#10B981',
      })
      // Zones nested under each site
      site.zones.forEach((zone, i) => {
        out.push({
          type: 'zone',
          id: `${site.site_id}-zone-${i}`,
          title: zone.zone_name,
          subtitle: `Zone · ${site.site_name} · ${zone.occupancy_percentage}%`,
          path: '/map',
          color:
            zone.status === 'red' ? '#E5484D' :
            zone.status === 'orange' ? '#F5A623' : '#10B981',
        })
      })
    })

    // Alerts
    alerts?.active_alerts.forEach(alert => {
      out.push({
        type: 'alert',
        id: alert.id,
        title: `Alerte · ${alert.site_name}`,
        subtitle: `${alert.alert_level.toUpperCase()} · ${alert.occupancy_percentage}% · ${alert.assigned_volunteer}`,
        path: '/alerts',
        color: alert.alert_level === 'red' ? '#E5484D' : '#F5A623',
      })
    })

    return out
  }, [density, alerts])

  // ── Filter results by query ─────────────────────────────────────────────
  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allResults.slice(0, 12)
    return allResults
      .filter(r => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q))
      .slice(0, 20)
  }, [allResults, query])

  // ── Group results by category for display ───────────────────────────────
  const grouped = useMemo(() => {
    const sites: SearchResult[] = []
    const zones: SearchResult[] = []
    const alertsR: SearchResult[] = []
    results.forEach(r => {
      if (r.type === 'site')  sites.push(r)
      if (r.type === 'zone')  zones.push(r)
      if (r.type === 'alert') alertsR.push(r)
    })
    return { sites, zones, alertsR }
  }, [results])

  // ── Reset active index when results change ──────────────────────────────
  useEffect(() => { setActiveIdx(0) }, [query])

  // ── Keyboard navigation (arrows + enter + escape) ───────────────────────
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx(i => Math.min(results.length - 1, i + 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx(i => Math.max(0, i - 1))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const r = results[activeIdx]
        if (r) handleSelect(r)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, results, activeIdx, onClose])

  function handleSelect(r: SearchResult) {
    navigate({ to: r.path })
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[1000] bg-[#000000]/80 backdrop-blur-sm flex items-start justify-center pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-[640px] max-w-[92vw] bg-[#0A0A0A] border border-[#2A2A2A] rounded-[8px] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 h-12 border-b border-[#2A2A2A]">
          <Search size={16} className="text-[#888888]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Chercher un site, une zone, une alerte…"
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#EDEDED] placeholder:text-[#555555]"
          />
          <kbd className="text-[10px] bg-[#1A1A1A] text-[#888888] px-1.5 py-0.5 rounded border border-[#2A2A2A] font-sans">ESC</kbd>
          <button onClick={onClose} className="text-[#555555] hover:text-[#EDEDED] transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-[24px] mb-2 opacity-50">🔍</div>
              <div className="text-[13px] text-[#888888]">Aucun résultat pour « {query} »</div>
            </div>
          ) : (
            <>
              {grouped.sites.length > 0 && (
                <ResultGroup
                  label="Sites"
                  icon={<MapPin size={11} />}
                  results={grouped.sites}
                  baseIdx={0}
                  activeIdx={activeIdx}
                  onSelect={handleSelect}
                />
              )}
              {grouped.zones.length > 0 && (
                <ResultGroup
                  label="Zones"
                  icon={<Layers size={11} />}
                  results={grouped.zones}
                  baseIdx={grouped.sites.length}
                  activeIdx={activeIdx}
                  onSelect={handleSelect}
                />
              )}
              {grouped.alertsR.length > 0 && (
                <ResultGroup
                  label="Alertes"
                  icon={<Bell size={11} />}
                  results={grouped.alertsR}
                  baseIdx={grouped.sites.length + grouped.zones.length}
                  activeIdx={activeIdx}
                  onSelect={handleSelect}
                />
              )}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 h-9 flex items-center justify-between border-t border-[#2A2A2A] bg-[#070707]">
          <div className="flex items-center gap-3 text-[10px] text-[#555555]">
            <span><kbd className="bg-[#1A1A1A] text-[#888888] px-1 rounded border border-[#2A2A2A]">↑↓</kbd> Navigation</span>
            <span><kbd className="bg-[#1A1A1A] text-[#888888] px-1 rounded border border-[#2A2A2A]">↵</kbd> Sélection</span>
          </div>
          <span className="text-[10px] text-[#555555] font-mono">{results.length} résultats</span>
        </div>
      </div>
    </div>
  )
}

// ─── Result group component ───────────────────────────────────────────────

interface GroupProps {
  label: string
  icon: React.ReactNode
  results: SearchResult[]
  baseIdx: number
  activeIdx: number
  onSelect: (r: SearchResult) => void
}

function ResultGroup({ label, icon, results, baseIdx, activeIdx, onSelect }: GroupProps) {
  return (
    <div>
      <div className="flex items-center gap-2 px-4 pt-3 pb-1.5 text-[10px] uppercase tracking-widest text-[#555555] font-bold">
        {icon}
        {label}
        <span className="text-[#333333]">({results.length})</span>
      </div>
      {results.map((r, i) => {
        const isActive = baseIdx + i === activeIdx
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
              isActive ? 'bg-[#141414]' : 'hover:bg-[#0F0F0F]'
            }`}
          >
            <div
              className="w-2 h-2 rounded-full flex-none"
              style={{ background: r.color, boxShadow: `0 0 6px ${r.color}80` }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-[#EDEDED] truncate">{r.title}</div>
              <div className="text-[11px] text-[#888888] truncate font-mono">{r.subtitle}</div>
            </div>
            <ArrowRight size={12} className={`flex-none transition-colors ${isActive ? 'text-[#EDEDED]' : 'text-[#555555]'}`} />
          </button>
        )
      })}
    </div>
  )
}
