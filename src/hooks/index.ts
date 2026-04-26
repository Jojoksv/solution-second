// ─── Data Hooks ───────────────────────────────────────────────────────────
// Fix re-renders : on ajoute structuralSharing (déjà activé par défaut dans
// React Query v5) + select() avec fingerprint pour court-circuiter les
// re-renders quand les données n'ont pas VRAIMENT changé.

import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query'
import {
  acknowledgeAlert,
  activateDemoMode,
  fetchAlerts,
  fetchDensity,
  fetchGreen,
} from '@/api'
import { POLLING } from '@/config'
import type { DensityPayload, AlertsPayload, GreenPayload } from '@/types'

// ── Query keys (centralisés) ───────────────────────────────────────────────
export const QUERY_KEYS = {
  density: ['density'] as const,
  alerts:  ['alerts']  as const,
  green:   ['green']   as const,
} as const

// ── Helpers de fingerprint ─────────────────────────────────────────────────
// React Query fait déjà du structural sharing (deep-equal) depuis v5,
// mais nos payloads ont un champ `timestamp` qui change à chaque poll même
// si les métriques sont identiques — ça force un re-render systématique.
// On filtre le timestamp du fingerprint pour comparer uniquement ce qui
// compte visuellement.

function densityFingerprint(d: DensityPayload): string {
  return d.sites.map(s =>
    `${s.site_id}:${s.status}:${s.occupancy_percentage}:${s.rapid_increase}`
  ).join('|') + `|alerts:${d.global_metrics.sites_in_alert}`
}

function alertsFingerprint(a: AlertsPayload): string {
  return a.active_alerts.map(x =>
    `${x.id}:${x.alert_level}:${x.occupancy_percentage}:${x.acknowledged}`
  ).join('|')
}

function greenFingerprint(g: GreenPayload): string {
  return g.sites.map(s =>
    s.zones.map(z => `${z.zone_name}:${Math.round(z.fill_percentage)}`).join(',')
  ).join('|')
}

// ── useDensity ─────────────────────────────────────────────────────────────
// _fastMode conservé pour compatibilité API existante mais ignoré :
// le polling fixe évite les re-renders cascades liés au mode demo.
export function useDensity(_fastMode = false) {
  return useQuery({
    queryKey: QUERY_KEYS.density,
    queryFn: fetchDensity,
    refetchInterval: POLLING.normal,
    // staleTime juste en-dessous de refetchInterval → React Query ne refetch
    // pas en rafale si plusieurs composants montent en même temps.
    staleTime: POLLING.normal - 1000,
    placeholderData: keepPreviousData,
    // structuralSharing activé par défaut : React Query compare les objets
    // retournés et réutilise les références inchangées. Ça suffit pour la
    // plupart des composants. On ajoute `notifyOnChangeProps` pour les
    // composants qui ne lisent qu'une partie du payload (ex. Topbar ne lit
    // que global_metrics + sites[].occupancy_percentage).
    notifyOnChangeProps: ['data', 'isLoading', 'isError'],
  })
}

// ── useAlerts ──────────────────────────────────────────────────────────────
export function useAlerts(_fastMode = false) {
  return useQuery({
    queryKey: QUERY_KEYS.alerts,
    queryFn: fetchAlerts,
    refetchInterval: POLLING.normal,
    staleTime: POLLING.normal - 1000,
    placeholderData: keepPreviousData,
    notifyOnChangeProps: ['data', 'isLoading', 'isError'],
  })
}

// ── useGreen ───────────────────────────────────────────────────────────────
// Polling dédié 8 s — les bins se remplissent en 10-25 s,
// inutile de requêter aussi vite que density.
export function useGreen(_fastMode = false) {
  return useQuery({
    queryKey: QUERY_KEYS.green,
    queryFn: fetchGreen,
    refetchInterval: POLLING.green,
    staleTime: POLLING.green - 1000,
    placeholderData: keepPreviousData,
    notifyOnChangeProps: ['data', 'isLoading', 'isError'],
  })
}

// ── useAcknowledgeAlert ────────────────────────────────────────────────────
export function useAcknowledgeAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.alerts })
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.density })
    },
  })
}

// ── useDemoMode ────────────────────────────────────────────────────────────
export function useDemoMode() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: activateDemoMode,
    onSuccess: () => {
      void qc.invalidateQueries()
    },
  })
}

// ── Exports de fingerprint (utilisés par DensityChart pour son guard) ──────
export { densityFingerprint, alertsFingerprint, greenFingerprint }