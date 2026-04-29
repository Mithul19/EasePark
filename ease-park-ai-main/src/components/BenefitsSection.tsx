import { Clock, TrendingUp, Leaf, Users, Zap, ShieldCheck } from "lucide-react";

const benefits = [
  { icon: Clock, title: "Save Time", desc: "Reduce average parking time by 60% with ML-powered slot assignment and shortest-path navigation." },
  { icon: TrendingUp, title: "Increase Revenue", desc: "Maximize lot utilization with intelligent allocation — fewer empty slots, more throughput." },
  { icon: Leaf, title: "Reduce Emissions", desc: "Minimize cruising time inside the parking structure, reducing CO₂ emissions by up to 40%." },
  { icon: Users, title: "Better User Experience", desc: "Guided navigation, personalized slot selection, and seamless entry/exit flow." },
  { icon: Zap, title: "Real-Time Updates", desc: "Live occupancy tracking with instant availability updates across all floors." },
  { icon: ShieldCheck, title: "Secure & Reliable", desc: "Session-based tracking with captured vehicle images for security and accountability." },
];

export default function BenefitsSection() {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-2">Benefits</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Why Choose ParkVisionAI?</h2>
          <p className="text-muted-foreground">Our intelligent parking system delivers measurable improvements across every metric that matters.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <div
              key={b.title}
              className="group relative bg-card rounded-xl border p-6 shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-up overflow-hidden"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none group-hover:w-32 group-hover:h-32 transition-all duration-500" />
              <div className="relative">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2 text-foreground">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
