// ─── Command Palette ──────────────────────────────────────────────────────
// Cmd+K / Ctrl+K global search across sites, alerts and zones.

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

  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      setTimeout(() => inputRef.current?.focus(), 30)
    }
  }, [open])

  const allResults = useMemo<SearchResult[]>(() => {
    const out: SearchResult[] = []

    density?.sites.forEach(site => {
      out.push({
        type: 'site',
        id: site.site_id,
        title: site.site_name,
        subtitle: `${site.city} · ${site.occupancy_percentage}% · ${site.estimated_real_crowd.toLocaleString('fr-FR')} pers.`,
        path: '/map',
        color:
          site.status === 'red' ? '#EF4444' :
          site.status === 'orange' ? '#FF6600' : '#10B981',
      })
      site.zones.forEach((zone, i) => {
        out.push({
          type: 'zone',
          id: `${site.site_id}-zone-${i}`,
          title: zone.zone_name,
          subtitle: `Zone · ${site.site_name} · ${zone.occupancy_percentage}%`,
          path: '/map',
          color:
            zone.status === 'red' ? '#EF4444' :
            zone.status === 'orange' ? '#FF6600' : '#10B981',
        })
      })
    })

    alerts?.active_alerts.forEach(alert => {
      out.push({
        type: 'alert',
        id: alert.id,
        title: `Alerte · ${alert.site_name}`,
        subtitle: `${alert.alert_level.toUpperCase()} · ${alert.occupancy_percentage}% · ${alert.assigned_volunteer}`,
        path: '/alerts',
        color: alert.alert_level === 'red' ? '#EF4444' : '#FF6600',
      })
    })

    return out
  }, [density, alerts])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allResults.slice(0, 12)
    return allResults
      .filter(r => r.title.toLowerCase().includes(q) || r.subtitle.toLowerCase().includes(q))
      .slice(0, 20)
  }, [allResults, query])

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

  useEffect(() => { setActiveIdx(0) }, [query])

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(results.length - 1, i + 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(0, i - 1)) }
      if (e.key === 'Enter') { e.preventDefault(); const r = results[activeIdx]; if (r) handleSelect(r) }
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
      className="fixed inset-0 z-[1000] bg-[#111827]/50 backdrop-blur-sm flex items-start justify-center pt-[12vh]"
      onClick={onClose}
    >
      <div
        className="w-[640px] max-w-[92vw] bg-white border border-[#E5E7EB] rounded-[10px] shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 h-12 border-b border-[#E5E7EB]">
          <Search size={16} className="text-[#9CA3AF]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Chercher un site, une zone, une alerte…"
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-[#111827] placeholder:text-[#9CA3AF]"
          />
          <kbd className="text-[10px] bg-[#F4F5F7] text-[#6B7280] px-1.5 py-0.5 rounded border border-[#E5E7EB] font-sans">ESC</kbd>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#374151] transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Results list */}
        <div className="max-h-[60vh] overflow-y-auto">
          {results.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-[24px] mb-2 opacity-50">🔍</div>
              <div className="text-[13px] text-[#6B7280]">Aucun résultat pour « {query} »</div>
            </div>
          ) : (
            <>
              {grouped.sites.length > 0 && (
                <ResultGroup label="Sites" icon={<MapPin size={11} />} results={grouped.sites}
                  baseIdx={0} activeIdx={activeIdx} onSelect={handleSelect} />
              )}
              {grouped.zones.length > 0 && (
                <ResultGroup label="Zones" icon={<Layers size={11} />} results={grouped.zones}
                  baseIdx={grouped.sites.length} activeIdx={activeIdx} onSelect={handleSelect} />
              )}
              {grouped.alertsR.length > 0 && (
                <ResultGroup label="Alertes" icon={<Bell size={11} />} results={grouped.alertsR}
                  baseIdx={grouped.sites.length + grouped.zones.length} activeIdx={activeIdx} onSelect={handleSelect} />
              )}
            </>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 h-9 flex items-center justify-between border-t border-[#E5E7EB] bg-[#F9FAFB]">
          <div className="flex items-center gap-3 text-[10px] text-[#9CA3AF]">
            <span><kbd className="bg-white text-[#6B7280] px-1 rounded border border-[#E5E7EB]">↑↓</kbd> Navigation</span>
            <span><kbd className="bg-white text-[#6B7280] px-1 rounded border border-[#E5E7EB]">↵</kbd> Sélection</span>
          </div>
          <span className="text-[10px] text-[#9CA3AF] font-mono">{results.length} résultats</span>
        </div>
      </div>
    </div>
  )
}

// ─── Result group component ────────────────────────────────────────────────

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
      <div className="flex items-center gap-2 px-4 pt-3 pb-1.5 text-[10px] uppercase tracking-widest text-[#9CA3AF] font-bold">
        {icon}
        {label}
        <span className="text-[#D1D5DB]">({results.length})</span>
      </div>
      {results.map((r, i) => {
        const isActive = baseIdx + i === activeIdx
        return (
          <button
            key={r.id}
            onClick={() => onSelect(r)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
              isActive ? 'bg-[#F4F5F7]' : 'hover:bg-[#F9FAFB]'
            }`}
          >
            <div
              className="w-2 h-2 rounded-full flex-none"
              style={{ background: r.color, boxShadow: `0 0 5px ${r.color}70` }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-[#111827] truncate">{r.title}</div>
              <div className="text-[11px] text-[#6B7280] truncate font-mono">{r.subtitle}</div>
            </div>
            <ArrowRight size={12} className={`flex-none transition-colors ${isActive ? 'text-[#374151]' : 'text-[#D1D5DB]'}`} />
          </button>
        )
      })}
    </div>
  )
}
