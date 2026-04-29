import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, CarFront, MapPin, Navigation, CheckCircle2, TreeDeciduous } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/DashboardLayout";
import {
  getCurrentUser, FLOORS,
  getOccupiedSlots, createSession, saveImage,
} from "@/data/userStore";
import { buildFloorGrid, findPath, type GridCell } from "@/lib/pathfinding";
import { predictBestSlot } from "@/lib/randomForestSlotPredictor";
import { cn } from "@/lib/utils";

type Step = "floor" | "capture" | "navigate" | "done";

export default function ParkCar() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = getCurrentUser();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState<Step>("floor");
  const [selectedFloor, setSelectedFloor] = useState<number>(1);
  const [assignedSlot, setAssignedSlot] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [predictionScore, setPredictionScore] = useState<number | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [grid, setGrid] = useState<GridCell[][] | null>(null);
  const [path, setPath] = useState<{ row: number; col: number }[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  // Floor availability counts
  const floorAvailability = FLOORS.map((f) => {
    const occupied = getOccupiedSlots(f.floor).length;
    const total = f.rows * f.cols;
    return { ...f, occupied, available: total - occupied, total };
  });

  const handleSelectFloor = () => {
    const result = predictBestSlot(selectedFloor, {
      vehicle_type: user!.vehicle_type,
      car_length: user!.car_length,
      car_width: user!.car_width,
    });
    if (!result) {
      toast({ title: "Floor full", description: "No available slots on this floor.", variant: "destructive" });
      return;
    }
    setAssignedSlot(result.slotId);
    setPredictionScore(Math.round(result.score));
    setStep("capture");
    toast({ title: "🌲 Random Forest Prediction", description: `Best slot: ${result.slotId} (confidence: ${Math.round(result.score)}%)` });
  };

  // Camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreaming(true);
      }
    } catch {
      toast({ title: "Camera unavailable", description: "Using placeholder image instead." });
      // Generate placeholder
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, 640, 480);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "24px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📷 Vehicle Image Captured", 320, 240);
      ctx.fillText(user?.license_plate || "", 320, 280);
      setCapturedImage(canvas.toDataURL("image/jpeg"));
    }
  }, [toast, user]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg");
      setCapturedImage(dataUrl);
      // Stop camera
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach((t) => t.stop());
      setStreaming(false);
    } else if (!capturedImage) {
      // Fallback placeholder
      startCamera();
    }
  };

  const [isCalculating, setIsCalculating] = useState(false);

  const handleConfirmCapture = (skip = false) => {
    if (!user || !assignedSlot) return;
    
    // START spinner
    setIsCalculating(true);
    
    // Simulate complex calculations for 1.5s
    setTimeout(async () => {
        let imgPath = "skipped";
        if (!skip && capturedImage) {
          imgPath = await saveImage(user.user_id, `temp-${Date.now()}`, capturedImage);
        }
        
        const session = createSession(user.user_id, selectedFloor, assignedSlot, imgPath);
        setSessionId(session.session_id);

        // Build grid and find path
        const occupied = new Set(getOccupiedSlots(selectedFloor));
        const floorLayout = FLOORS.find((f) => f.floor === selectedFloor)!;
        const { grid: g, entry, target } = buildFloorGrid(floorLayout.rows, floorLayout.cols, occupied, selectedFloor, assignedSlot);

        if (target) {
          // Find nearest lane cell adjacent to target for pathfinding
          const adjacentLane = [
            { row: target.row - 1, col: target.col },
            { row: target.row + 1, col: target.col },
            { row: target.row, col: target.col - 1 },
            { row: target.row, col: target.col + 1 },
          ].find((p) => p.row >= 0 && p.row < g.length && p.col >= 0 && p.col < g[0].length && g[p.row][p.col].type === "lane");

          if (adjacentLane) {
            const p = findPath(g, entry, adjacentLane);
            // Add target to path
            setPath([...p, target]);
          }
        }

        setGrid(g);
        setStep("navigate");
        setIsCalculating(false);
        toast({ 
            title: skip ? "Camera Bypassed Successfully" : "Vehicle Capture Verified!", 
            description: "Calculating optimal path... Complete! Follow the navigation guide.",
        });
    }, 1500);
  };

  const handleDone = () => {
    setStep("done");
    toast({ title: "Parked successfully!", description: `Session ${sessionId}` });
  };

  if (!user) return null;

  const cellColor: Record<GridCell["type"], string> = {
    lane: "bg-secondary",
    slot: "bg-accent/20 border border-accent/30",
    occupied: "bg-destructive/30 border border-destructive/30",
    entry: "bg-primary",
    target: "bg-accent ring-2 ring-accent",
    path: "bg-primary/40",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto animate-fade-up">
        {/* Progress Steps */}
        <div className="flex items-center gap-2 text-sm">
          {(["floor", "capture", "navigate", "done"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                step === s ? "bg-primary text-primary-foreground" :
                  (["floor", "capture", "navigate", "done"].indexOf(step) > i ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground")
              )}>
                {i + 1}
              </div>
              <span className={cn("hidden sm:inline", step === s ? "text-foreground font-medium" : "text-muted-foreground")}>
                {s === "floor" ? "Select Floor" : s === "capture" ? "Capture Image" : s === "navigate" ? "Navigate" : "Parked!"}
              </span>
              {i < 3 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Floor Selection */}
        {step === "floor" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display"><MapPin className="h-5 w-5 text-primary" />Select Parking Floor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {floorAvailability.map((f) => (
                  <button
                    key={f.floor}
                    onClick={() => setSelectedFloor(f.floor)}
                    className={cn(
                      "p-4 rounded-xl border-2 text-left transition-all",
                      selectedFloor === f.floor ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display font-semibold">{f.label}</span>
                      <Badge variant={f.available > 0 ? "default" : "destructive"}>
                        {f.available} / {f.total} free
                      </Badge>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(f.available / f.total) * 100}%` }} />
                    </div>
                  </button>
                ))}
              </div>
              <Button onClick={handleSelectFloor} className="w-full gap-2"><TreeDeciduous className="h-4 w-4" />Predict Best Slot on {FLOORS.find((f) => f.floor === selectedFloor)?.label}</Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Camera Capture */}
        {step === "capture" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display"><Camera className="h-5 w-5 text-primary" />Capture Vehicle Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground flex items-center gap-3">
                Assigned slot: <Badge variant="outline" className="ml-1">{assignedSlot}</Badge>
                {predictionScore !== null && (
                  <Badge className="bg-accent/20 text-accent-foreground gap-1"><TreeDeciduous className="h-3 w-3" />RF Score: {predictionScore}</Badge>
                )}
              </div>
              <div className="relative bg-secondary rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                {capturedImage ? (
                  <img src={capturedImage} alt="Captured vehicle" className="w-full h-full object-cover" />
                ) : streaming ? (
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Camera className="h-12 w-12 mx-auto mb-2 opacity-40" />
                    <p>Click "Start Camera" to capture vehicle image</p>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex flex-col sm:flex-row gap-3">
                {isCalculating ? (
                  <div className="w-full flex items-center justify-center p-3 text-sm text-primary animate-pulse">
                     <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></span>
                     Calculating Optimal Navigation Path...
                  </div>
                ) : (
                  <>
                    {!capturedImage && !streaming && (
                      <>
                        <Button onClick={startCamera} variant="outline" className="flex-1 gap-2"><Camera className="h-4 w-4" />Start Camera</Button>
                        <Button onClick={() => handleConfirmCapture(true)} className="flex-1 gap-2"><Navigation className="h-4 w-4" />Skip Camera & Continue</Button>
                      </>
                    )}
                    {streaming && (
                      <>
                        <Button onClick={capturePhoto} className="flex-1 gap-2"><Camera className="h-4 w-4" />Capture Photo</Button>
                        <Button onClick={() => handleConfirmCapture(true)} variant="outline" className="flex-1 gap-2"><Navigation className="h-4 w-4" />Skip Camera</Button>
                      </>
                    )}
                    {capturedImage && (
                      <>
                        <Button variant="outline" onClick={() => { setCapturedImage(null); startCamera(); }} className="flex-1">Retake</Button>
                        <Button onClick={() => handleConfirmCapture(false)} className="flex-1 gap-2"><CheckCircle2 className="h-4 w-4" />Confirm & Navigate</Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Navigation */}
        {step === "navigate" && grid && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display"><Navigation className="h-5 w-5 text-primary" />Navigate to {assignedSlot}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Legend */}
              <div className="flex flex-wrap gap-3 text-xs">
                {[
                  { label: "Lane", cls: "bg-secondary" },
                  { label: "Available", cls: "bg-accent/20 border border-accent/30" },
                  { label: "Occupied", cls: "bg-destructive/30" },
                  { label: "Entry", cls: "bg-primary" },
                  { label: "Your Slot", cls: "bg-accent ring-2 ring-accent" },
                  { label: "Path", cls: "bg-primary/40" },
                ].map((l) => (
                  <span key={l.label} className="flex items-center gap-1.5">
                    <span className={cn("h-3 w-3 rounded-sm", l.cls)} />{l.label}
                  </span>
                ))}
              </div>

              {/* Grid */}
              <div className="overflow-x-auto">
                <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${grid[0].length}, minmax(28px, 1fr))` }}>
                  {grid.flat().map((cell, i) => {
                    const isPath = path.some((p) => p.row === cell.row && p.col === cell.col) && cell.type !== "entry" && cell.type !== "target";
                    return (
                      <div
                        key={i}
                        className={cn(
                          "aspect-square rounded-sm flex items-center justify-center text-[8px] font-medium transition-all",
                          isPath ? cellColor.path : cellColor[cell.type],
                          cell.type === "entry" && "text-primary-foreground",
                          cell.type === "target" && "text-accent-foreground",
                        )}
                        title={cell.type === "entry" ? "ENTRY" : cell.type === "target" ? assignedSlot || "" : ""}
                      >
                        {cell.type === "entry" && "▶"}
                        {cell.type === "target" && "P"}
                        {isPath && "·"}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/10 border border-accent/20">
                <Navigation className="h-4 w-4 text-accent shrink-0" />
                <p className="text-sm text-foreground">
                  Follow the highlighted path ({path.length} steps) from <strong>Entry</strong> to slot <strong>{assignedSlot}</strong>.
                </p>
              </div>

              <Button onClick={handleDone} className="w-full gap-2"><CheckCircle2 className="h-4 w-4" />Confirm Parked</Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Done */}
        {step === "done" && (
          <Card>
            <CardContent className="py-12 text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-accent" />
              </div>
              <h2 className="font-display text-2xl font-bold">Vehicle Parked Successfully!</h2>
              <div className="text-muted-foreground space-y-1 text-sm">
                <p>Floor: {FLOORS.find((f) => f.floor === selectedFloor)?.label}</p>
                <p>Slot: {assignedSlot}</p>
                <p>Session: {sessionId}</p>
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={() => navigate("/my-sessions")}>View Sessions</Button>
                <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
