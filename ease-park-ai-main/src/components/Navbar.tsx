import { Car, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/data/userStore";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const links = ["Features", "Architecture", "How It Works", "Contact"];
  const user = getCurrentUser();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <Car className="h-6 w-6 text-primary" />
          <span>ParkVision<span className="text-primary">AI</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              {l}
            </a>
          ))}
          <Link to={user ? "/dashboard" : "/register"}>
            <Button size="sm">{user ? "Dashboard" : "Get Started"}</Button>
          </Link>
        </div>

        <button className="md:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t bg-background p-4 space-y-3">
          {links.map((l) => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, "-")}`} className="block text-sm font-medium text-muted-foreground" onClick={() => setOpen(false)}>
              {l}
            </a>
          ))}
          <Link to={user ? "/dashboard" : "/register"} onClick={() => setOpen(false)}>
            <Button size="sm" className="w-full">{user ? "Dashboard" : "Get Started"}</Button>
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
