// ─── AlertsPanel ──────────────────────────────────────────────────────────
import { useAlerts } from "@/hooks";
import { useDemoState } from "@/stores/demoStore";
import { AlertCard } from "./AlertCard";

export function AlertsPanel() {
  const demoActive = useDemoState();
  const { data: alerts, isLoading, isError } = useAlerts(demoActive);

  const activeAlerts = [...(alerts?.active_alerts ?? [])].sort((a, b) =>
    a.alert_level === "red" ? -1 : b.alert_level === "red" ? 1 : 0,
  );

  return (
    <section className="panel" id="alertsPanel">
      <h2 className="section-title">
        Centre Opérationnel
        <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: "normal" }}>
          Live SMS Feed
        </span>
      </h2>

      <div className="alerts-list">
        {isLoading && (
          <div style={{ textAlign: "center", color: "var(--muted)", padding: 20 }}>
            Chargement des données...
          </div>
        )}

        {isError && (
          <div className="alert-card red" style={{ margin: 0 }}>
            <div className="alert-header">
              <div className="alert-title">⚠️ Erreur de connexion</div>
            </div>
            <div className="alert-body">
              Impossible de se connecter au serveur backend.
              Assurez-vous que <code>python server.py</code> est en cours d&apos;exécution.
            </div>
          </div>
        )}

        {!isLoading && !isError && activeAlerts.length === 0 && (
          <div style={{ textAlign: "center", padding: 30, color: "var(--green)" }}>
            ✅ Tout est sous contrôle. Aucune alerte.
          </div>
        )}

        {activeAlerts.map((a) => (
          <AlertCard key={a.id} alert={a} />
        ))}
      </div>
    </section>
  );
}