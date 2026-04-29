import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import LiveParkingMap from "@/components/LiveParkingMap";
import BenefitsSection from "@/components/BenefitsSection";
import ArchitectureSection from "@/components/ArchitectureSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TechStackSection from "@/components/TechStackSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="min-h-screen">
    <Navbar />
    <HeroSection />
    <FeaturesSection />
    <LiveParkingMap />
    <BenefitsSection />
    <ArchitectureSection />
    <HowItWorksSection />
    <TechStackSection />
    <CTASection />
    <Footer />
  </div>
);

export default Index;
