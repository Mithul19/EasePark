import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Car, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { loginUser } from "@/data/userStore";

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      loginUser(email, password);
      toast({ title: "Welcome back!", description: "You are now logged in." });
      navigate("/dashboard");
    } catch (err: any) {
      toast({ title: "Login failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Car className="h-7 w-7 text-primary" />
            <span className="font-display font-bold text-xl">ParkVision<span className="text-primary">AI</span></span>
          </div>
          <CardTitle className="font-display text-2xl">Sign In</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Log in to access your parking dashboard</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
            <Button type="submit" className="w-full gap-2"><LogIn className="h-4 w-4" />Sign In</Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account? <Link to="/register" className="text-primary font-medium hover:underline">Register</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
