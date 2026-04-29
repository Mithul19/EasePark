const techs = [
  { name: "React + TypeScript", cat: "Frontend" },
  { name: "Random Forest", cat: "ML Model" },
  { name: "Dijkstra's Algorithm", cat: "Navigation" },
  { name: "Recharts", cat: "Analytics" },
  { name: "Tailwind CSS", cat: "Styling" },
  { name: "LocalStorage API", cat: "Data Store" },
  { name: "Camera API", cat: "Image Capture" },
  { name: "Framer Motion", cat: "Animations" },
];

const TechStackSection = () => (
  <section className="py-20">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-sm font-semibold text-primary tracking-wide uppercase mb-2">Tech Stack</p>
        <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Built With Modern Technologies</h2>
      </div>
      <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
        {techs.map((t, i) => (
          <div key={t.name} className="bg-card border rounded-xl px-6 py-4 shadow-card hover:shadow-card-hover transition-all duration-300 text-center animate-fade-up group" style={{ animationDelay: `${i * 0.05}s` }}>
            <p className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">{t.name}</p>
            <p className="text-xs text-muted-foreground">{t.cat}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TechStackSection;
