// ─── Data Hooks ───────────────────────────────────────────────────────────
// All useQuery / useMutation calls.  Components never call the API directly.

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

// ── Query keys (centralised to avoid typos) ────────────────────────────────
export const QUERY_KEYS = {
  density: ['density'] as const,
  alerts: ['alerts'] as const,
  green: ['green'] as const,
} as const

// ── useDensity ─────────────────────────────────────────────────────────────
// OPTIMISATION: Polling fixe indépendant du mode demo pour éviter les re-renders
// fréquents. Le mode demo affecte les données mais pas la fréquence de polling.
export function useDensity(_fastMode = false) {
  return useQuery({
    queryKey: QUERY_KEYS.density,
    queryFn: fetchDensity,
    // Use fixed polling rate - demo mode data changes faster but we don't need
    // to poll faster, React Query will get fresh data on next poll
    refetchInterval: POLLING.normal,
    staleTime: POLLING.normal - 2000,
    placeholderData: keepPreviousData,
  })
}

// ── useAlerts ──────────────────────────────────────────────────────────────
// OPTIMISATION: Polling fixe indépendant du mode demo.
export function useAlerts(_fastMode = false) {
  return useQuery({
    queryKey: QUERY_KEYS.alerts,
    queryFn: fetchAlerts,
    refetchInterval: POLLING.normal,
    staleTime: POLLING.normal - 2000,
    placeholderData: keepPreviousData,
  })
}

// ── useGreen ───────────────────────────────────────────────────────────────
// Bins fill in 10-25 s — we use a dedicated GREEN polling rate (8 s) that is
// independent of demo mode.  This prevents the 2 s demo cycle from causing
// a cascade of re-renders across every component that shows bin data.
export function useGreen(_fastMode = false) {
  return useQuery({
    queryKey: QUERY_KEYS.green,
    queryFn: fetchGreen,
    refetchInterval: POLLING.green,
    staleTime: POLLING.green - 1000,
    placeholderData: keepPreviousData,
  })
}

// ── useAcknowledgeAlert ────────────────────────────────────────────────────
export function useAcknowledgeAlert() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      // Immediately refetch alerts + density after acknowledgement
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
      // Trigger an immediate refetch of all data after demo activation
      void qc.invalidateQueries()
    },
  })
}
