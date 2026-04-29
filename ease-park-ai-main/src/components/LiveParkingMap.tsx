import { useState, useEffect } from "react";
import { CarFront } from "lucide-react";
import { cn } from "@/lib/utils";
import { getActiveSessions, FLOORS } from "@/data/userStore";

export default function LiveParkingMap() {
  const [activeFloor, setActiveFloor] = useState(1);
  const [occupiedSlots, setOccupiedSlots] = useState<Set<string>>(new Set());

  useEffect(() => {
    const update = () => {
      const sessions = getActiveSessions().filter(s => s.selected_floor === activeFloor);
      setOccupiedSlots(new Set(sessions.map(s => s.parking_slot)));
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, [activeFloor]);

  const layout = FLOORS.find(f => f.floor === activeFloor);
  if (!layout) return null;

  const slots: { id: string; row: number; col: number; occupied: boolean }[] = [];
  for (let r = 0; r < layout.rows; r++) {
    for (let c = 0; c < layout.cols; c++) {
      const id = `F${activeFloor}-${String.fromCharCode(65 + r)}${c + 1}`;
      slots.push({ id, row: r, col: c, occupied: occupiedSlots.has(id) });
    }
  }

  const total = layout.rows * layout.cols;
  const occ = occupiedSlots.size;

  return (
    <section className="py-20">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-2">Live Parking Map</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Real-Time Slot Visualization</h2>
          <p className="text-muted-foreground">Watch parking availability update in real-time across all floors.</p>
        </div>

        {/* Floor tabs */}
        <div className="flex justify-center gap-2 mb-6">
          {FLOORS.map(f => (
            <button
              key={f.floor}
              onClick={() => setActiveFloor(f.floor)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                activeFloor === f.floor
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        <div className="flex justify-center gap-6 mb-6 text-sm">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-accent" /> Available ({total - occ})
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-sm bg-destructive" /> Occupied ({occ})
          </span>
        </div>

        {/* Grid */}
        <div className="max-w-3xl mx-auto bg-card rounded-2xl border shadow-card p-6">
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))` }}>
            {slots.map(slot => (
              <div
                key={slot.id}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-medium transition-all duration-500",
                  slot.occupied
                    ? "bg-destructive/15 border border-destructive/30 text-destructive"
                    : "bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20"
                )}
                title={slot.id}
              >
                <CarFront className="h-3.5 w-3.5 mb-0.5 opacity-70" />
                <span>{slot.id.split("-")[1]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
