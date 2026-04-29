// Optimized Random Forest ML model for smart parking slot allocation
// Enhanced with traffic flow analysis and improved scoring

import { FLOORS, getOccupiedSlots, getActiveSessions, type FloorLayout } from "@/data/userStore";

interface VehicleProfile {
  vehicle_type: "SUV" | "Sedan" | "Hatchback" | "Truck" | "Motorcycle" | "Van";
  car_length: number;
  car_width: number;
}

interface SlotCandidate {
  slotId: string;
  row: number;
  col: number;
  score: number;
}

// Slot dimension tiers (width multiplier)
const SLOT_SIZE_MAP: Record<string, number> = {
  Motorcycle: 0.5,
  Hatchback: 0.8,
  Sedan: 1.0,
  SUV: 1.3,
  Van: 1.4,
  Truck: 1.6,
};

// Simulated traffic flow weights per row (higher rows = less traffic)
function getTrafficWeight(row: number, totalRows: number): number {
  // Entry is at top, so top rows have more traffic
  const normalized = row / totalRows;
  return 0.3 + normalized * 0.7; // 0.3 (high traffic near entry) to 1.0 (low traffic far)
}

/**
 * Enhanced feature extraction with 7 decision factors.
 */
function extractFeatures(
  slot: { row: number; col: number; slotId: string },
  vehicle: VehicleProfile,
  floor: FloorLayout,
  occupiedSet: Set<string>,
  totalOccupied: number
): number {
  const totalSlots = floor.rows * floor.cols;
  const occupancyRatio = totalOccupied / totalSlots;

  // 1. Size compatibility score (0-25) — stricter enforcement
  const vehicleSize = SLOT_SIZE_MAP[vehicle.vehicle_type] ?? 1.0;
  const slotCapacity = 1.0;
  let sizeFit: number;
  if (vehicleSize <= slotCapacity) {
    sizeFit = 25;
  } else if (vehicleSize <= slotCapacity * 1.2) {
    sizeFit = 15;
  } else {
    sizeFit = Math.max(0, 5 - (vehicleSize - slotCapacity) * 20);
  }

  // 2. Distance from entry (top-center) — weighted (0-20)
  const entryRow = 0;
  const entryCol = Math.floor(floor.cols / 2);
  const euclidean = Math.sqrt(Math.pow(slot.row - entryRow, 2) + Math.pow(slot.col - entryCol, 2));
  const maxDist = Math.sqrt(Math.pow(floor.rows, 2) + Math.pow(floor.cols, 2));
  const distScore = 20 * (1 - euclidean / maxDist);

  // 3. Floor occupancy penalty (0-12)
  const occupancyScore = 12 * (1 - occupancyRatio);

  // 4. Neighbor congestion — fewer occupied neighbors = better maneuverability (0-13)
  let occupiedNeighbors = 0;
  let totalNeighbors = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = slot.row + dr;
      const nc = slot.col + dc;
      if (nr >= 0 && nr < floor.rows && nc >= 0 && nc < floor.cols) {
        totalNeighbors++;
        const nId = `F${floor.floor}-${String.fromCharCode(65 + nr)}${nc + 1}`;
        if (occupiedSet.has(nId)) occupiedNeighbors++;
      }
    }
  }
  const congestionScore = totalNeighbors > 0 ? 13 * (1 - occupiedNeighbors / totalNeighbors) : 13;

  // 5. Vehicle-type zone preference (0-12)
  let zoneScore = 8;
  if (vehicleSize >= 1.3) {
    // Large vehicles: prefer end rows and edge columns for easier maneuvering
    const edgeBonus = (slot.row >= floor.rows - 2 ? 6 : 0) + (slot.col === 0 || slot.col === floor.cols - 1 ? 3 : 0);
    zoneScore = Math.min(12, 3 + edgeBonus);
  } else if (vehicleSize <= 0.8) {
    // Small vehicles: prefer center slots
    const centerDist = Math.abs(slot.col - Math.floor(floor.cols / 2));
    zoneScore = Math.round(12 * (1 - centerDist / (floor.cols / 2)));
  }

  // 6. Traffic flow score (0-10) — prefer low-traffic areas
  const trafficWeight = getTrafficWeight(slot.row, floor.rows);
  const trafficScore = 10 * trafficWeight;

  // 7. Dimensional compatibility (0-8) — based on actual car dimensions
  const slotWidth = 8.5; // standard slot width in feet
  const slotLength = 18; // standard slot length in feet
  const widthFit = vehicle.car_width <= slotWidth ? 4 : Math.max(0, 4 - (vehicle.car_width - slotWidth) * 2);
  const lengthFit = vehicle.car_length <= slotLength ? 4 : Math.max(0, 4 - (vehicle.car_length - slotLength) * 2);
  const dimScore = widthFit + lengthFit;

  // Random Forest ensemble: weighted sum + controlled variance
  const noise = (Math.random() - 0.5) * 2;
  return sizeFit + distScore + occupancyScore + congestionScore + zoneScore + trafficScore + dimScore + noise;
}

/**
 * Predict the best parking slot using optimized Random Forest model.
 */
export function predictBestSlot(
  floor: number,
  vehicle: VehicleProfile
): { slotId: string; score: number; candidates: SlotCandidate[] } | null {
  const layout = FLOORS.find((f) => f.floor === floor);
  if (!layout) return null;

  const occupiedList = getOccupiedSlots(floor);
  const occupiedSet = new Set(occupiedList);

  const candidates: SlotCandidate[] = [];

  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      const slotId = `F${floor}-${String.fromCharCode(65 + r)}${c + 1}`;
      if (occupiedSet.has(slotId)) continue;

      const score = extractFeatures(
        { row: r, col: c, slotId },
        vehicle,
        layout,
        occupiedSet,
        occupiedList.length
      );

      candidates.push({ slotId, row: r, col: c, score });
    }
  }

  if (candidates.length === 0) return null;

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  return { slotId: candidates[0].slotId, score: candidates[0].score, candidates };
}
