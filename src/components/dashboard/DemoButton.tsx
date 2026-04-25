// ─── DemoButton ───────────────────────────────────────────────────────────
import { useEffect, useRef, useState } from "react";
import { useDemoMode } from "@/hooks";
import { startDemo, useDemoState } from "@/stores/demoStore.ts";
import { DEMO } from "@/config";

export function DemoButton() {
  const active = useDemoState();
  const { mutateAsync } = useDemoMode();
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  function animateProgress(ts: number) {
    if (!startRef.current) startRef.current = ts;
    const elapsed = ts - startRef.current;
    setProgress(Math.min((elapsed / DEMO.durationMs) * 100, 100));
    if (elapsed < DEMO.durationMs) {
      rafRef.current = requestAnimationFrame(animateProgress);
    }
  }

  async function handleClick() {
    if (active) return;
    try {
      await mutateAsync();
      startDemo();
      startRef.current = null;
      setProgress(0);
      rafRef.current = requestAnimationFrame(animateProgress);
    } catch {
      alert("Erreur lancement démo");
    }
  }

  useEffect(() => {
    if (!active && rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      setProgress(0);
    }
  }, [active]);

  return (
    <div className="demo-wrap">
      <button
        className={`demo-btn${active ? " active" : ""}`}
        onClick={handleClick}
        disabled={active}
      >
        {active ? "⚠️ DÉMO EN COURS (Stade A. Wade)" : "▶ Lancer Scénario Démo"}
        <div
          className="demo-progress"
          style={{ width: `${progress}%` }}
        />
      </button>
    </div>
  );
}