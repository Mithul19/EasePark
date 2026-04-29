import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Car, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { registerUser, type UserAccount } from "@/data/userStore";

const VEHICLE_TYPES: UserAccount["vehicle_type"][] = ["SUV", "Sedan", "Hatchback", "Truck", "Motorcycle", "Van"];

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", age: "", date_of_birth: "", registered_member_name: "",
    vehicle_number: "", license_plate: "", car_length: "", car_width: "",
    vehicle_type: "Sedan" as UserAccount["vehicle_type"],
    email: "", password: "",
  });

  const set = (key: string, val: string) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      registerUser({
        name: form.name,
        age: Number(form.age),
        date_of_birth: form.date_of_birth,
        registered_member_name: form.registered_member_name,
        vehicle_number: form.vehicle_number,
        license_plate: form.license_plate,
        car_length: Number(form.car_length),
        car_width: Number(form.car_width),
        vehicle_type: form.vehicle_type,
        email: form.email,
        password: form.password,
      });
      toast({ title: "Account created!", description: "Please log in to continue." });
      navigate("/login");
    } catch (err: any) {
      toast({ title: "Registration failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-card">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Car className="h-7 w-7 text-primary" />
            <span className="font-display font-bold text-xl">ParkVision<span className="text-primary">AI</span></span>
          </div>
          <CardTitle className="font-display text-2xl">Create Account</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Register to start using the parking system</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input required type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="john@example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input required type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" minLength={6} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Age</label>
              <Input required type="number" min={16} max={120} value={form.age} onChange={(e) => set("age", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Date of Birth</label>
              <Input required type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Registered Member Name</label>
              <Input required value={form.registered_member_name} onChange={(e) => set("registered_member_name", e.target.value)} placeholder="Member name" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Vehicle Number</label>
              <Input required value={form.vehicle_number} onChange={(e) => set("vehicle_number", e.target.value)} placeholder="VH-001" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">License Plate</label>
              <Input required value={form.license_plate} onChange={(e) => set("license_plate", e.target.value)} placeholder="KA-01-AB-1234" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Car Length (ft)</label>
              <Input required type="number" step="0.1" min={3} max={30} value={form.car_length} onChange={(e) => set("car_length", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Car Width (ft)</label>
              <Input required type="number" step="0.1" min={3} max={12} value={form.car_width} onChange={(e) => set("car_width", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Vehicle Type</label>
              <Select value={form.vehicle_type} onValueChange={(v) => set("vehicle_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex flex-col gap-3 pt-2">
              <Button type="submit" className="w-full gap-2"><UserPlus className="h-4 w-4" />Create Account</Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Sign In</Link>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
