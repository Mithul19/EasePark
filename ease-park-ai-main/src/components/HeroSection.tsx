import { ArrowRight, Car, MapPin, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-parking.jpg";
import { getActiveSessions, FLOORS } from "@/data/userStore";

const HeroSection = () => {
  const [available, setAvailable] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const update = () => {
      const t = FLOORS.reduce((sum, f) => sum + f.rows * f.cols, 0);
      const occ = getActiveSessions().length;
      setTotal(t);
      setAvailable(t - occ);
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/30 pointer-events-none" />
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-sm font-medium shadow-card animate-fade-up">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              AI-Powered Parking Management
            </div>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Smart Parking with{" "}
              <span className="text-gradient">Machine Learning</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg animate-fade-up" style={{ animationDelay: "0.2s" }}>
              Intelligent slot prediction, automated parking allocation, and smart analytics — powered by Random Forest ML and Dijkstra's navigation.
            </p>

            <div className="flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Link to="/register">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="gap-2">
                  View Dashboard
                </Button>
              </Link>
            </div>

            {/* Live Stats */}
            <div className="flex items-center gap-6 pt-4 animate-fade-up" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Car className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-display font-bold text-2xl text-foreground">{available}</p>
                  <p className="text-xs text-muted-foreground">Spots Available</p>
                </div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-display font-bold text-2xl text-foreground">{FLOORS.length}</p>
                  <p className="text-xs text-muted-foreground">Parking Floors</p>
                </div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <p className="font-display font-bold text-2xl text-foreground">98%</p>
                  <p className="text-xs text-muted-foreground">ML Accuracy</p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="rounded-2xl overflow-hidden shadow-card-hover border">
              <img src={heroImg} alt="AI parking lot detection with vehicle bounding boxes" className="w-full h-auto" />
            </div>

            {/* Floating availability card */}
            <div className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-card border p-4 hidden lg:block animate-fade-up" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center">
                  <span className="text-accent font-display font-bold text-lg">{available}</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Live Available</p>
                  <p className="font-display font-semibold">{available} / {total}</p>
                  <div className="h-1.5 w-24 rounded-full bg-secondary mt-1 overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-1000" style={{ width: `${total ? (available / total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating ML card */}
            <div className="absolute -top-3 -right-3 bg-card rounded-xl shadow-card border px-4 py-3 hidden lg:block animate-fade-up" style={{ animationDelay: "0.6s" }}>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary text-xs font-bold">RF</span>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">ML Engine</p>
                  <p className="font-display font-semibold text-sm text-accent">Active</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
