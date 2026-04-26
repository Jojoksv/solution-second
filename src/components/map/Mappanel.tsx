// ─── MapPanel ─────────────────────────────────────────────────────────────
// Manages the Leaflet map lifecycle imperatively inside a React component.
// Two modes:
//   • Global view  — all JOJ sites, crowd markers, Smart Green markers
//   • Stadium view — Stade Iba Mar Diop detail simulation (polygon + gates + persons + bins)

import { useEffect, useRef, useState } from 'react'
import type { Map as LMap, LayerGroup, CircleMarker } from 'leaflet'
import { useDensity, useGreen } from '@/hooks'
import { useDemoState } from '@/stores/demoStore'
import {
  useSimulationStore,
  simPause,
} from '@/stores/simulationStore'
import {
  STADIUM_CENTER,
  STADIUM_POLYGON,
  STADIUM_ZOOM_DETAIL,
  STADIUM_ZOOM_GLOBAL,
} from '@/lib/stadiumSimulation'
import { fmt } from '@/lib/utils'
import { SiteOverlay } from './SiteOverlay'
import { StadiumPanel } from './StadiumPanel'
import { ToastNotifications } from './ToastNotifications'
import type { SiteData } from '@/types'
import type { SimAlert, GateState, BinState } from '@/lib/stadiumSimulation'

// Leaflet is loaded via CDN in index.html
// leaflet-heat extends L.heatLayer at runtime
declare const L: typeof import('leaflet') & {
  heatLayer: (
    points: Array<[number, number, number?]>,
    options?: { radius?: number; blur?: number; maxZoom?: number; max?: number; gradient?: Record<number, string> }
  ) => L.Layer
}

const TRASH_SVG = `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`

export function MapPanel() {
  const demoActive = useDemoState()
  const { data: density } = useDensity(demoActive)
  const { data: green } = useGreen(demoActive)
  const sim = useSimulationStore()

  // ── Leaflet refs ───────────────────────────────────────────────────────
  const mapDivRef     = useRef<HTMLDivElement>(null)
  const mapRef        = useRef<LMap | null>(null)
  const markerLayer   = useRef<LayerGroup | null>(null)
  const greenLayer    = useRef<LayerGroup | null>(null)
  const stadiumLayer  = useRef<LayerGroup | null>(null)   // static: polygon
  const gatesLayer    = useRef<LayerGroup | null>(null)   // updated per tick
  const personsLayer  = useRef<LayerGroup | null>(null)   // updated per tick (canvas)
  const binsLayer     = useRef<LayerGroup | null>(null)   // updated per tick
  const heatLayerRef  = useRef<L.Layer | null>(null)      // stadium heatmap (toggle)
  const canvasRef     = useRef<L.Canvas | null>(null)

  // ── React state ────────────────────────────────────────────────────────
  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null)
  const [isStadiumMode, setIsStadiumMode] = useState(false)
  const [showHeatmap, setShowHeatmap] = useState(true)
  const [toasts, setToasts] = useState<SimAlert[]>([])
  const prevAlertIds = useRef<Set<string>>(new Set())

  // ── Init Leaflet once ──────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return

    const map = L.map(mapDivRef.current, { zoomControl: false }).setView(
      [14.715, -17.25],
      STADIUM_ZOOM_GLOBAL,
    )
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    markerLayer.current  = L.layerGroup().addTo(map)
    greenLayer.current   = L.layerGroup().addTo(map)
    stadiumLayer.current = L.layerGroup().addTo(map)
    gatesLayer.current   = L.layerGroup().addTo(map)
    personsLayer.current = L.layerGroup().addTo(map)
    binsLayer.current    = L.layerGroup().addTo(map)
    canvasRef.current    = L.canvas({ padding: 0.5 })
    mapRef.current       = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Global crowd markers ───────────────────────────────────────────────
  useEffect(() => {
    const layer = markerLayer.current
    if (!layer || !density?.sites || isStadiumMode) return

    layer.clearLayers()
    density.sites.forEach(site => {
      const color =
        site.status === 'red'    ? '#ef4444' :
        site.status === 'orange' ? '#ff6600' : '#10b981'

      // Pulse ring (non-interactive)
      L.marker([site.latitude, site.longitude], {
        icon: L.divIcon({
          className: '',
          html: `<div class="pulse-wrapper"><div class="pulse-dot ${site.status}"></div></div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        }),
        interactive: false,
      }).addTo(layer)

      // Clickable circle
      const marker: CircleMarker = L.circleMarker(
        [site.latitude, site.longitude],
        { radius: 6, color: '#fff', weight: 1, fillColor: color, fillOpacity: 1 },
      )

      marker.bindPopup(`
        <div style="margin-bottom:8px;">
          <span style="color:${color};font-size:10px;text-transform:uppercase;font-weight:bold;letter-spacing:0.05em;">${site.city}</span><br>
          <strong style="font-size:15px;color:#111827;">${site.site_name}</strong>
        </div>
        <table style="width:100%;font-size:12px;border-collapse:collapse;">
          <tr style="border-bottom:1px solid #E5E7EB;"><td style="padding:4px 0;color:#6B7280;">Capacité</td><td style="text-align:right;font-weight:bold;color:#111827;">${fmt(site.capacity)}</td></tr>
          <tr style="border-bottom:1px solid #E5E7EB;"><td style="padding:4px 0;color:#6B7280;">Foule estimée</td><td style="text-align:right;font-weight:bold;color:#111827;">${fmt(site.estimated_real_crowd)}</td></tr>
          <tr><td style="padding:4px 0;color:#6B7280;">Densité</td><td style="text-align:right;font-weight:bold;color:${color};">${site.occupancy_percentage}%</td></tr>
        </table>
        ${site.site_id === 'iba_mar_diop'
          ? '<div style="margin-top:10px;text-align:center;font-size:10px;padding:4px 8px;background:#FF660015;border:1px solid #FF660040;border-radius:4px;color:#FF6600;font-weight:bold;">Cliquer pour la simulation complète →</div>'
          : '<div style="margin-top:8px;font-size:10px;color:#6B7280;text-align:center;">Cliquez pour voir le plan interne</div>'
        }
      `)

      marker.on('click', () => {
        if (site.site_id === 'iba_mar_diop') {
          enterStadiumMode()
        } else {
          setSelectedSite(site)
          mapRef.current?.flyTo([site.latitude, site.longitude], 14, { duration: 0.5 })
        }
      })
      marker.addTo(layer)
    })
  }, [density?.sites, isStadiumMode])

  // ── Smart Green global markers ─────────────────────────────────────────
  useEffect(() => {
    const layer = greenLayer.current
    if (!layer || !green?.sites || isStadiumMode) return

    layer.clearLayers()
    green.sites.forEach(site => {
      const lat = site.latitude + 0.002
      const lng = site.longitude + 0.002
      const alertBadge = site.early_crowd_alert
        ? `<div style="position:absolute;top:-8px;right:-8px;background:#F5A623;color:#000;border-radius:50%;width:14px;height:14px;font-size:9px;display:flex;align-items:center;justify-content:center;font-weight:bold;animation:map-pulse 2s infinite;">!</div>`
        : ''
      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;"><div class="green-icon ${site.site_fill_status}">${TRASH_SVG} ${site.max_fill_percentage}%</div>${alertBadge}</div>`,
        iconSize: [50, 24],
        iconAnchor: [0, 24],
      })
      L.marker([lat, lng], { icon })
        .bindPopup(`
          <strong style="color:#111827;font-size:13px;">Smart Green – ${site.site_name}</strong><br>
          ${site.early_crowd_alert ? '<div style="color:#FF6600;font-size:11px;margin:4px 0;">⚠️ Alerte précoce : Forte affluence détectée.</div>' : ''}
          <table style="width:100%;font-size:11px;margin-top:8px;">
            ${site.zones.map(z => {
              const c = z.status === 'red' ? '#EF4444' : z.status === 'orange' ? '#FF6600' : '#10B981'
              return `<tr><td style="color:#6B7280;">${z.zone_name}</td><td style="text-align:right;color:${c};font-weight:bold;">${z.fill_percentage}%</td></tr>`
            }).join('')}
          </table>
        `)
        .addTo(layer)
    })
  }, [green?.sites, isStadiumMode])

  // ── Stadium simulation layers (tick-driven + heatmap toggle) ───────────
  useEffect(() => {
    if (!isStadiumMode) return
    renderStadiumLayers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStadiumMode, sim.tick, showHeatmap])

  // ── Toast notifications on new alerts ─────────────────────────────────
  useEffect(() => {
    if (!isStadiumMode) return
    const currentIds = new Set(sim.snapshot.alerts.map(a => a.id))
    const newAlerts  = sim.snapshot.alerts.filter(a => !prevAlertIds.current.has(a.id))
    prevAlertIds.current = currentIds
    if (newAlerts.length === 0) return

    setToasts(prev => [...prev, ...newAlerts].slice(-3))
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => !newAlerts.find(a => a.id === t.id)))
    }, 4000)
    return () => clearTimeout(timer)
  }, [isStadiumMode, sim.snapshot.alerts])

  // ── Keep site overlay in sync ──────────────────────────────────────────
  useEffect(() => {
    if (!selectedSite || !density?.sites) return
    const updated = density.sites.find(s => s.site_id === selectedSite.site_id)
    if (updated) setSelectedSite(updated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density?.sites])

  // ── Mode transitions ───────────────────────────────────────────────────
  function enterStadiumMode() {
    setSelectedSite(null)
    setIsStadiumMode(true)
    prevAlertIds.current = new Set()
    setToasts([])
    markerLayer.current?.clearLayers()
    greenLayer.current?.clearLayers()
    mapRef.current?.flyTo(STADIUM_CENTER, STADIUM_ZOOM_DETAIL, {
      duration: 1.2,
      easeLinearity: 0.3,
    })
  }

  function exitStadiumMode() {
    simPause()
    setIsStadiumMode(false)
    setToasts([])
    stadiumLayer.current?.clearLayers()
    gatesLayer.current?.clearLayers()
    personsLayer.current?.clearLayers()
    binsLayer.current?.clearLayers()
    if (heatLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(heatLayerRef.current)
      heatLayerRef.current = null
    }
    mapRef.current?.flyTo([14.715, -17.25], STADIUM_ZOOM_GLOBAL, { duration: 1.0 })
  }

  // ── Render all stadium layers for current tick ─────────────────────────
  function renderStadiumLayers() {
    const sLayer  = stadiumLayer.current
    const gLayer  = gatesLayer.current
    const pLayer  = personsLayer.current
    const bLayer  = binsLayer.current
    const canvas  = canvasRef.current
    if (!sLayer || !gLayer || !pLayer || !bLayer || !canvas) return

    sLayer.clearLayers()
    gLayer.clearLayers()
    pLayer.clearLayers()
    bLayer.clearLayers()

    const snap = sim.snapshot

    // ── Stadium polygon ──────────────────────────────────────────────────
    L.polygon(STADIUM_POLYGON, {
      color: '#f5c842',
      weight: 2,
      dashArray: '7 5',
      fillColor: '#f5c842',
      fillOpacity: 0.04,
      interactive: false,
    }).addTo(sLayer)

    // Inner pitch boundary (smaller scaled polygon)
    const cx = STADIUM_CENTER[0]
    const cy = STADIUM_CENTER[1]
    const innerPoly = STADIUM_POLYGON.map(([lat, lng]): [number, number] => [
      cx + (lat - cx) * 0.55,
      cy + (lng - cy) * 0.55,
    ])
    L.polygon(innerPoly, {
      color: '#2a4a2a',
      weight: 1.5,
      dashArray: '3 7',
      fillColor: '#1a3a1a',
      fillOpacity: 0.15,
      interactive: false,
    }).addTo(sLayer)

    // ── Person dots (canvas renderer = fast) ────────────────────────────
    snap.persons.forEach(p => {
      L.circleMarker([p.lat, p.lng], {
        renderer: canvas,
        radius: 3,
        weight: 0,
        fillColor: p.color,
        fillOpacity: 0.60,
        interactive: false,
      }).addTo(pLayer)
    })

    // ── Heatmap layer (intensity-weighted by gate density) ──────────────
    const map = mapRef.current
    if (map) {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current)
        heatLayerRef.current = null
      }
      if (showHeatmap && typeof L.heatLayer === 'function') {
        const heatPoints: Array<[number, number, number]> = snap.persons.map(p => {
          // Find this person's gate density for intensity
          const gate = snap.gates.find(g => g.id === p.gateRef)
          const intensity = gate ? gate.density : 0.3
          return [p.lat, p.lng, intensity]
        })
        heatLayerRef.current = L.heatLayer(heatPoints, {
          radius: 22,
          blur: 28,
          maxZoom: 18,
          max: 1.0,
          gradient: {
            0.2: '#22c55e',
            0.4: '#eab308',
            0.6: '#f97316',
            0.8: '#ef4444',
            1.0: '#b91c1c',
          },
        }).addTo(map)
      }
    }

    // ── Gate markers ──────────────────────────────────────────────────────
    snap.gates.forEach(gate => {
      // Outer density ring
      L.circleMarker([gate.lat, gate.lng], {
        radius: 14,
        color: gate.color,
        weight: 1.5,
        fillColor: gate.color,
        fillOpacity: 0.12,
        interactive: false,
      }).addTo(gLayer)

      // Clickable center circle
      L.circleMarker([gate.lat, gate.lng], {
        radius: 7,
        color: '#fff',
        weight: 1,
        fillColor: gate.color,
        fillOpacity: 0.85,
      })
        .bindPopup(buildGatePopup(gate))
        .addTo(gLayer)

      // Gate ID label — iconAnchor center-bottom places label above the gate dot
      L.marker([gate.lat, gate.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="
            background:${gate.color}22;
            border:1px solid ${gate.color}66;
            color:${gate.color};
            font-size:8px;
            font-weight:800;
            padding:1px 4px;
            border-radius:3px;
            white-space:nowrap;
            font-family:monospace;
            letter-spacing:0.06em;
            pointer-events:none;
          ">${gate.id}</div>`,
          iconSize: [28, 14],
          iconAnchor: [14, 28],
        }),
        interactive: false,
      }).addTo(gLayer)
    })

    // ── Bin markers ───────────────────────────────────────────────────────
    snap.bins.forEach(bin => {
      const pulse = bin.alert
        ? `<div style="
            position:absolute;top:-5px;right:-5px;
            background:#ef4444;color:#fff;
            border-radius:50%;width:11px;height:11px;
            font-size:7px;
            display:flex;align-items:center;justify-content:center;
            font-weight:bold;
            animation:map-pulse 1.2s ease-out infinite;
          ">!</div>`
        : ''

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;display:inline-flex;">
            <div style="
              background:#FFFFFF;
              border:1.5px solid ${bin.color};
              border-radius:5px;
              padding:2px 5px;
              font-size:9px;
              font-weight:700;
              color:${bin.color};
              display:flex;
              align-items:center;
              gap:3px;
              white-space:nowrap;
              box-shadow:0 1px 4px rgba(0,0,0,0.15)${bin.alert ? `,0 0 6px ${bin.color}50` : ''};
              font-family:monospace;
            ">
              <svg viewBox="0 0 24 24" width="9" height="9" fill="${bin.color}">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
              ${bin.fillPercent}%
            </div>
            ${pulse}
          </div>
        `,
        iconSize: [44, 20],
        iconAnchor: [22, 10],
      })

      L.marker([bin.lat, bin.lng], { icon })
        .bindPopup(buildBinPopup(bin))
        .addTo(bLayer)
    })
  }

  // ── Popup builders ─────────────────────────────────────────────────────

  function buildGatePopup(gate: GateState): string {
    return `
      <div>
        <strong style="font-size:13px;color:#111827;">${gate.name}</strong>
        <div style="margin-top:8px;font-size:11px;line-height:1.8;">
          <div style="color:#6B7280;">Densité :
            <span style="color:${gate.color};font-weight:700;font-size:13px;">${Math.round(gate.density * 100)}%</span>
          </div>
          <div style="background:#E5E7EB;border-radius:3px;height:5px;overflow:hidden;margin:4px 0;">
            <div style="height:100%;width:${Math.round(gate.density * 100)}%;background:${gate.color};border-radius:3px;"></div>
          </div>
          <div style="color:#6B7280;">Foule :
            <span style="color:#111827;font-weight:700;">${gate.crowdCount.toLocaleString('fr-FR')}</span> personnes
          </div>
          <div style="color:#6B7280;">Capacité :
            <span style="color:#111827;">${gate.capacity.toLocaleString('fr-FR')}</span>
          </div>
          <div style="margin-top:6px;">
            <span style="
              background:${gate.color}18;
              border:1px solid ${gate.color}45;
              color:${gate.color};
              font-weight:700;
              font-size:9px;
              text-transform:uppercase;
              padding:2px 6px;
              border-radius:3px;
              letter-spacing:0.06em;
            ">${gate.level}</span>
          </div>
        </div>
      </div>
    `
  }

  function buildBinPopup(bin: BinState): string {
    return `
      <div>
        <strong style="font-size:13px;color:#111827;">${bin.label}</strong>
        <div style="margin-top:8px;">
          <div style="font-size:10px;color:#6B7280;margin-bottom:4px;">Remplissage</div>
          <div style="background:#E5E7EB;border-radius:4px;height:8px;overflow:hidden;">
            <div style="height:100%;width:${bin.fillPercent}%;background:${bin.color};border-radius:4px;${bin.alert ? `box-shadow:0 0 4px ${bin.color};` : ''}"></div>
          </div>
          <div style="text-align:right;font-size:13px;color:${bin.color};font-weight:700;margin-top:2px;">${bin.fillPercent}%</div>
        </div>
        <div style="font-size:11px;color:#6B7280;margin-top:6px;line-height:1.8;">
          <div>Volume : <span style="color:#111827;font-weight:600;">${bin.currentLiters}L / ${bin.maxLiters}L</span></div>
          <div>Niveau :
            <span style="color:${bin.color};font-weight:700;text-transform:uppercase;font-size:10px;">${bin.level}</span>
          </div>
          ${bin.alert ? `<div style="color:#EF4444;font-weight:700;margin-top:4px;">⚠ Collecte urgente requise</div>` : ''}
        </div>
      </div>
    `
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div
      className="relative flex-1 flex flex-col w-full h-full min-h-[600px] overflow-hidden rounded-[6px]"
      id="mapPanel"
    >
      {/* ── Global view legend ── */}
      {!isStadiumMode && (
        <div className="absolute top-4 left-4 z-[400] flex gap-2 bg-white/90 backdrop-blur-md border border-[#E5E7EB] px-3 py-2 rounded-lg shadow-md pointer-events-auto">
          {[
            { color: '#3b82f6', label: 'Dakar' },
            { color: '#10B981', label: 'Diamniadio' },
            { color: '#F59E0B', label: 'Saly' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5 text-[11px] font-medium text-[#374151] uppercase tracking-wide ml-2 first:ml-0">
              <div className="w-2 h-2 rounded-full" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>
      )}

      {/* ── Stadium mode heatmap toggle ── */}
      {isStadiumMode && (
        <button
          onClick={() => setShowHeatmap(h => !h)}
          className={`absolute top-4 left-4 z-[400] flex items-center gap-2 px-3 py-2 rounded-lg shadow-md border backdrop-blur-md text-[11px] font-semibold uppercase tracking-wide transition-all pointer-events-auto ${
            showHeatmap
              ? 'bg-[#FF6600]/12 border-[#FF6600]/40 text-[#FF6600]'
              : 'bg-white/90 border-[#E5E7EB] text-[#6B7280] hover:text-[#374151]'
          }`}
          title="Activer/désactiver la heatmap thermique"
        >
          <span>{showHeatmap ? '🔥' : '○'}</span>
          <span>Heatmap</span>
        </button>
      )}

      {/* ── Stadium mode density/bin legend ── */}
      {isStadiumMode && (
        <div className="absolute bottom-16 left-4 z-[400] bg-white/92 backdrop-blur-md border border-[#E5E7EB] px-3 py-2.5 rounded-lg shadow-md pointer-events-auto">
          <div className="text-[8px] text-[#9CA3AF] uppercase tracking-widest mb-2 font-bold">Densité foule</div>
          {[
            { color: '#22c55e', label: 'Faible   ≤ 25%' },
            { color: '#eab308', label: 'Modérée  ≤ 50%' },
            { color: '#f97316', label: 'Élevée   ≤ 75%' },
            { color: '#ef4444', label: 'Critique  > 75%' },
          ].map(({ color, label }) => (
            <div key={color} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full flex-none" style={{ background: color }} />
              <span className="text-[9px] text-[#6B7280] font-mono">{label}</span>
            </div>
          ))}
          <div className="border-t border-[#E5E7EB] mt-2 pt-2 text-[8px] text-[#9CA3AF] uppercase tracking-widest mb-2 font-bold">Poubelles</div>
          {[
            { color: '#22c55e', label: '< 50%' },
            { color: '#f97316', label: '50 – 75%' },
            { color: '#ef4444', label: '> 75% Alerte' },
          ].map(({ color, label }) => (
            <div key={color} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-sm flex-none" style={{ background: color }} />
              <span className="text-[9px] text-[#6B7280] font-mono">{label}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 relative w-full h-full bg-[#E8ECF0]">
        <div id="map" ref={mapDivRef} className="absolute inset-0 w-full h-full z-[1]" />

        {/* Normal site detail overlay */}
        {!isStadiumMode && (
          <SiteOverlay site={selectedSite} onClose={() => setSelectedSite(null)} />
        )}

        {/* Stadium simulation panel */}
        {isStadiumMode && (
          <StadiumPanel
            sim={sim}
            onClose={exitStadiumMode}
            onFlyToGate={(lat, lng) => mapRef.current?.flyTo([lat, lng], 18, { duration: 0.7 })}
            onFlyToBin={(lat, lng) => mapRef.current?.flyTo([lat, lng], 18, { duration: 0.7 })}
          />
        )}

        {/* Toast notifications */}
        {isStadiumMode && <ToastNotifications toasts={toasts} />}
      </div>

      {/* Status bar */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur-md border border-[#E5E7EB] px-3 py-1.5 rounded-lg shadow-md text-[11px] font-mono pointer-events-auto">
        {isStadiumMode ? (
          <span>
            <span className="text-[#9CA3AF]">Stade Iba Mar Diop · </span>
            <span className="text-[#FF6600] font-semibold">Tick {sim.snapshot.realTick}</span>
            <span className="text-[#9CA3AF]"> · </span>
            <span style={{ color: sim.snapshot.phase.color }}>{sim.snapshot.phase.label}</span>
            <span className="text-[#9CA3AF]"> · </span>
            <span className="text-[#10B981] font-semibold">{sim.snapshot.totalCrowd.toLocaleString('fr-FR')} pers.</span>
          </span>
        ) : (
          <span>
            <span className="text-[#9CA3AF]">Dernière sync : </span>
            <span className="text-[#374151] font-semibold">
              {density?.timestamp ? new Date(density.timestamp).toLocaleTimeString() : '--'}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
