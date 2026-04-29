// ── Types ──────────────────────────────────────────────────
export type SlotStatus = "available" | "occupied" | "reserved" | "disabled";

export interface ParkingSlot {
  id: string;
  zone: string;
  number: number;
  status: SlotStatus;
  vehiclePlate?: string;
  entryTime?: string;
  type: "standard" | "ev" | "handicap" | "vip";
}

export interface VehicleLog {
  id: string;
  plate: string;
  slotId: string;
  zone: string;
  entryTime: string;
  exitTime: string | null;
  duration: string | null;
  fee: number | null;
  status: "parked" | "exited";
  vehicleType: "car" | "suv" | "truck" | "motorcycle";
}

export interface HourlyOccupancy {
  hour: string;
  occupancy: number;
  capacity: number;
}

export interface DailyRevenue {
  day: string;
  revenue: number;
  vehicles: number;
}

export interface ZoneStats {
  zone: string;
  total: number;
  occupied: number;
  available: number;
  revenue: number;
}

// ── Zones ──────────────────────────────────────────────────
export const ZONES = ["A", "B", "C", "D"] as const;

const PLATES = [
  "KA-01-AB-1234", "MH-12-CD-5678", "DL-05-EF-9012", "TN-07-GH-3456",
  "AP-09-IJ-7890", "GJ-03-KL-2345", "RJ-14-MN-6789", "UP-16-OP-0123",
  "KL-11-QR-4567", "WB-06-ST-8901", "HR-26-UV-3456", "MP-04-WX-7890",
  "PB-08-YZ-1234", "CG-10-AB-5678", "OR-02-CD-9012", "JH-15-EF-3456",
  "BR-19-GH-7890", "GA-07-IJ-2345", "HP-13-KL-6789", "UK-05-MN-0123",
];

function randomTime(hoursAgo: number): string {
  const d = new Date();
  d.setHours(d.getHours() - hoursAgo, Math.floor(Math.random() * 60));
  return d.toISOString();
}

function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── Parking Slots ──────────────────────────────────────────
export function generateSlots(): ParkingSlot[] {
  const slots: ParkingSlot[] = [];
  const types: ParkingSlot["type"][] = ["standard", "standard", "standard", "ev", "handicap", "vip"];

  ZONES.forEach((zone) => {
    for (let i = 1; i <= 25; i++) {
      const rand = Math.random();
      const status: SlotStatus =
        rand < 0.55 ? "occupied" : rand < 0.85 ? "available" : rand < 0.93 ? "reserved" : "disabled";

      slots.push({
        id: `${zone}-${String(i).padStart(2, "0")}`,
        zone,
        number: i,
        status,
        vehiclePlate: status === "occupied" ? PLATES[Math.floor(Math.random() * PLATES.length)] : undefined,
        entryTime: status === "occupied" ? randomTime(Math.floor(Math.random() * 8) + 1) : undefined,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }
  });
  return slots;
}

// ── Vehicle Logs ───────────────────────────────────────────
export function generateVehicleLogs(): VehicleLog[] {
  const logs: VehicleLog[] = [];
  const vehicleTypes: VehicleLog["vehicleType"][] = ["car", "suv", "truck", "motorcycle"];

  for (let i = 0; i < 50; i++) {
    const hoursAgo = Math.floor(Math.random() * 48) + 1;
    const entryTime = randomTime(hoursAgo);
    const isExited = Math.random() > 0.3;
    const durationMins = isExited ? Math.floor(Math.random() * 480) + 15 : null;
    const exitTime = isExited
      ? new Date(new Date(entryTime).getTime() + (durationMins! * 60000)).toISOString()
      : null;
    const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
    const slotNum = Math.floor(Math.random() * 25) + 1;

    logs.push({
      id: `LOG-${String(i + 1).padStart(4, "0")}`,
      plate: PLATES[Math.floor(Math.random() * PLATES.length)],
      slotId: `${zone}-${String(slotNum).padStart(2, "0")}`,
      zone,
      entryTime,
      exitTime,
      duration: durationMins ? formatDuration(durationMins) : null,
      fee: durationMins ? Math.round((durationMins / 60) * 40) : null,
      status: isExited ? "exited" : "parked",
      vehicleType: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
    });
  }

  return logs.sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());
}

// ── Analytics ──────────────────────────────────────────────
export function generateHourlyOccupancy(): HourlyOccupancy[] {
  const data: HourlyOccupancy[] = [];
  for (let h = 6; h <= 23; h++) {
    const label = `${String(h).padStart(2, "0")}:00`;
    const peak = h >= 9 && h <= 11 || h >= 17 && h <= 19;
    const base = peak ? 75 : 40;
    data.push({
      hour: label,
      occupancy: Math.min(100, base + Math.floor(Math.random() * 20)),
      capacity: 100,
    });
  }
  return data;
}

export function generateDailyRevenue(): DailyRevenue[] {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return days.map((day) => ({
    day,
    revenue: Math.floor(Math.random() * 8000) + 4000,
    vehicles: Math.floor(Math.random() * 150) + 60,
  }));
}

export function generateZoneStats(): ZoneStats[] {
  return ZONES.map((zone) => {
    const total = 25;
    const occupied = Math.floor(Math.random() * 18) + 5;
    return {
      zone: `Zone ${zone}`,
      total,
      occupied,
      available: total - occupied,
      revenue: Math.floor(Math.random() * 5000) + 2000,
    };
  });
}
