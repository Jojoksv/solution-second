// ─── MetricCard ───────────────────────────────────────────────────────────
import type { ReactNode } from "react";

interface Props {
  label: string;
  value: ReactNode;
  highlight?: boolean;
}

export function MetricCard({ label, value, highlight = false }: Props) {
  return (
    <section className="metric-card">
      <div className="metric-label">{label}</div>
      <div className={`metric-value${highlight ? " highlight" : ""}`}>{value}</div>
    </section>
  );
}