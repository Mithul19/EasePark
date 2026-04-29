// Real-time parking data hook with polling
import { useState, useEffect, useCallback } from "react";
import { getActiveSessions, FLOORS, getSessions, type ParkingSession } from "@/data/userStore";
import { generateSlots, type ParkingSlot } from "@/data/mockData";

export interface ParkingStats {
  totalSlots: number;
  available: number;
  occupied: number;
  reserved: number;
  occupancyRate: number;
  activeVehicles: number;
  todayEntries: number;
  todayExits: number;
  peakHour: string;
  floors: { floor: number; label: string; total: number; occupied: number; available: number }[];
}

function computeStats(slots: ParkingSlot[]): ParkingStats {
  const total = slots.length;
  const occupied = slots.filter(s => s.status === "occupied").length;
  const available = slots.filter(s => s.status === "available").length;
  const reserved = slots.filter(s => s.status === "reserved").length;

  const sessions = getSessions();
  const today = new Date().toDateString();
  const todaySessions = sessions.filter(s => new Date(s.entry_time).toDateString() === today);
  const todayExits = todaySessions.filter(s => s.exit_time).length;

  // Peak hour calculation
  const hourCounts: Record<number, number> = {};
  sessions.forEach(s => {
    const h = new Date(s.entry_time).getHours();
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  });
  const peakH = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
  const peakHour = peakH ? `${String(peakH[0]).padStart(2, "0")}:00` : "09:00";

  const floors = FLOORS.map(f => {
    const activeSessions = getActiveSessions().filter(s => s.selected_floor === f.floor);
    const floorTotal = f.rows * f.cols;
    const floorOccupied = activeSessions.length;
    return { floor: f.floor, label: f.label, total: floorTotal, occupied: floorOccupied, available: floorTotal - floorOccupied };
  });

  return {
    totalSlots: total,
    available,
    occupied,
    reserved,
    occupancyRate: total ? Math.round((occupied / total) * 100) : 0,
    activeVehicles: getActiveSessions().length,
    todayEntries: todaySessions.length,
    todayExits,
    peakHour,
    floors,
  };
}

export function useParkingData(pollInterval = 5000) {
  const [slots, setSlots] = useState<ParkingSlot[]>(() => generateSlots());
  const [stats, setStats] = useState<ParkingStats>(() => computeStats(generateSlots()));

  const refresh = useCallback(() => {
    const newSlots = generateSlots();
    setSlots(newSlots);
    setStats(computeStats(newSlots));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollInterval);
    return () => clearInterval(interval);
  }, [refresh, pollInterval]);

  return { slots, stats, refresh };
}
