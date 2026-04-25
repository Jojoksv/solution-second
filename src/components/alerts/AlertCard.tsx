// ─── AlertCard ────────────────────────────────────────────────────────────
import type { Alert } from "@/types";
import { useAcknowledgeAlert } from "@/hooks";
import { fmt } from "@/lib/utils";

interface Props {
  alert: Alert;
}

export function AlertCard({ alert: a }: Props) {
  const { mutate: ack, isPending } = useAcknowledgeAlert();

  return (
    <div className={`alert-card ${a.alert_level}`}>
      <div className="alert-header">
        <div className="alert-title">{a.site_name}</div>
        <span className={`badge ${a.alert_level}`}>
          {a.alert_level === "red" ? "CRITIQUE" : "ATTENTION"}
        </span>
      </div>

      <div className="alert-body">
        Densité: <strong>{a.occupancy_percentage}%</strong> (Foule:{" "}
        {fmt(a.estimated_real_crowd)})<br />
        Tendance: <strong>+{a.rise_rate_10min_percent}%</strong> sur 10min
      </div>

      {a.alert_level === "red" && !a.acknowledged && (
        <div className="alert-sms">
          <span style={{ color: "var(--orange)" }}>[SYS &gt; SMS]</span>{" "}
          Envoi à {a.assigned_volunteer}...<br />
          &quot;Alerte DENSITE: {a.site_name} à {a.occupancy_percentage}%.
          Merci de confirmer.&quot;
        </div>
      )}

      {a.acknowledged ? (
        <button className="ack-btn" disabled>
          ✓ Acquitté par {a.assigned_volunteer}
        </button>
      ) : (
        <button
          className="ack-btn"
          disabled={isPending}
          onClick={() => ack(a.id)}
        >
          {isPending
            ? "Acquittement en cours..."
            : `Acquitter (Volontaire: ${a.assigned_volunteer})`}
        </button>
      )}
    </div>
  );
}