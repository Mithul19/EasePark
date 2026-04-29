"""
Slot allocator with efficient filtering and ML-based prediction.

Filters invalid slots before running the Random Forest model to reduce
computation and improve efficiency.
"""

import logging
from typing import Any

from ..models.random_forest_model import RandomForestSlotPredictor

logger = logging.getLogger(__name__)

# Default floor layouts (rows, cols) - matches userStore FLOORS
DEFAULT_FLOOR_LAYOUTS = {
    1: (5, 8),
    2: (5, 8),
    3: (4, 8),
    4: (3, 8),
}


def build_slot_catalog(floor_layouts: dict[int, tuple[int, int]] | None = None) -> dict[str, dict]:
    """
    Build a catalog of all slots with metadata.
    Returns dict: slot_id -> {parking_slot_id, floor_number, row, col, parking_slot_length,
                             parking_slot_width, distance_from_entry, ...}
    """
    layouts = floor_layouts or DEFAULT_FLOOR_LAYOUTS
    catalog: dict[str, dict] = {}

    for floor, (rows, cols) in layouts.items():
        entry_col = cols // 2
        for r in range(rows):
            for c in range(cols):
                slot_id = f"F{floor}-{chr(65 + r)}{c + 1}"
                distance = r + abs(c - entry_col)
                # Standard slot dimensions (compact/standard/large by position)
                if r >= rows - 1:
                    length, width = 5.5, 3.0  # Large at back
                elif c in (0, cols - 1):
                    length, width = 4.5, 2.0  # Compact on edges
                else:
                    length, width = 5.0, 2.5  # Standard
                catalog[slot_id] = {
                    "parking_slot_id": slot_id,
                    "floor_number": floor,
                    "row": r,
                    "col": c,
                    "parking_slot_length": length,
                    "parking_slot_width": width,
                    "distance_from_entry": distance,
                }
    return catalog


class SlotAllocator:
    """
    Allocates the best parking slot using:
    1. Efficient pre-filtering (vehicle dimensions, availability, floor)
    2. Random Forest prediction on filtered candidates
    """

    def __init__(self, model: RandomForestSlotPredictor, slot_catalog: dict[str, dict] | None = None) -> None:
        self.model = model
        self._catalog = slot_catalog or build_slot_catalog()

    def filter_valid_slots(
        self,
        vehicle_length: float,
        vehicle_width: float,
        floor_number: int,
        occupied_slot_ids: set[str],
        slot_catalog: dict[str, dict] | None = None,
    ) -> list[dict]:
        """
        Filter slots by:
        - Vehicle dimension compatibility (slot >= vehicle)
        - Slot availability (not occupied)
        - Selected floor
        """
        catalog = slot_catalog or self._catalog
        valid: list[dict] = []
        for slot_id, meta in catalog.items():
            if meta["floor_number"] != floor_number:
                continue
            if slot_id in occupied_slot_ids:
                continue
            if meta["parking_slot_length"] < vehicle_length or meta["parking_slot_width"] < vehicle_width:
                continue
            valid.append(dict(meta))
        logger.debug(
            "Filtered %d valid slots (floor=%d, vehicle=%.2fx%.2f)",
            len(valid), floor_number, vehicle_length, vehicle_width,
        )
        return valid

    def allocate(
        self,
        vehicle_type: str,
        vehicle_length: float,
        vehicle_width: float,
        floor_number: int,
        occupied_slot_ids: set[str],
        lane_traffic_level: int = 5,
    ) -> tuple[str | None, float]:
        """
        Allocate best parking slot for the vehicle.

        Returns:
            (best_slot_id, confidence) or (None, 0.0) if no valid slot
        """
        vehicle = {
            "vehicle_type": vehicle_type,
            "vehicle_length": vehicle_length,
            "vehicle_width": vehicle_width,
        }

        candidates = self.filter_valid_slots(
            vehicle_length, vehicle_width, floor_number, occupied_slot_ids
        )
        if not candidates:
            logger.info("No valid slots for vehicle %.2fx%.2f on floor %d", vehicle_length, vehicle_width, floor_number)
            return None, 0.0

        # Enrich candidates with traffic and availability
        for c in candidates:
            c["lane_traffic_level"] = lane_traffic_level
            c["slot_availability"] = 1  # All filtered are available

        best_slot_id, confidence = self.model.predict_best_slot(vehicle, candidates)
        logger.info(
            "Allocated slot %s (confidence=%.3f) for %s on floor %d",
            best_slot_id, confidence, vehicle_type, floor_number,
        )
        return best_slot_id, confidence
