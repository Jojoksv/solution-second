// ─── Index Route ──────────────────────────────────────────────────────────
import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "./DashboardPage";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});