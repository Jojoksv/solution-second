// ─── MapPanel ─────────────────────────────────────────────────────────────
// Manages the Leaflet map lifecycle imperatively inside a React component.
// Leaflet mutates the DOM directly, so we hold refs and reconcile manually.

import { useEffect, useRef, useState } from 'react'
import type { Map as LMap, LayerGroup, CircleMarker } from 'leaflet'
import { useDensity, useGreen } from '@/hooks'
import { useDemoState } from '@/stores/demoStore'
import { cityColor, fmt, shortTime } from '@/lib/utils'
import { SiteOverlay } from './SiteOverlay'
import type { SiteData } from '@/types'

// Leaflet is loaded via CDN in index.html – access via window.L
declare const L: typeof import('leaflet')

const TRASH_SVG = `<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>`

export function MapPanel() {
  const demoActive = useDemoState()
  const { data: density } = useDensity(demoActive)
  const { data: green } = useGreen(demoActive)

  const mapRef = useRef<LMap | null>(null)
  const markerLayerRef = useRef<LayerGroup | null>(null)
  const greenLayerRef = useRef<LayerGroup | null>(null)
  const mapDivRef = useRef<HTMLDivElement>(null)

  const [selectedSite, setSelectedSite] = useState<SiteData | null>(null)

  // ── Initialise Leaflet map once ────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current || !mapDivRef.current) return

    const map = L.map(mapDivRef.current, { zoomControl: false }).setView(
      [14.715, -17.25],
      11,
    )
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
      },
    ).addTo(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    markerLayerRef.current = L.layerGroup().addTo(map)
    greenLayerRef.current = L.layerGroup().addTo(map)
    mapRef.current = map

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Sync crowd markers ─────────────────────────────────────────────────
  useEffect(() => {
    const layer = markerLayerRef.current
    if (!layer || !density?.sites) return

    layer.clearLayers()
    density.sites.forEach((site) => {
      const color =
        site.status === 'red'
          ? '#ef4444'
          : site.status === 'orange'
            ? '#ff6600'
            : '#10b981'

      // Pulse wrapper (non-interactive)
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
        {
          radius: 6,
          color: '#fff',
          weight: 1,
          fillColor: color,
          fillOpacity: 1,
        },
      )

      marker.bindPopup(`
        <div style="margin-bottom:8px;">
          <span style="color:${cityColor(site.city)};font-size:10px;text-transform:uppercase;font-weight:bold;">${site.city}</span><br>
          <strong style="font-size:15px;">${site.site_name}</strong>
        </div>
        <table style="width:100%;font-size:12px;border-collapse:collapse;">
          <tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><td style="padding:4px 0;color:var(--muted)">Capacité</td><td style="text-align:right;font-weight:bold;">${fmt(site.capacity)}</td></tr>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><td style="padding:4px 0;color:var(--muted)">Foule Estimée</td><td style="text-align:right;font-weight:bold;">${fmt(site.estimated_real_crowd)}</td></tr>
          <tr><td style="padding:4px 0;color:var(--muted)">Densité</td><td style="text-align:right;font-weight:bold;color:var(--${site.status})">${site.occupancy_percentage}%</td></tr>
        </table>
        <div style="margin-top:8px;font-size:10px;color:var(--muted);text-align:center;">Cliquez pour voir le plan interne</div>
      `)

      marker.on('click', () => {
        setSelectedSite(site)
        mapRef.current?.flyTo([site.latitude, site.longitude], 14, {
          duration: 0.5,
        })
      })

      marker.addTo(layer)
    })
  }, [density?.sites])

  // ── Keep overlay in sync when data refreshes ───────────────────────────
  useEffect(() => {
    if (!selectedSite || !density?.sites) return
    const updated = density.sites.find(
      (s) => s.site_id === selectedSite.site_id,
    )
    if (updated) setSelectedSite(updated)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [density?.sites])

  // ── Sync Smart Green markers ───────────────────────────────────────────
  useEffect(() => {
    const layer = greenLayerRef.current
    if (!layer || !green?.sites) return

    layer.clearLayers()
    green.sites.forEach((site) => {
      const lat = site.latitude + 0.002
      const lng = site.longitude + 0.002

      const alertHtml = site.early_crowd_alert
        ? `<div style="position:absolute;top:-8px;right:-8px;background:var(--orange);color:#000;border-radius:50%;width:14px;height:14px;font-size:9px;display:flex;align-items:center;justify-content:center;font-weight:bold;animation:pulse 1s infinite;">!</div>`
        : ''

      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;"><div class="green-icon ${site.site_fill_status}">${TRASH_SVG} ${site.max_fill_percentage}%</div>${alertHtml}</div>`,
        iconSize: [50, 24],
        iconAnchor: [0, 24],
      })

      L.marker([lat, lng], { icon })
        .bindPopup(
          `
          <strong>Smart Green – ${site.site_name}</strong><br>
          ${site.early_crowd_alert ? '<div style="color:var(--orange);font-size:11px;margin:4px 0;">⚠️ Alerte précoce : Forte affluence détectée.</div>' : ''}
          <table style="width:100%;font-size:11px;margin-top:8px;">
            ${site.zones.map((z) => `<tr><td>${z.zone_name}</td><td style="text-align:right;color:var(--${z.status})">${z.fill_percentage}%</td></tr>`).join('')}
          </table>
        `,
        )
        .addTo(layer)
    })
  }, [green?.sites])

  return (
    <section className="panel" id="mapPanel">
      <div className="city-legend">
        <div className="city-badge">
          <div className="city-dot" style={{ background: 'var(--dakar)' }} />
          Dakar
        </div>
        <div className="city-badge">
          <div
            className="city-dot"
            style={{ background: 'var(--diamniadio)' }}
          />
          Diamniadio
        </div>
        <div className="city-badge">
          <div className="city-dot" style={{ background: 'var(--saly)' }} />
          Saly
        </div>
      </div>

      <div className="map-wrap">
        <div id="map" ref={mapDivRef} />
        <SiteOverlay
          site={selectedSite}
          onClose={() => setSelectedSite(null)}
        />
      </div>

      <div className="status-line">
        Dernière synchronisation :{' '}
        {density?.timestamp
          ? new Date(density.timestamp).toLocaleTimeString()
          : '--'}
      </div>
    </section>
  )
}
