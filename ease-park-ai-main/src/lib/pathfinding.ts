// Dijkstra's shortest path algorithm for parking grid navigation

export interface GridCell {
  row: number;
  col: number;
  type: "lane" | "slot" | "occupied" | "entry" | "target" | "path";
}

/**
 * Build a parking floor grid.
 * Layout: row 0 = entry lane, odd rows = parking slots, even rows = driving lanes.
 */
export function buildFloorGrid(
  rows: number,
  cols: number,
  occupiedSlots: Set<string>,
  floor: number,
  targetSlot?: string
): { grid: GridCell[][]; entry: { row: number; col: number }; target: { row: number; col: number } | null } {
  const gridRows = rows * 2 + 1;
  const gridCols = cols + 2;
  const grid: GridCell[][] = [];

  let targetPos: { row: number; col: number } | null = null;

  for (let r = 0; r < gridRows; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < gridCols; c++) {
      if (r === 0 || r % 2 === 0 || c === 0 || c === gridCols - 1) {
        row.push({ row: r, col: c, type: "lane" });
      } else {
        const slotRow = Math.floor((r - 1) / 2);
        const slotCol = c - 1;
        const slotId = `F${floor}-${String.fromCharCode(65 + slotRow)}${slotCol + 1}`;
        const isOccupied = occupiedSlots.has(slotId);
        const isTarget = targetSlot === slotId;

        if (isTarget) {
          targetPos = { row: r, col: c };
          row.push({ row: r, col: c, type: "target" });
        } else if (isOccupied) {
          row.push({ row: r, col: c, type: "occupied" });
        } else {
          row.push({ row: r, col: c, type: "slot" });
        }
      }
    }
    grid.push(row);
  }

  const entry = { row: 0, col: Math.floor(gridCols / 2) };
  grid[entry.row][entry.col].type = "entry";

  return { grid, entry, target: targetPos };
}

/**
 * Dijkstra's algorithm to find shortest path on the grid.
 * All edge weights are 1 (uniform grid).
 */
export function findPath(
  grid: GridCell[][],
  start: { row: number; col: number },
  end: { row: number; col: number }
): { row: number; col: number }[] {
  const rows = grid.length;
  const cols = grid[0].length;

  function isWalkable(r: number, c: number): boolean {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    const t = grid[r][c].type;
    return t === "lane" || t === "entry" || t === "target";
  }

  const key = (r: number, c: number) => `${r},${c}`;
  const dist = new Map<string, number>();
  const prev = new Map<string, { row: number; col: number } | null>();
  const visited = new Set<string>();

  // Priority queue (simple array-based for grid scale)
  const queue: { row: number; col: number; d: number }[] = [];

  const startKey = key(start.row, start.col);
  dist.set(startKey, 0);
  prev.set(startKey, null);
  queue.push({ row: start.row, col: start.col, d: 0 });

  const dirs = [
    [0, 1], [0, -1], [1, 0], [-1, 0],
  ];

  while (queue.length > 0) {
    queue.sort((a, b) => a.d - b.d);
    const current = queue.shift()!;
    const ck = key(current.row, current.col);

    if (visited.has(ck)) continue;
    visited.add(ck);

    if (current.row === end.row && current.col === end.col) {
      // Reconstruct path
      const path: { row: number; col: number }[] = [];
      let node: { row: number; col: number } | null = { row: current.row, col: current.col };
      while (node) {
        path.unshift(node);
        node = prev.get(key(node.row, node.col)) ?? null;
      }
      return path;
    }

    for (const [dr, dc] of dirs) {
      const nr = current.row + dr;
      const nc = current.col + dc;
      if (!isWalkable(nr, nc)) continue;
      const nk = key(nr, nc);
      if (visited.has(nk)) continue;

      const newDist = current.d + 1;
      if (!dist.has(nk) || newDist < dist.get(nk)!) {
        dist.set(nk, newDist);
        prev.set(nk, { row: current.row, col: current.col });
        queue.push({ row: nr, col: nc, d: newDist });
      }
    }
  }

  return []; // No path found
}
