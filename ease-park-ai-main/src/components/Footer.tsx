import { Car } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Park Car", path: "/park" },
  { label: "Analytics", path: "/analytics" },
  { label: "Register", path: "/register" },
  { label: "Login", path: "/login" },
  { label: "Settings", path: "/settings" },
];

const Footer = () => (
  <footer className="border-t bg-card/50">
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-display font-bold text-lg">
            <Car className="h-5 w-5 text-primary" />
            ParkVision<span className="text-primary">AI</span>
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            AI-powered smart parking system with Random Forest ML prediction and Dijkstra's navigation.
          </p>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-3 text-foreground">Quick Links</h4>
          <div className="grid grid-cols-2 gap-2">
            {footerLinks.map(l => (
              <Link key={l.path} to={l.path} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-display font-semibold mb-3 text-foreground">Technology</h4>
          <div className="flex flex-wrap gap-2">
            {["Random Forest", "Dijkstra", "React", "TypeScript", "Tailwind"].map(t => (
              <span key={t} className="text-xs bg-secondary text-secondary-foreground rounded-full px-3 py-1">{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">© 2026 ParkVisionAI. AI-Powered Smart Parking System.</p>
        <p className="text-xs text-muted-foreground">Built with Machine Learning & Love</p>
      </div>
    </div>
  </footer>
);

export default Footer;
