import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => (
  <section id="contact" className="py-20">
    <div className="container">
      <div className="bg-hero-gradient rounded-2xl p-10 md:p-16 text-center text-primary-foreground relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-foreground/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Ready to Automate Your Parking?</h2>
          <p className="text-primary-foreground/80 max-w-lg mx-auto mb-8">
            Deploy ParkVisionAI in your parking facility and start saving time, reducing costs, and improving the parking experience with machine learning.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="gap-2 shadow-lg">
                Get Started Free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                View Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default CTASection;
