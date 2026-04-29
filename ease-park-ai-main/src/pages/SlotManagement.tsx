import { useState, useMemo } from "react";
import { Plus, Pencil, Trash2, Save, X, Search, CircleParking, Zap, Accessibility, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import { generateSlots, type ParkingSlot, type SlotStatus, ZONES } from "@/data/mockData";
import { useToast } from "@/hooks/use-toast";

const typeIcons: Record<string, React.ElementType> = {
  standard: CircleParking,
  ev: Zap,
  handicap: Accessibility,
  vip: Crown,
};

const statusColors: Record<SlotStatus, string> = {
  available: "bg-accent/10 text-accent border-accent/30",
  occupied: "bg-destructive/10 text-destructive border-destructive/30",
  reserved: "bg-primary/10 text-primary border-primary/30",
  disabled: "bg-muted text-muted-foreground border-muted",
};

const PRICING: Record<ParkingSlot["type"], number> = {
  standard: 40,
  ev: 60,
  handicap: 30,
  vip: 100,
};

export default function SlotManagement() {
  const [slots, setSlots] = useState<ParkingSlot[]>(() => generateSlots());
  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<SlotStatus>("available");
  const [editType, setEditType] = useState<ParkingSlot["type"]>("standard");
  const { toast } = useToast();

  const filtered = useMemo(() => {
    let result = slots;
    if (zoneFilter !== "all") result = result.filter((s) => s.zone === zoneFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((s) => s.id.toLowerCase().includes(q) || (s.vehiclePlate?.toLowerCase().includes(q) ?? false));
    }
    return result;
  }, [slots, zoneFilter, search]);

  const startEdit = (slot: ParkingSlot) => {
    setEditingId(slot.id);
    setEditStatus(slot.status);
    setEditType(slot.type);
  };

  const saveEdit = (id: string) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: editStatus, type: editType, vehiclePlate: editStatus !== "occupied" ? undefined : s.vehiclePlate, entryTime: editStatus !== "occupied" ? undefined : s.entryTime }
          : s
      )
    );
    setEditingId(null);
    toast({ title: "Slot Updated", description: `Slot ${id} has been updated successfully.` });
  };

  const toggleDisable = (id: string) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === "disabled" ? "available" : "disabled" } : s
      )
    );
    toast({ title: "Slot Toggled", description: `Slot ${id} status changed.` });
  };

  const zoneStats = ZONES.map((z) => {
    const zoneSlots = slots.filter((s) => s.zone === z);
    return {
      zone: z,
      total: zoneSlots.length,
      available: zoneSlots.filter((s) => s.status === "available").length,
      occupied: zoneSlots.filter((s) => s.status === "occupied").length,
      disabled: zoneSlots.filter((s) => s.status === "disabled").length,
    };
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        {/* Zone overview cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {zoneStats.map((z) => (
            <Card
              key={z.zone}
              className={cn(
                "shadow-card cursor-pointer transition-all hover:shadow-card-hover",
                zoneFilter === z.zone && "ring-2 ring-primary"
              )}
              onClick={() => setZoneFilter(zoneFilter === z.zone ? "all" : z.zone)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-lg text-foreground">Zone {z.zone}</span>
                  <Badge variant="outline" className="text-xs">{z.total} slots</Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <p className="font-bold text-accent">{z.available}</p>
                    <p className="text-muted-foreground">Open</p>
                  </div>
                  <div>
                    <p className="font-bold text-destructive">{z.occupied}</p>
                    <p className="text-muted-foreground">Full</p>
                  </div>
                  <div>
                    <p className="font-bold text-muted-foreground">{z.disabled}</p>
                    <p className="text-muted-foreground">Off</p>
                  </div>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-destructive" style={{ width: `${(z.occupied / z.total) * 100}%` }} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pricing info */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-display">Slot Pricing (per hour)</CardTitle>
            <CardDescription>Current pricing configuration for each slot type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.entries(PRICING) as [ParkingSlot["type"], number][]).map(([type, price]) => {
                const Icon = typeIcons[type] ?? CircleParking;
                return (
                  <div key={type} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize text-foreground">{type}</p>
                      <p className="text-xs text-muted-foreground">₹{price}/hr</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search slot ID or plate…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex items-center gap-2">
            {["all", ...ZONES].map((z) => (
              <button
                key={z}
                onClick={() => setZoneFilter(z)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                  zoneFilter === z ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {z === "all" ? "All" : `Zone ${z}`}
              </button>
            ))}
          </div>
        </div>

        {/* Slots table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Slot ID</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Price/hr</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((slot) => {
                  const isEditing = editingId === slot.id;
                  const TypeIcon = typeIcons[isEditing ? editType : slot.type] ?? CircleParking;
                  const currentStatus = isEditing ? editStatus : slot.status;
                  const currentType = isEditing ? editType : slot.type;

                  return (
                    <TableRow key={slot.id}>
                      <TableCell className="font-mono font-medium">{slot.id}</TableCell>
                      <TableCell>Zone {slot.zone}</TableCell>
                      <TableCell>
                        {isEditing ? (
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as ParkingSlot["type"])}
                            className="text-xs border rounded-md px-2 py-1 bg-background text-foreground"
                          >
                            {["standard", "ev", "handicap", "vip"].map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <TypeIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs capitalize">{slot.type}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value as SlotStatus)}
                            className="text-xs border rounded-md px-2 py-1 bg-background text-foreground"
                          >
                            {["available", "occupied", "reserved", "disabled"].map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <Badge variant="outline" className={cn("text-xs capitalize", statusColors[slot.status])}>
                            {slot.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">{slot.vehiclePlate ?? "—"}</TableCell>
                      <TableCell className="text-xs">₹{PRICING[currentType]}</TableCell>
                      <TableCell className="text-right">
                        {isEditing ? (
                          <div className="flex items-center gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(slot.id)}>
                              <Save className="h-3.5 w-3.5 text-accent" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                              <X className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-end">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(slot)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleDisable(slot.id)}>
                              {slot.status === "disabled" ? (
                                <Plus className="h-3.5 w-3.5 text-accent" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              )}
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
