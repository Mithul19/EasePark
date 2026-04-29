import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, LogOut, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import { getCurrentUser, getUserSessions, endSession, getImage, FLOORS, type ParkingSession } from "@/data/userStore";

export default function MySessions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getCurrentUser();
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [viewImage, setViewImage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    setSessions(getUserSessions(user.user_id).sort((a, b) => new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id, navigate]);

  const handleExit = (sessionId: string) => {
    endSession(sessionId);
    if (user) setSessions(getUserSessions(user.user_id).sort((a, b) => new Date(b.entry_time).getTime() - new Date(a.entry_time).getTime()));
    toast({ title: "Vehicle exited", description: "Parking session completed." });
  };

  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-up">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">My Parking Sessions</h2>
          <Button onClick={() => navigate("/park")} className="gap-2">Park New Car</Button>
        </div>

        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No parking sessions yet.</p>
              <Button onClick={() => navigate("/park")} className="mt-4">Park Your Car</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <Card key={s.session_id}>
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-semibold text-foreground">{s.parking_slot}</span>
                      <Badge variant={s.status === "active" ? "default" : "secondary"}>
                        {s.status === "active" ? "Active" : "Completed"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {FLOORS.find((f) => f.floor === s.selected_floor)?.label} · {new Date(s.entry_time).toLocaleString()}
                      {s.exit_time && ` → ${new Date(s.exit_time).toLocaleTimeString()}`}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">{s.session_id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={async () => {
                        const img = await getImage(s.captured_image_path);
                        if (img) setViewImage(img);
                        else toast({ title: "No image", description: "Image not available.", variant: "destructive" });
                      }}
                    >
                      <Image className="h-3.5 w-3.5" />View
                    </Button>
                    {s.status === "active" && (
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleExit(s.session_id)}>
                        <LogOut className="h-3.5 w-3.5" />Exit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={!!viewImage} onOpenChange={() => setViewImage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Captured Vehicle Image</DialogTitle></DialogHeader>
          {viewImage && <img src={viewImage} alt="Vehicle" className="w-full rounded-lg" />}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
