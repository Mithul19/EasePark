import aiDetectionImg from "@/assets/ai-detection.png";

const steps = [
  { num: "01", title: "Register & Login", desc: "Create your account with vehicle details — type, dimensions, and license plate for personalized slot prediction." },
  { num: "02", title: "Select Floor & Predict", desc: "Choose a parking floor and our Random Forest ML model predicts the optimal slot based on your vehicle profile." },
  { num: "03", title: "Navigate & Park", desc: "Dijkstra's algorithm calculates the shortest path from the entry gate to your assigned slot with visual guidance." },
  { num: "04", title: "Track & Manage", desc: "Real-time dashboard shows live occupancy, session history, analytics, and captured vehicle images." },
];

const HowItWorksSection = () => (
  <section id="how-it-works" className="py-20 bg-secondary/50">
    <div className="container">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-2">How It Works</p>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-8">From Registration to Parking in 4 Steps</h2>
          <div className="space-y-6">
            {steps.map((s, i) => (
              <div key={s.num} className="flex gap-4 animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="shrink-0 h-12 w-12 rounded-xl bg-hero-gradient flex items-center justify-center">
                  <span className="font-display font-bold text-primary-foreground text-sm">{s.num}</span>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-2xl" />
            <img src={aiDetectionImg} alt="AI detection visualization" className="relative max-w-md w-full animate-fade-in rounded-xl shadow-card" />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
