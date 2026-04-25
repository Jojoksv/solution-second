// ─── Brand ────────────────────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { liveClock } from "@/lib/utils";

export function Brand() {
  const [clock, setClock] = useState(liveClock());

  useEffect(() => {
    const id = setInterval(() => setClock(liveClock()), 1_000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="brand">
      <h1>
        Crowd<span>Flow</span>
      </h1>
      <small>SONATEL x JOJ Dakar 2026</small>
      <div className="live-clock">
        <div className="clock-dot" />
        <span>{clock}</span>
      </div>
    </section>
  );
}