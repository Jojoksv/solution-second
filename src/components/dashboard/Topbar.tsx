// ─── Topbar ───────────────────────────────────────────────────────────────
import { Brand } from "./Brand.tsx";
import { MetricCard } from "./MetricCard";
import { DemoButton } from "./DemoButton";
import { useDensity, useAlerts, useGreen } from "@/hooks";
import { useDemoState } from "@/stores/demoStore.ts";
import { fmt } from "@/lib/utils";

export function Topbar() {
  const demoActive = useDemoState();
  const { data: density } = useDensity(demoActive);
  const { data: alerts } = useAlerts(demoActive);
  const { data: green } = useGreen(demoActive);

  const totalPeople = density?.global_metrics.total_estimated_people ?? 0;
  const sitesInAlert = density?.global_metrics.sites_in_alert ?? 0;
  const ackedAlerts = alerts?.acknowledged_alerts ?? 0;

  const fullBins =
    green?.sites.reduce(
      (acc, s) => acc + s.zones.filter((z) => z.fill_percentage >= 80).length,
      0,
    ) ?? 0;

  return (
    <div className="topbar">
      <Brand />

      <MetricCard label="Foule Totale Estimée" value={fmt(totalPeople)} />

      <MetricCard
        label="Sites en Alerte"
        value={sitesInAlert}
        highlight={sitesInAlert > 0}
      />

      <MetricCard label="Alertes Traitées" value={ackedAlerts} />

      <MetricCard
        label="🗑️ Poubelles Pleines"
        value={
          <span
            style={{
              color:
                fullBins > 3
                  ? "var(--red)"
                  : fullBins > 0
                    ? "var(--orange)"
                    : "var(--green)",
            }}
          >
            {fullBins}
          </span>
        }
      />

      <DemoButton />
    </div>
  );
}