// ─── SiteOverlay ──────────────────────────────────────────────────────────
import type { SiteData } from "@/types";
import { cityColor, fmt } from "@/lib/utils";

interface Props {
  site: SiteData | null;
  onClose: () => void;
}

export function SiteOverlay({ site, onClose }: Props) {
  return (
    <aside className={`site-overlay${site ? " open" : ""}`}>
      <div className="overlay-head">
        <strong>{site?.site_name ?? "Vue détaillée du site"}</strong>
        <button className="overlay-close" onClick={onClose}>✕</button>
      </div>

      {site && (
        <div className="overlay-body">
          <div className="overlay-meta">
            <span style={{ color: cityColor(site.city), fontWeight: "bold" }}>
              {site.city}
            </span>{" "}
            &bull; {site.crowd_type}
            <div style={{ marginTop: 4, display: "flex", gap: 12 }}>
              <span>
                <span style={{ color: "var(--orange)" }}>Orange</span>
                {" > "}
                {site.site_thresholds?.orange_percent_gt ?? 65}%
              </span>
              <span>
                <span style={{ color: "var(--red)" }}>Rouge</span>
                {" > "}
                {site.site_thresholds?.red_percent_gt ?? 85}%
              </span>
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Zones internes
          </div>
          <div className="plan-grid">
            {site.zones.map((z, i) => (
              <div className="plan-cell" key={z.zone_name}>
                <div style={{ color: "var(--muted)", marginBottom: 4 }}>Z{i + 1}</div>
                <div
                  style={{
                    fontWeight: 600,
                    marginBottom: 6,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                  title={z.zone_name}
                >
                  {z.zone_name}
                </div>
                <span className={`status-pill ${z.status}`}>
                  {z.occupancy_percentage}%
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 8,
              textTransform: "uppercase",
            }}
          >
            Flux aux sorties
          </div>
          <div className="exit-list">
            {site.exits.map((e) => (
              <div className="exit-item" key={e.exit_name}>
                <div>
                  <strong>{e.exit_name}</strong>
                  <div className="exit-flows">
                    ↓ IN: {e.incoming_flow_per_min}/min &nbsp;&nbsp; ↑ OUT:{" "}
                    {e.outgoing_flow_per_min}/min
                  </div>
                </div>
                <span className={`status-pill ${e.status}`}>{e.status}</span>
              </div>
            ))}
          </div>

          <div className="recommendation">
            <strong>Action Recommandée :</strong>
            <br />
            {site.site_recommendation ?? "Maintenir supervision."}
          </div>
        </div>
      )}
    </aside>
  );
}