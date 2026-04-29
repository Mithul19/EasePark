"""
Dataset generator for Random Forest parking slot prediction.

Generates synthetic training data with realistic parking slot allocation
patterns for model training and validation.
"""

import logging
import random
from typing import Any

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Vehicle type encoding and typical dimensions (length, width in meters)
VEHICLE_TYPES = ["Motorcycle", "Hatchback", "Sedan", "SUV", "Van", "Truck"]
VEHICLE_DIMS = {
    "Motorcycle": (1.8, 0.8),
    "Hatchback": (4.0, 1.7),
    "Sedan": (4.5, 1.8),
    "SUV": (4.8, 1.9),
    "Van": (5.2, 2.0),
    "Truck": (5.5, 2.2),
}

# Slot size categories
SLOT_CATEGORIES = ["compact", "standard", "large"]


def _vehicle_size_category(length: float, width: float) -> str:
    """Categorize vehicle by footprint."""
    area = length * width
    if area < 2.0:
        return "compact"
    if area < 8.5:
        return "standard"
    return "large"


def _slot_size_category(slot_length: float, slot_width: float) -> str:
    """Categorize slot by dimensions."""
    area = slot_length * slot_width
    if area < 12:
        return "compact"
    if area < 18:
        return "standard"
    return "large"


def _distance_score(distance: float, max_distance: float = 50) -> float:
    """Normalize distance from entry (0-1, lower is better)."""
    return 1.0 - min(distance / max_distance, 1.0)


def _traffic_score(level: int) -> float:
    """Normalize lane traffic level (0-1, lower is better)."""
    return 1.0 - (level / 10.0)


def _compute_best_slot(row: dict[str, Any], candidates: list[dict]) -> str:
    """
    Heuristic to determine best slot for training labels.
    Prefers: compatible size, short distance, low traffic, available.
    """
    def score(c: dict) -> float:
        s = 0.0
        # Size fit: vehicle must fit
        if c["slot_length"] < row["vehicle_length"] or c["slot_width"] < row["vehicle_width"]:
            return -1e9  # Invalid
        s += 100 - (c["distance_from_entry"] * 2)
        s += (10 - c["lane_traffic_level"]) * 5
        s += 20 if c["slot_availability"] else 0
        s += random.uniform(0, 5)  # Tie-breaker
        return s

    valid = [c for c in candidates if c["slot_length"] >= row["vehicle_length"] and c["slot_width"] >= row["vehicle_width"]]
    if not valid:
        return candidates[0]["slot_id"]  # Fallback
    return max(valid, key=score)["slot_id"]


class DatasetGenerator:
    """Generate synthetic parking allocation datasets for ML training."""

    def __init__(self, seed: int = 42) -> None:
        self.rng = random.Random(seed)
        np.random.seed(seed)

    def generate_slots_for_floor(self, floor: int, rows: int, cols: int) -> list[dict]:
        """Generate slot definitions for a floor."""
        slots = []
        for r in range(rows):
            for c in range(cols):
                slot_id = f"F{floor}-{chr(65 + r)}{c + 1}"
                # Vary slot sizes slightly (compact/standard/large)
                cat = self.rng.choices(SLOT_CATEGORIES, weights=[0.3, 0.5, 0.2], k=1)[0]
                if cat == "compact":
                    length, width = 4.5, 2.0
                elif cat == "standard":
                    length, width = 5.0, 2.5
                else:
                    length, width = 5.5, 3.0
                length += self.rng.uniform(-0.2, 0.2)
                width += self.rng.uniform(-0.2, 0.2)
                # Manhattan distance from entry (top-center)
                entry_col = cols // 2
                distance = abs(r - 0) + abs(c - entry_col)
                slots.append({
                    "slot_id": slot_id,
                    "floor_number": floor,
                    "slot_length": round(length, 2),
                    "slot_width": round(width, 2),
                    "row": r,
                    "col": c,
                    "distance_from_entry": distance,
                })
        return slots

    def generate(self, n_requests: int = 5000, n_floors: int = 4) -> pd.DataFrame:
        """
        Generate training dataset with features and target.

        For each request, creates one row per candidate slot. Target = 1 if
        that slot is best for the vehicle, 0 otherwise. Model learns to score
        (vehicle, slot) pairs.

        Returns DataFrame with columns:
            vehicle_type, vehicle_length, vehicle_width, parking_slot_id,
            parking_slot_length, parking_slot_width, floor_number,
            distance_from_entry, lane_traffic_level, slot_availability,
            vehicle_size_category, slot_size_category, distance_score, traffic_score,
            best_parking_slot (1 if this slot is best, 0 otherwise)
        """
        layouts = [(1, 5, 8), (2, 5, 8), (3, 4, 8), (4, 3, 8)]
        all_slots: list[dict] = []
        for floor, rows, cols in layouts[:n_floors]:
            all_slots.extend(self.generate_slots_for_floor(floor, rows, cols))

        rows_data: list[dict] = []
        for _ in range(n_requests):
            vtype = self.rng.choice(VEHICLE_TYPES)
            vlen, vwid = VEHICLE_DIMS[vtype]
            vlen += self.rng.uniform(-0.2, 0.2)
            vwid += self.rng.uniform(-0.1, 0.1)
            vlen, vwid = round(vlen, 2), round(vwid, 2)

            floor = self.rng.choice([f for f, _, _ in layouts])
            floor_slots = [s for s in all_slots if s["floor_number"] == floor]
            # Add traffic and availability per slot
            candidates = [
                {
                    **s,
                    "lane_traffic_level": self.rng.randint(0, 10),
                    "slot_availability": 1 if self.rng.random() > 0.2 else 0,
                }
                for s in floor_slots
            ]
            best_id = _compute_best_slot(
                {"vehicle_length": vlen, "vehicle_width": vwid},
                candidates
            )

            vehicle_size_cat = _vehicle_size_category(vlen, vwid)
            for c in candidates:
                slot_size_cat = _slot_size_category(c["slot_length"], c["slot_width"])
                dist_score = _distance_score(float(c["distance_from_entry"]))
                traf_score = _traffic_score(c["lane_traffic_level"])
                rows_data.append({
                    "vehicle_type": vtype,
                    "vehicle_length": vlen,
                    "vehicle_width": vwid,
                    "parking_slot_id": c["slot_id"],
                    "parking_slot_length": c["slot_length"],
                    "parking_slot_width": c["slot_width"],
                    "floor_number": floor,
                    "distance_from_entry": c["distance_from_entry"],
                    "lane_traffic_level": c["lane_traffic_level"],
                    "slot_availability": c["slot_availability"],
                    "vehicle_size_category": vehicle_size_cat,
                    "slot_size_category": slot_size_cat,
                    "distance_score": round(dist_score, 4),
                    "traffic_score": round(traf_score, 2),
                    "best_parking_slot": 1 if c["slot_id"] == best_id else 0,
                })

        df = pd.DataFrame(rows_data)
        logger.info("Generated dataset: %d samples (%d requests), %d columns", len(df), n_requests, len(df.columns))
        return df
