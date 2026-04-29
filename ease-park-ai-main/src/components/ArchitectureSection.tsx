import { Folder, FileCode, Server, Monitor, Database, Settings, TestTube, Camera } from "lucide-react";

const folders = [
  { icon: Folder, name: "data/", desc: "User store, mock data generators, and session management", color: "text-primary" },
  { icon: FileCode, name: "lib/", desc: "Random Forest ML predictor and Dijkstra pathfinding engine", color: "text-accent" },
  { icon: Server, name: "hooks/", desc: "Real-time polling hooks and shared state management", color: "text-primary" },
  { icon: Monitor, name: "pages/", desc: "Dashboard, Park Car, Analytics, Settings, and Account pages", color: "text-accent" },
  { icon: Database, name: "components/", desc: "Reusable UI components, parking map, and navigation display", color: "text-primary" },
  { icon: Camera, name: "capture/", desc: "Vehicle image capture module using Browser Camera API", color: "text-accent" },
  { icon: Settings, name: "config/", desc: "Floor layouts, slot dimensions, and ML model parameters", color: "text-primary" },
  { icon: TestTube, name: "tests/", desc: "Unit tests for pathfinding, prediction, and data modules", color: "text-accent" },
];

const ArchitectureSection = () => (
  <section id="architecture" className="py-20">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-2">Architecture</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Modular Project Structure</h2>
        <p className="text-muted-foreground">Clean, production-ready architecture with separate modules for ML, navigation, capture, and data management.</p>
      </div>
      <div className="max-w-3xl mx-auto bg-card rounded-2xl border shadow-card overflow-hidden">
        <div className="bg-secondary/70 px-6 py-3 border-b flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-destructive/60" />
            <span className="h-3 w-3 rounded-full bg-accent/40" />
            <span className="h-3 w-3 rounded-full bg-accent/60" />
          </div>
          <span className="text-xs font-mono text-muted-foreground ml-2">ParkVisionAI/</span>
        </div>
        <div className="divide-y">
          {folders.map((f, i) => (
            <div key={f.name} className="flex items-center gap-4 px-6 py-4 hover:bg-secondary/30 transition-colors animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <f.icon className={`h-5 w-5 ${f.color} shrink-0`} />
              <div className="min-w-0">
                <p className="font-mono font-semibold text-sm text-foreground">{f.name}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-6 py-3 border-t bg-secondary/30 flex flex-wrap gap-4 text-xs font-mono text-muted-foreground">
          <span>package.json</span>
          <span>vite.config.ts</span>
          <span>tailwind.config.ts</span>
          <span>README.md</span>
        </div>
      </div>
    </div>
  </section>
);

export default ArchitectureSection;
