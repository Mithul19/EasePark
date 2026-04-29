import { TreeDeciduous, BarChart3, Shield, Zap, Database, Navigation } from "lucide-react";

const features = [
  { icon: TreeDeciduous, title: "Random Forest Slot Allocation", desc: "ML-powered slot prediction considers vehicle size, type, dimensions, occupancy, and distance to assign the optimal parking spot." },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Track occupancy trends, peak hours, and revenue with interactive charts." },
  { icon: Navigation, title: "Smart Path Navigation", desc: "Dijkstra's shortest path algorithm guides vehicles from the entry gate to their assigned slot." },
  { icon: Zap, title: "Real-Time Tracking", desc: "Vehicle entry/exit tracking with automatic license plate recognition." },
  { icon: Database, title: "Data Management", desc: "Persistent database stores all parking records, user accounts, and session logs." },
  { icon: Shield, title: "Secure & Scalable", desc: "Modular architecture with separate account, parking, navigation, and capture modules." },
];

const FeaturesSection = () => (
  <section id="features" className="py-20 bg-secondary/50">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-2">Features</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Everything You Need for Smart Parking</h2>
        <p className="text-muted-foreground">A complete AI-powered system from detection to dashboard, built with modern computer vision and web technologies.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => (
          <div key={f.title} className="group bg-card rounded-xl border p-6 shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <f.icon className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-display font-semibold text-lg mb-2">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
