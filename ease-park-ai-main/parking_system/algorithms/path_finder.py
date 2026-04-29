"""
Dijkstra's shortest path algorithm for parking navigation.

Graph represents: lanes, intersections, slots, entry points.
Uses adjacency list for efficient traversal.
"""

import heapq
import logging
from typing import Any

logger = logging.getLogger(__name__)


def _node_id(r: int, c: int, grid_cols: int, entry_col: int) -> str:
    """Get node ID for grid position."""
    if r == 0 and c == entry_col:
        return "entry"
    return f"n_{r}_{c}"


def _is_walkable(
    r: int,
    c: int,
    grid_rows: int,
    grid_cols: int,
    floor: int,
    occupied_slots: set[str],
    target_slot_id: str,
) -> bool:
    """Check if grid cell is walkable (lane, entry, or target slot)."""
    if r == 0 or r % 2 == 0 or c == 0 or c == grid_cols - 1:
        return True
    slot_row = (r - 1) // 2
    slot_col = c - 1
    slot_id = f"F{floor}-{chr(65 + slot_row)}{slot_col + 1}"
    if slot_id == target_slot_id:
        return True
    return False  # Other slots are not walkable


def build_parking_graph(
    rows: int,
    cols: int,
    floor: int,
    occupied_slots: set[str],
    target_slot_id: str,
) -> tuple[dict[str, list[tuple[str, float]]], str, str, dict[str, tuple[int, int]]]:
    """
    Build graph for parking floor. Only lanes, entry, and target slot are walkable.

    Returns:
        (adjacency_list, entry_node_id, target_node_id, node_positions)
    """
    grid_rows = rows * 2 + 1
    grid_cols = cols + 2
    entry_col = grid_cols // 2

    adj: dict[str, list[tuple[str, float]]] = {}
    positions: dict[str, tuple[int, int]] = {}

    def add_edge(a: str, b: str, w: float = 1.0) -> None:
        if a not in adj:
            adj[a] = []
        if not any(x[0] == b for x in adj[a]):
            adj[a].append((b, w))

    target_node = ""
    positions["entry"] = (0, entry_col)
    adj["entry"] = []

    for r in range(grid_rows):
        for c in range(grid_cols):
            if not _is_walkable(r, c, grid_rows, grid_cols, floor, occupied_slots, target_slot_id):
                continue
            nid = _node_id(r, c, grid_cols, entry_col)
            positions[nid] = (r, c)
            if nid == "entry":
                continue
            slot_row = (r - 1) // 2 if r > 0 else 0
            slot_col = c - 1 if r % 2 == 1 else 0
            if r % 2 == 1 and 1 <= c < grid_cols - 1:
                slot_id = f"F{floor}-{chr(65 + slot_row)}{slot_col + 1}"
                if slot_id == target_slot_id:
                    target_node = nid

            for dr, dc in [(0, 1), (0, -1), (1, 0), (-1, 0)]:
                nr, nc = r + dr, c + dc
                if nr < 0 or nr >= grid_rows or nc < 0 or nc >= grid_cols:
                    continue
                if not _is_walkable(nr, nc, grid_rows, grid_cols, floor, occupied_slots, target_slot_id):
                    continue
                nid_b = _node_id(nr, nc, grid_cols, entry_col)
                add_edge(nid, nid_b, 1.0)
                if nid_b == "entry":
                    add_edge("entry", nid, 1.0)

    return adj, "entry", target_node, positions


def dijkstra(adj: dict[str, list[tuple[str, float]]], start: str, end: str) -> tuple[list[str], float]:
    """
    Dijkstra's algorithm. Returns (path_node_ids, total_distance).
    """
    dist: dict[str, float] = {start: 0.0}
    prev: dict[str, str | None] = {start: None}
    heap: list[tuple[float, str]] = [(0.0, start)]

    while heap:
        d, u = heapq.heappop(heap)
        if d > dist.get(u, float("inf")):
            continue
        if u == end:
            break
        for v, w in adj.get(u, []):
            alt = d + w
            if alt < dist.get(v, float("inf")):
                dist[v] = alt
                prev[v] = u
                heapq.heappush(heap, (alt, v))

    if end not in prev:
        return [], 0.0

    path: list[str] = []
    node: str | None = end
    while node:
        path.append(node)
        node = prev[node]

    path.reverse()
    return path, dist[end]


class PathFinder:
    """
    Finds shortest path from entry to assigned parking slot using Dijkstra.
    """

    def __init__(self, floor_layouts: dict[int, tuple[int, int]] | None = None) -> None:
        self.floor_layouts = floor_layouts or {1: (5, 8), 2: (5, 8), 3: (4, 8), 4: (3, 8)}

    def find_path(
        self,
        floor: int,
        target_slot_id: str,
        occupied_slots: set[str],
    ) -> dict[str, Any]:
        """
        Compute best path from entry to target slot.

        Returns:
            {
                "path_nodes": list of node IDs,
                "path_positions": list of (row, col),
                "total_distance": float,
                "navigation_path": human-readable steps
            }
        """
        if floor not in self.floor_layouts:
            logger.warning("Unknown floor %d", floor)
            return {"path_nodes": [], "path_positions": [], "total_distance": 0.0, "navigation_path": []}

        rows, cols = self.floor_layouts[floor]
        adj, entry, target_node, positions = build_parking_graph(
            rows, cols, floor, occupied_slots, target_slot_id
        )

        if not target_node or target_node not in adj:
            logger.warning("Target slot %s not in graph", target_slot_id)
            return {"path_nodes": [], "path_positions": [], "total_distance": 0.0, "navigation_path": []}

        path_nodes, total_dist = dijkstra(adj, entry, target_node)
        path_positions = [positions[n] for n in path_nodes if n in positions]

        # Navigation path: compact directions
        nav_path = []
        for i, node in enumerate(path_nodes):
            if node == "entry":
                nav_path.append("Start at entry")
            elif node == target_node:
                nav_path.append(f"Arrive at slot {target_slot_id}")
                break
            elif i > 0 and path_nodes[i - 1] in positions and node in positions:
                pr, pc = positions[path_nodes[i - 1]]
                r, c = positions[node]
                if r > pr:
                    nav_path.append("Go down")
                elif r < pr:
                    nav_path.append("Go up")
                elif c > pc:
                    nav_path.append("Go right")
                else:
                    nav_path.append("Go left")

        logger.info(
            "Path found: %d nodes, distance=%.1f to %s",
            len(path_nodes), total_dist, target_slot_id,
        )

        return {
            "path_nodes": path_nodes,
            "path_positions": path_positions,
            "total_distance": total_dist,
            "navigation_path": nav_path,
        }
