import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import VehicleLogs from "./pages/VehicleLogs.tsx";
import Analytics from "./pages/Analytics.tsx";
import SlotManagement from "./pages/SlotManagement.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import ParkCar from "./pages/ParkCar.tsx";
import MyAccount from "./pages/MyAccount.tsx";
import MySessions from "./pages/MySessions.tsx";
import Settings from "./pages/Settings.tsx";
import NotFound from "./pages/NotFound.tsx";
import { AIHelper } from "./components/AIHelper.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/park" element={<ParkCar />} />
          <Route path="/my-account" element={<MyAccount />} />
          <Route path="/my-sessions" element={<MySessions />} />
          <Route path="/logs" element={<VehicleLogs />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/management" element={<SlotManagement />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AIHelper />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
