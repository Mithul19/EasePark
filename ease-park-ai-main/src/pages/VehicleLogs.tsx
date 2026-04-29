import { useState, useMemo } from "react";
import { Search, Filter, ArrowUpDown, Car, Truck, Bike } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import { generateVehicleLogs, type VehicleLog } from "@/data/mockData";

const vehicleIcon: Record<string, React.ElementType> = {
  car: Car,
  suv: Car,
  truck: Truck,
  motorcycle: Bike,
};

export default function VehicleLogs() {
  const [logs] = useState<VehicleLog[]>(() => generateVehicleLogs());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "parked" | "exited">("all");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let result = logs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) => l.plate.toLowerCase().includes(q) || l.slotId.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((l) => l.status === statusFilter);
    }
    if (sortAsc) {
      result = [...result].reverse();
    }
    return result;
  }, [logs, search, statusFilter, sortAsc]);

  const parkedCount = logs.filter((l) => l.status === "parked").length;
  const exitedCount = logs.filter((l) => l.status === "exited").length;
  const totalRevenue = logs.reduce((sum, l) => sum + (l.fee ?? 0), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Currently Parked</p>
              <p className="text-3xl font-display font-bold text-foreground">{parkedCount}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Exited Today</p>
              <p className="text-3xl font-display font-bold text-foreground">{exitedCount}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-3xl font-display font-bold text-accent">₹{totalRevenue.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plate, slot, log ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            {(["all", "parked", "exited"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize",
                  statusFilter === s ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          <button onClick={() => setSortAsc(!sortAsc)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto">
            <ArrowUpDown className="h-3.5 w-3.5" />
            {sortAsc ? "Oldest first" : "Newest first"}
          </button>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Log ID</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Slot</TableHead>
                  <TableHead>Entry Time</TableHead>
                  <TableHead>Exit Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Fee</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => {
                  const VIcon = vehicleIcon[log.vehicleType] ?? Car;
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">{log.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <VIcon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-xs capitalize">{log.vehicleType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{log.plate}</TableCell>
                      <TableCell>{log.slotId}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(log.entryTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="text-xs">
                        {log.exitTime
                          ? new Date(log.exitTime).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs">{log.duration ?? "—"}</TableCell>
                      <TableCell className="text-right font-medium">
                        {log.fee != null ? `₹${log.fee}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={log.status === "parked" ? "default" : "secondary"}
                          className={cn(
                            "text-xs capitalize",
                            log.status === "parked" ? "bg-accent text-accent-foreground" : ""
                          )}
                        >
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No vehicle logs found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
