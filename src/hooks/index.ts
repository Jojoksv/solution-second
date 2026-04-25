// ─── Data Hooks ───────────────────────────────────────────────────────────
// All useQuery / useMutation calls.  Components never call the API directly.

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  acknowledgeAlert,
  activateDemoMode,
  fetchAlerts,
  fetchDensity,
  fetchGreen,
} from "@/api";
import { POLLING } from "@/config";

// ── Query keys (centralised to avoid typos) ────────────────────────────────
export const QUERY_KEYS = {
  density: ["density"] as const,
  alerts: ["alerts"] as const,
  green: ["green"] as const,
} as const;

// ── useDensity ─────────────────────────────────────────────────────────────
export function useDensity(fastMode = false) {
  return useQuery({
    queryKey: QUERY_KEYS.density,
    queryFn: fetchDensity,
    refetchInterval: fastMode ? POLLING.demo : POLLING.normal,
    staleTime: 0,
  });
}

// ── useAlerts ──────────────────────────────────────────────────────────────
export function useAlerts(fastMode = false) {
  return useQuery({
    queryKey: QUERY_KEYS.alerts,
    queryFn: fetchAlerts,
    refetchInterval: fastMode ? POLLING.demo : POLLING.normal,
    staleTime: 0,
  });
}

// ── useGreen ───────────────────────────────────────────────────────────────
export function useGreen(fastMode = false) {
  return useQuery({
    queryKey: QUERY_KEYS.green,
    queryFn: fetchGreen,
    refetchInterval: fastMode ? POLLING.demo : POLLING.normal,
    staleTime: 0,
  });
}

// ── useAcknowledgeAlert ────────────────────────────────────────────────────
export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => {
      // Immediately refetch alerts + density after acknowledgement
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.alerts });
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.density });
    },
  });
}

// ── useDemoMode ────────────────────────────────────────────────────────────
export function useDemoMode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: activateDemoMode,
    onSuccess: () => {
      // Trigger an immediate refetch of all data after demo activation
      void qc.invalidateQueries();
    },
  });
}