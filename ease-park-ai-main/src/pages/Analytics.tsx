import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, DollarSign, Clock, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import { generateHourlyOccupancy, generateDailyRevenue, generateZoneStats } from "@/data/mockData";

const COLORS = [
  "hsl(217, 91%, 50%)",   // primary
  "hsl(160, 84%, 39%)",   // accent
  "hsl(0, 84%, 60%)",     // destructive
  "hsl(45, 93%, 47%)",    // amber
];

function MetricCard({ icon: Icon, label, value, change, positive }: {
  icon: React.ElementType; label: string; value: string; change: string; positive: boolean;
}) {
  return (
    <Card className="shadow-card">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="rounded-lg p-2.5 bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-display font-bold text-foreground">{value}</p>
          <p className={cn("text-xs mt-0.5", positive ? "text-accent" : "text-destructive")}>
            {positive ? "↑" : "↓"} {change} vs last week
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [hourly] = useState(() => generateHourlyOccupancy());
  const [revenue] = useState(() => generateDailyRevenue());
  const [zones] = useState(() => generateZoneStats());

  const totalRevenue = revenue.reduce((s, d) => s + d.revenue, 0);
  const totalVehicles = revenue.reduce((s, d) => s + d.vehicles, 0);
  const avgOccupancy = Math.round(hourly.reduce((s, d) => s + d.occupancy, 0) / hourly.length);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-up">
        {/* Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard icon={DollarSign} label="Weekly Revenue" value={`₹${totalRevenue.toLocaleString()}`} change="12%" positive />
          <MetricCard icon={Users} label="Total Vehicles" value={totalVehicles.toString()} change="8%" positive />
          <MetricCard icon={TrendingUp} label="Avg Occupancy" value={`${avgOccupancy}%`} change="3%" positive />
          <MetricCard icon={Clock} label="Avg Duration" value="2h 15m" change="5%" positive={false} />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly occupancy */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-display">Hourly Occupancy Rate</CardTitle>
              <CardDescription>Today's parking lot usage by hour</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={hourly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 45%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 45%)" domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 20%, 90%)",
                        borderRadius: "0.5rem",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="occupancy"
                      stroke="hsl(217, 91%, 50%)"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "hsl(217, 91%, 50%)" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Daily revenue */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-display">Daily Revenue</CardTitle>
              <CardDescription>Revenue collected over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 45%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 45%)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 20%, 90%)",
                        borderRadius: "0.5rem",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="revenue" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zone distribution + vehicles per day */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Zone pie chart */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-display">Zone Occupancy Distribution</CardTitle>
              <CardDescription>Current occupied slots per zone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={zones}
                      dataKey="occupied"
                      nameKey="zone"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      innerRadius={50}
                      paddingAngle={3}
                      label={({ zone, occupied }) => `${zone}: ${occupied}`}
                    >
                      {zones.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle count bar */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-base font-display">Vehicles Per Day</CardTitle>
              <CardDescription>Number of vehicles parked each day</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenue}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214, 20%, 90%)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 45%)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 45%)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(214, 20%, 90%)",
                        borderRadius: "0.5rem",
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="vehicles" fill="hsl(217, 91%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Zone stats table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base font-display">Zone Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {zones.map((z, i) => (
                <div key={z.zone} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-foreground">{z.zone}</span>
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>Total Slots</span><span className="font-medium text-foreground">{z.total}</span></div>
                    <div className="flex justify-between"><span>Occupied</span><span className="font-medium text-destructive">{z.occupied}</span></div>
                    <div className="flex justify-between"><span>Available</span><span className="font-medium text-accent">{z.available}</span></div>
                    <div className="flex justify-between"><span>Revenue</span><span className="font-medium text-foreground">₹{z.revenue.toLocaleString()}</span></div>
                  </div>
                  {/* Mini progress bar */}
                  <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(z.occupied / z.total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
