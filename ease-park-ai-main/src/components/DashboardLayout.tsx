import { Car, LayoutDashboard, ClipboardList, BarChart3, Settings, Home, Menu, CircleParking, User, Clock, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getCurrentUser, logoutUser } from "@/data/userStore";

const navItems = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Park Car", icon: CircleParking, path: "/park" },
  { label: "My Sessions", icon: Clock, path: "/my-sessions" },
  { label: "Vehicle Logs", icon: ClipboardList, path: "/logs" },
  { label: "Analytics", icon: BarChart3, path: "/analytics" },
  { label: "Slot Management", icon: Settings, path: "/management" },
  { label: "My Account", icon: User, path: "/my-account" },
  { label: "Settings", icon: Settings, path: "/settings" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const user = getCurrentUser();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-background">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 px-6 h-16 border-b shrink-0">
          <Car className="h-6 w-6 text-primary" />
          <span className="font-display font-bold text-lg">
            ParkVision<span className="text-primary">AI</span>
          </span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ label, icon: Icon, path }) => {
            const active = pathname === path;
            return (
              <Link
                key={path + label}
                to={path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-3">
          {user ? (
            <>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="text-sm min-w-0">
                  <p className="font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-muted-foreground text-xs truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 w-full px-3 py-2 rounded-md text-sm bg-primary text-primary-foreground justify-center font-medium"
            >
              Sign In
            </Link>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card/80 backdrop-blur-md flex items-center px-4 lg:px-6 shrink-0 sticky top-0 z-30">
          <button className="lg:hidden mr-3" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display font-semibold text-lg truncate">
            {navItems.find((n) => n.path === pathname)?.label ?? "ParkVisionAI"}
          </h1>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
