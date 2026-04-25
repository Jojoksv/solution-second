// ─── Domain Types ─────────────────────────────────────────────────────────

export type AlertLevel = "green" | "orange" | "red";

// ── Crowd data ─────────────────────────────────────────────────────────────

export interface ZoneDensity {
  zone_name: string;
  occupancy_percentage: number;
  status: AlertLevel;
}

export interface ExitFlow {
  exit_name: string;
  incoming_flow_per_min: number;
  outgoing_flow_per_min: number;
  flow_load_percentage: number;
  status: AlertLevel;
}

export interface SiteThresholds {
  orange_percent_gt: number;
  red_percent_gt: number;
}

export interface SiteData {
  site_id: string;
  city: string;
  site_name: string;
  latitude: number;
  longitude: number;
  capacity: number;
  crowd_type: string;
  telephones_detected: number;
  estimated_real_crowd: number;
  occupancy_percentage: number;
  status: AlertLevel;
  rise_rate_10min_percent: number;
  rapid_increase: boolean;
  site_thresholds: SiteThresholds;
  zones: ZoneDensity[];
  exits: ExitFlow[];
  site_recommendation: string;
  timestamp: string;
}

export interface GlobalMetrics {
  total_estimated_people: number;
  sites_in_alert: number;
  sites_rapid_increase: number;
  sites_count: number;
}

export interface DensityPayload {
  timestamp: string;
  mode: "demo" | "normal";
  detected_phone_ratio: number;
  estimation_coefficient: number;
  thresholds: {
    default_orange_percent_gt: number;
    default_red_percent_gt: number;
    corniche_ouest_red_percent_gt: number;
    rise_10min_percent_gt: number;
  };
  global_metrics: GlobalMetrics;
  sites: SiteData[];
  live_metrics?: {
    active_alerts: number;
    acknowledged_alerts: number;
    alert_history_count: number;
  };
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  site_id: string;
  site_name: string;
  alert_level: AlertLevel;
  occupancy_percentage: number;
  estimated_real_crowd: number;
  rise_rate_10min_percent: number;
  rapid_increase: boolean;
  city: string;
  site_thresholds: SiteThresholds;
  site_recommendation: string;
  created_at: string;
  updated_at: string;
  acknowledged: boolean;
  acknowledged_at: string | null;
  escalated: boolean;
  escalation_created_at: string | null;
  assigned_volunteer: string;
}

export interface AlertsPayload {
  timestamp: string;
  active_alerts: Alert[];
  history: (Alert & { event: string })[];
  total_history_events: number;
  acknowledged_alerts: number;
}

// ── Smart Green ────────────────────────────────────────────────────────────

export interface GreenZone {
  zone_name: string;
  fill_percentage: number;
  status: AlertLevel;
  early_alert: boolean;
}

export interface GreenSite {
  site_id: string;
  site_name: string;
  city: string;
  latitude: number;
  longitude: number;
  site_fill_status: AlertLevel;
  max_fill_percentage: number;
  early_crowd_alert: boolean;
  zones: GreenZone[];
}

export interface GreenPayload {
  timestamp: string;
  sites: GreenSite[];
}

// ── Demo ───────────────────────────────────────────────────────────────────

export interface DemoPayload {
  message: string;
  active_until: string;
  simulator_interval_seconds: number;
}

// ── Risk Index (IRG) ───────────────────────────────────────────────────────
// Indicateur de Risque Global — score composite 0–100
// Spec §13 — CrowdFlow JOJ 2026

export type RiskLevel =
  | "nominal"    // 0–30   🟢
  | "vigilance"  // 31–55  🟡
  | "alert"      // 56–75  🟠
  | "critical"   // 76–90  🔴
  | "emergency"; // 91–100 ⚫

export interface SiteRiskContribution {
  site_id: string;
  site_name: string;
  weight: number;
  occupancy_percentage: number;
  rapid_increase: boolean;
  contribution: number; // weighted score contribution
}

export interface RiskIndexPayload {
  timestamp: string;
  score: number;               // 0–100
  level: RiskLevel;
  label: string;               // "NOMINAL" | "VIGILANCE" | "ALERTE" | "CRITIQUE" | "URGENCE"
  recommended_action: string;  // human-readable action
  rapid_increase_bonus: number;
  inter_sites_congestion_bonus: number;
  site_contributions: SiteRiskContribution[];
  trend: "rising" | "stable" | "falling";
  previous_score: number | null;
}