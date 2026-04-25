// ─── GreenPanel ───────────────────────────────────────────────────────────
import { useGreen } from "@/hooks";
import { useDemoState } from "@/stores/demoStore";
import { shortTime } from "@/lib/utils";

export function GreenPanel() {
  const demoActive = useDemoState();
  const { data: green, isLoading } = useGreen(demoActive);

  const fullBins =
    green?.sites.reduce(
      (acc, s) => acc + s.zones.filter((z) => z.fill_percentage >= 80).length,
      0,
    ) ?? 0;

  return (
    <section
      className="panel"
      id="greenPanel"
      style={{ gridColumn: "2 / -1" }}
    >
      <h2 className="section-title">
        🗑️ Smart Green — État des Poubelles
        <span
          style={{ fontSize: 12, color: "var(--muted)", fontWeight: "normal" }}
          id="greenTimestamp"
        >
          {green?.timestamp ? shortTime(green.timestamp) : ""}
        </span>
      </h2>

      <div className="green-summary">
        {isLoading && (
          <div
            style={{
              textAlign: "center",
              color: "var(--muted)",
              padding: 20,
              gridColumn: "1 / -1",
            }}
          >
            Chargement...
          </div>
        )}

        {green?.sites.map((site) => {
          const pct = site.max_fill_percentage;
          const status = site.site_fill_status;
          const earlyIcon = site.early_crowd_alert ? " ⚠️" : "";

          return (
            <div className="green-site-card" key={site.site_id}>
              <div
                className="gs-name"
                style={{ color: `var(--${status})` }}
              >
                {site.site_name}
                {earlyIcon}
              </div>
              <div className="green-bar-wrap">
                <div
                  className={`green-bar ${status}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="gs-pct">
                <span>{site.zones.length} zones</span>
                <span className="val" style={{ color: `var(--${status})` }}>
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}