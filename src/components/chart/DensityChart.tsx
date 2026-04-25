// ─── DensityChart ─────────────────────────────────────────────────────────
// Chart.js is loaded via CDN.  We hold a ref to the Chart instance and
// imperatively push new data points on each poll.

import { useEffect, useRef } from "react";
import type { Chart as ChartType } from "chart.js";
import { useDensity } from "@/hooks";
import { useDemoState } from "@/stores/demoStore";
import { shortTime } from "@/lib/utils";
import { CHART } from "@/config";

declare const Chart: {
  new (...args: unknown[]): ChartType;
  defaults: { color: string; font: { family: string } };
};

const PALETTE = [
  "#3b82f6", "#10b981", "#f59e0b", "#ec4899",
  "#8b5cf6", "#14b8a6", "#f97316", "#ef4444",
];

export function DensityChart() {
  const demoActive = useDemoState();
  const { data: density } = useDensity(demoActive);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartType | null>(null);

  // ── Init chart ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current || chartRef.current) return;

    Chart.defaults.color = "#94a3b8";
    Chart.defaults.font.family = "'Inter', sans-serif";

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: { labels: [], datasets: [] },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(15,20,29,0.9)",
            titleColor: "#fff",
            bodyColor: "#cbd5e1",
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            min: 0,
            max: 100,
            grid: { color: "rgba(255,255,255,0.05)" },
          },
        },
        elements: { point: { radius: 0, hitRadius: 10, hoverRadius: 4 } },
      },
    } as Parameters<typeof Chart>[1]);

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  // ── Push data on each poll ────────────────────────────────────────────
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !density?.sites) return;

    const label = shortTime(density.timestamp);
    const labels = chart.data.labels as string[];

    if (!labels.includes(label)) {
      labels.push(label);
      if (labels.length > CHART.maxPoints) labels.shift();
    }

    density.sites.forEach((site, idx) => {
      let ds = chart.data.datasets.find((d) => d.label === site.site_name);
      if (!ds) {
        ds = {
          label: site.site_name,
          data: [],
          borderColor: PALETTE[idx % PALETTE.length],
          borderWidth: 1.5,
          tension: 0.1,
          pointRadius: 0,
        };
        chart.data.datasets.push(ds);
      }
      const pts = ds.data as number[];
      pts.push(site.occupancy_percentage);
      if (pts.length > CHART.maxPoints) pts.shift();
    });

    chart.update();
  }, [density]);

  return (
    <div className="w-full h-full min-h-[300px]">
      <canvas ref={canvasRef} />
    </div>
  );
}