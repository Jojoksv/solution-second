#!/usr/bin/env python3
"""
Simulateur de foule & poubelles — Stade Iba Mar Diop
Jeux d'Yeux Dakar 2026 — Thème Infrastructure & Environnement

Usage:
    python simulate.py                  # génère simulation_data.json + current_state.json
    python simulate.py --watch          # mode temps-réel (met à jour current_state.json toutes les secondes)
    python simulate.py --tick 70        # snapshot unique pour le tick 70
"""

import json
import math
import random
import time
import argparse
from pathlib import Path

# ── Constantes ─────────────────────────────────────────────────────────────

STADIUM_CENTER = (14.6937, -17.4441)
STADIUM_POLYGON = [
    [14.6954, -17.4462], [14.6955, -17.4440], [14.6954, -17.4420],
    [14.6939, -17.4415], [14.6919, -17.4420], [14.6917, -17.4441],
    [14.6919, -17.4462], [14.6937, -17.4466],
]

GATES = [
    {"id": "G1", "name": "Entrée Nord-Ouest", "lat": 14.6952, "lng": -17.4458, "capacity": 800},
    {"id": "G2", "name": "Entrée Nord",        "lat": 14.6953, "lng": -17.4441, "capacity": 600},
    {"id": "G3", "name": "Entrée Nord-Est",    "lat": 14.6952, "lng": -17.4424, "capacity": 700},
    {"id": "G4", "name": "Entrée Est",         "lat": 14.6937, "lng": -17.4419, "capacity": 500},
    {"id": "G5", "name": "Entrée Sud-Est",     "lat": 14.6921, "lng": -17.4424, "capacity": 700},
    {"id": "G6", "name": "Entrée Sud",         "lat": 14.6920, "lng": -17.4441, "capacity": 900},
    {"id": "G7", "name": "Entrée Sud-Ouest",   "lat": 14.6921, "lng": -17.4458, "capacity": 800},
    {"id": "G8", "name": "Entrée Ouest",       "lat": 14.6937, "lng": -17.4462, "capacity": 600},
]

BINS = [
    {"id": "B1",  "lat": 14.6957, "lng": -17.4462, "near_gate": "G1", "label": "Poubelle Nord-Ouest"},
    {"id": "B2",  "lat": 14.6958, "lng": -17.4441, "near_gate": "G2", "label": "Poubelle Nord"},
    {"id": "B3",  "lat": 14.6957, "lng": -17.4420, "near_gate": "G3", "label": "Poubelle Nord-Est"},
    {"id": "B4",  "lat": 14.6937, "lng": -17.4412, "near_gate": "G4", "label": "Poubelle Est"},
    {"id": "B5",  "lat": 14.6916, "lng": -17.4420, "near_gate": "G5", "label": "Poubelle Sud-Est"},
    {"id": "B6",  "lat": 14.6914, "lng": -17.4441, "near_gate": "G6", "label": "Poubelle Sud"},
    {"id": "B7",  "lat": 14.6916, "lng": -17.4462, "near_gate": "G7", "label": "Poubelle Sud-Ouest"},
    {"id": "B8",  "lat": 14.6937, "lng": -17.4470, "near_gate": "G8", "label": "Poubelle Ouest"},
    {"id": "B9",  "lat": 14.6945, "lng": -17.4441, "near_gate": "G2", "label": "Poubelle Cour Nord"},
    {"id": "B10", "lat": 14.6929, "lng": -17.4441, "near_gate": "G6", "label": "Poubelle Cour Sud"},
]

MAX_LITERS = 240
MAX_PERSONS_PER_GATE = 120

# ── Facteurs pré-calculés par entité ──────────────────────────────────────

def _seeded_value(seed: int, lo: float, hi: float) -> float:
    return lo + random.Random(seed).random() * (hi - lo)

GATE_BASE_FACTORS = [_seeded_value(i * 53 + 7, 0.75, 1.25) for i in range(len(GATES))]
BIN_SPEED_FACTORS = [_seeded_value(i * 73 + 19, 0.80, 1.45) for i in range(len(BINS))]
BIN_BASELINES     = [_seeded_value(i * 97 + 11, 5.0,  15.0) for i in range(len(BINS))]

# ── Phase ──────────────────────────────────────────────────────────────────

def get_phase(real_tick: int) -> dict:
    """real_tick: 0 – 200"""
    if real_tick < 30:
        p = real_tick / 30
        return {
            "name": "pre_event", "label": "Pré-événement", "color": "#22c55e",
            "density_range": [0.12 + p * 0.38, 0.25 + p * 0.45],
        }
    if real_tick < 70:
        return {"name": "event_peak", "label": "Pic d'affluence", "color": "#ef4444",
                "density_range": [0.70, 0.95]}
    if real_tick < 90:
        return {"name": "event_ongoing", "label": "Match en cours", "color": "#f97316",
                "density_range": [0.60, 0.88]}
    decay = (real_tick - 90) / 110
    return {
        "name": "post_event", "label": "Post-événement", "color": "#eab308",
        "density_range": [max(0.04, 0.88 - decay * 0.84), max(0.08, 0.95 - decay * 0.87)],
    }

# ── Niveau densité / remplissage ───────────────────────────────────────────

def density_level(d: float) -> tuple[str, str]:
    if d > 0.75: return "critical", "#ef4444"
    if d > 0.50: return "high",     "#f97316"
    if d > 0.25: return "moderate", "#eab308"
    return "low", "#22c55e"

def fill_level(f: int) -> tuple[str, str]:
    if f >= 75: return "critical", "#ef4444"
    if f >= 50: return "high",     "#f97316"
    if f >= 25: return "moderate", "#eab308"
    return "low", "#22c55e"

# ── Simulation principale ──────────────────────────────────────────────────

def simulate(real_tick: int) -> dict:
    """Génère un snapshot complet pour real_tick ∈ [0, 200]."""
    rng = random.Random(real_tick * 137 + 42)
    phase = get_phase(real_tick)
    d_min, d_max = phase["density_range"]
    cos_lat = math.cos(math.radians(STADIUM_CENTER[0]))

    # ── Portes ──
    gates_state = []
    for i, gate in enumerate(GATES):
        global_factor = d_min + rng.random() * (d_max - d_min)
        density = min(1.0, global_factor * GATE_BASE_FACTORS[i])
        crowd = round(gate["capacity"] * density)
        level, color = density_level(density)
        gates_state.append({
            **gate,
            "density": round(density, 4),
            "crowd_count": crowd,
            "level": level,
            "color": color,
        })

    # ── Personnes : files d'attente directionnelles depuis chaque porte ──
    persons = []
    for gate in gates_state:
        count = round(MAX_PERSONS_PER_GATE * gate["density"])
        # Direction extérieure (centre stade → porte) corrigée visuellement
        d_lat = gate["lat"] - STADIUM_CENTER[0]
        d_lng_vis = (gate["lng"] - STADIUM_CENTER[1]) * cos_lat
        length = math.hypot(d_lat, d_lng_vis) or 1
        out_lat = d_lat / length
        out_lng_vis = d_lng_vis / length
        perp_lat = -out_lng_vis
        perp_lng_vis = out_lat

        for _ in range(count):
            if rng.random() < 0.85:
                # File d'attente sortante
                dist = (rng.random() ** 1.6) * 0.0011
                width = (rng.random() - 0.5) * 0.00028
                off_lat = out_lat * dist + perp_lat * width
                off_lng_vis = out_lng_vis * dist + perp_lng_vis * width
            else:
                # Marcheurs sur le périmètre
                tan = (rng.random() - 0.5) * 0.0014
                rad = (rng.random() - 0.5) * 0.0003
                off_lat = perp_lat * tan + out_lat * rad
                off_lng_vis = perp_lng_vis * tan + out_lng_vis * rad
            persons.append({
                "lat": round(gate["lat"] + off_lat, 6),
                "lng": round(gate["lng"] + off_lng_vis / cos_lat, 6),
                "gate_ref": gate["id"],
                "color": gate["color"],
            })

    # ── Poubelles ──
    avg_density = sum(g["density"] for g in gates_state) / len(gates_state)
    bins_state = []
    for i, bin_ in enumerate(BINS):
        near = next((g["density"] for g in gates_state if g["id"] == bin_["near_gate"]), avg_density)
        growth = near * BIN_SPEED_FACTORS[i] * (real_tick / 200) * 90
        fill_pct = min(100, round(BIN_BASELINES[i] + growth))
        level, color = fill_level(fill_pct)
        bins_state.append({
            **bin_,
            "fill_percent": fill_pct,
            "current_liters": round(MAX_LITERS * fill_pct / 100),
            "max_liters": MAX_LITERS,
            "level": level,
            "color": color,
            "alert": fill_pct >= 75,
        })

    # ── Alertes ──
    alerts = []
    for bin_ in bins_state:
        if bin_["alert"]:
            severity = "critical" if bin_["fill_percent"] >= 90 else "warning"
            alerts.append({
                "id": f"alert-bin-{bin_['id']}",
                "type": "bin",
                "name": bin_["label"],
                "severity": severity,
                "description": f"Niveau {bin_['fill_percent']}% — collecte urgente requise",
                "lat": bin_["lat"],
                "lng": bin_["lng"],
                "value": bin_["fill_percent"],
            })
    for gate in gates_state:
        if gate["level"] in ("critical", "high"):
            severity = "critical" if gate["level"] == "critical" else "warning"
            alerts.append({
                "id": f"alert-gate-{gate['id']}",
                "type": "crowd",
                "name": gate["name"],
                "severity": severity,
                "description": f"{gate['crowd_count']} pers. · densité {round(gate['density']*100)}%",
                "lat": gate["lat"],
                "lng": gate["lng"],
                "value": gate["crowd_count"],
            })

    total_crowd = sum(g["crowd_count"] for g in gates_state)
    max_cap = sum(g["capacity"] for g in GATES)

    return {
        "real_tick": real_tick,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "phase": phase,
        "gates": gates_state,
        "persons": persons,
        "bins": bins_state,
        "alerts": alerts,
        "stats": {
            "total_crowd": total_crowd,
            "max_capacity": max_cap,
            "occupancy_rate": round(total_crowd / max_cap * 100),
            "critical_bins": sum(1 for b in bins_state if b["alert"]),
            "active_alerts": len(alerts),
        },
    }

# ── Générateurs de fichiers ────────────────────────────────────────────────

def generate_all_ticks(output_path: str = "simulation_data.json"):
    """Génère 41 snapshots (tick 0 à 200, pas de 5)."""
    snapshots = [simulate(t) for t in range(0, 201, 5)]
    output = {
        "version": "1.0.0",
        "event": "Jeux d'Yeux Dakar 2026",
        "stadium": "Stade Iba Mar Diop",
        "theme": "Infrastructure & Environnement",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_snapshots": len(snapshots),
        "snapshots": snapshots,
    }
    path = Path(output_path)
    path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅  {len(snapshots)} snapshots → {path.resolve()}")

def generate_current_snapshot(output_path: str = "current_state.json", real_tick: int = 55):
    """Génère un snapshot unique pour un tick donné."""
    snapshot = simulate(real_tick)
    path = Path(output_path)
    path.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅  Snapshot tick {real_tick} → {path.resolve()}")

def watch_mode(output_path: str = "current_state.json", interval: float = 1.0):
    """Mode temps-réel : boucle de tick 0 → 200 avec mise à jour du JSON."""
    print(f"⏳  Mode watch — mise à jour toutes les {interval}s (Ctrl+C pour arrêter)")
    tick = 0
    while True:
        generate_current_snapshot(output_path, tick)
        tick = (tick + 5) % 205  # boucle sur 0-200
        time.sleep(interval)

# ── CLI ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Simulateur JOJ Dakar 2026 — Stade Iba Mar Diop"
    )
    parser.add_argument("--watch",  action="store_true",   help="Mode temps-réel (1s/tick)")
    parser.add_argument("--tick",   type=int, default=55,  help="Tick unique (0–200)")
    parser.add_argument("--out",    default=".",           help="Répertoire de sortie")
    args = parser.parse_args()

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    if args.watch:
        watch_mode(str(out_dir / "current_state.json"))
    else:
        generate_all_ticks(str(out_dir / "simulation_data.json"))
        generate_current_snapshot(str(out_dir / "current_state.json"), args.tick)
        print("\nPour démarrer le mode temps-réel : python simulate.py --watch")
