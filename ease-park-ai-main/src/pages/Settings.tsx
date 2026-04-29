import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Car, Calendar, Ruler, Mail, Settings as SettingsIcon, Save, Building2, TreeDeciduous, HardDrive } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { getCurrentUser, getUsers, type UserAccount, FLOORS } from "@/data/userStore";

const VEHICLE_TYPES: UserAccount["vehicle_type"][] = ["SUV", "Sedan", "Hatchback", "Truck", "Motorcycle", "Van"];

export default function Settings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getCurrentUser();

  const [profile, setProfile] = useState({
    name: "", age: "", date_of_birth: "", registered_member_name: "",
    vehicle_number: "", license_plate: "", car_length: "", car_width: "",
    vehicle_type: "Sedan" as UserAccount["vehicle_type"],
    email: "",
  });

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    setProfile({
      name: user.name,
      age: String(user.age),
      date_of_birth: user.date_of_birth,
      registered_member_name: user.registered_member_name,
      vehicle_number: user.vehicle_number,
      license_plate: user.license_plate,
      car_length: String(user.car_length),
      car_width: String(user.car_width),
      vehicle_type: user.vehicle_type,
      email: user.email,
    });
  }, [user, navigate]);

  const set = (key: string, val: string) => setProfile(p => ({ ...p, [key]: val }));

  const handleSaveProfile = () => {
    if (!user) return;
    const users = getUsers();
    const idx = users.findIndex(u => u.user_id === user.user_id);
    if (idx === -1) return;
    users[idx] = {
      ...users[idx],
      name: profile.name,
      age: Number(profile.age),
      date_of_birth: profile.date_of_birth,
      registered_member_name: profile.registered_member_name,
      vehicle_number: profile.vehicle_number,
      license_plate: profile.license_plate,
      car_length: Number(profile.car_length),
      car_width: Number(profile.car_width),
      vehicle_type: profile.vehicle_type,
    };
    localStorage.setItem("pv_users", JSON.stringify(users));
    toast({ title: "Profile updated!", description: "Your account settings have been saved." });
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-up">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <h2 className="font-display text-2xl font-bold text-foreground">Settings</h2>
        </div>

        {/* User Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> User Profile
            </CardTitle>
            <CardDescription>Manage your personal information and vehicle details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input value={profile.name} onChange={e => set("name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input value={profile.email} disabled className="opacity-60" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Age</label>
                <Input type="number" value={profile.age} onChange={e => set("age", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Date of Birth</label>
                <Input type="date" value={profile.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Registered Member Name</label>
                <Input value={profile.registered_member_name} onChange={e => set("registered_member_name", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Vehicle Number</label>
                <Input value={profile.vehicle_number} onChange={e => set("vehicle_number", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">License Plate</label>
                <Input value={profile.license_plate} onChange={e => set("license_plate", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Car Length (ft)</label>
                <Input type="number" step="0.1" value={profile.car_length} onChange={e => set("car_length", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Car Width (ft)</label>
                <Input type="number" step="0.1" value={profile.car_width} onChange={e => set("car_width", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Vehicle Type</label>
                <Select value={profile.vehicle_type} onValueChange={v => set("vehicle_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {VEHICLE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleSaveProfile} className="mt-6 gap-2">
              <Save className="h-4 w-4" /> Save Profile
            </Button>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Parking Floor Configuration
            </CardTitle>
            <CardDescription>Current parking facility layout and capacity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {FLOORS.map(f => (
                <div key={f.floor} className="rounded-xl border p-4 space-y-2 bg-secondary/30">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-semibold text-foreground">{f.label}</span>
                    <Badge variant="outline" className="text-xs">{f.rows * f.cols} slots</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between"><span>Rows</span><span className="font-medium text-foreground">{f.rows}</span></div>
                    <div className="flex justify-between"><span>Columns</span><span className="font-medium text-foreground">{f.cols}</span></div>
                    <div className="flex justify-between"><span>Slot Size</span><span className="font-medium text-foreground">8.5 × 18 ft</span></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ML Model Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <TreeDeciduous className="h-5 w-5 text-primary" /> ML Model Configuration
            </CardTitle>
            <CardDescription>Random Forest model parameters for slot prediction</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: "Algorithm", value: "Random Forest" },
                { label: "Features", value: "7 (size, type, distance, occupancy, zone, congestion, traffic)" },
                { label: "Scoring Range", value: "0 – 100" },
                { label: "Size Compatibility Weight", value: "30%" },
                { label: "Distance Weight", value: "25%" },
                { label: "Occupancy Weight", value: "15%" },
                { label: "Congestion Weight", value: "15%" },
                { label: "Zone Preference Weight", value: "15%" },
                { label: "Navigation", value: "Dijkstra's Shortest Path" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Storage Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" /> Image Storage
            </CardTitle>
            <CardDescription>Vehicle image capture and storage configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Storage Type", value: "Azure Blob + local cache fallback" },
                { label: "Image Format", value: "JPEG" },
                { label: "Folder Structure", value: "captured_images/user_{id}/session_{id}.jpg" },
                { label: "Capture Source", value: "Browser Camera API" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
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
