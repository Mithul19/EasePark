import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { User, Car, Calendar, Ruler, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DashboardLayout from "@/components/DashboardLayout";
import { getCurrentUser, getUserSessions } from "@/data/userStore";

export default function MyAccount() {
  const navigate = useNavigate();
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  if (!user) return null;

  const sessions = getUserSessions(user.user_id);
  const activeSessions = sessions.filter((s) => s.status === "active").length;

  const fields = [
    { icon: User, label: "Full Name", value: user.name },
    { icon: Mail, label: "Email", value: user.email },
    { icon: Calendar, label: "Date of Birth", value: user.date_of_birth },
    { icon: User, label: "Age", value: String(user.age) },
    { icon: User, label: "Member Name", value: user.registered_member_name },
    { icon: Car, label: "Vehicle Number", value: user.vehicle_number },
    { icon: Car, label: "License Plate", value: user.license_plate },
    { icon: Ruler, label: "Car Dimensions", value: `${user.car_length} × ${user.car_width} ft` },
    { icon: Car, label: "Vehicle Type", value: user.vehicle_type },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl mx-auto animate-fade-up">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <div className="h-24 bg-hero-gradient" />
          <CardContent className="relative pt-0 -mt-10">
            <div className="flex items-end gap-4">
              <div className="h-20 w-20 rounded-2xl bg-card border-4 border-card flex items-center justify-center shadow-card">
                <span className="font-display text-2xl font-bold text-primary">
                  {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
              </div>
              <div className="pb-1">
                <h2 className="font-display text-xl font-bold text-foreground">{user.name}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <div className="ml-auto flex gap-2">
                <Badge variant="outline">{sessions.length} sessions</Badge>
                <Badge>{activeSessions} active</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Details */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base">Account Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
                  <Icon className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground">{value}</p>
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
