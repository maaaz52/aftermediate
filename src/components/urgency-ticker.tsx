const facts = [
  "1 in 15 MDCAT candidates gets a seat",
  "NUST NET is 75% of your merit",
  "merit lists close while you decide",
  "HEC funded 4,000+ foreign scholarships",
  "IT exports hit $4.6B — up 18% in a year",
  "youth unemployment rose to 12.6%",
  "admissions open in weeks, not months",
  "FAST CS closes near 75%",
];

export function UrgencyTicker() {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center">
      {facts.map((f) => (
        <span key={key + f} className="flex items-center gap-4 px-5 font-mono text-xs uppercase tracking-wider text-white/90">
          {f}
          <span className="text-white/40">◆</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="overflow-hidden border-y-2 border-ink bg-accent py-3">
      <div className="marquee-track">
        {row("a")}
        {row("b")}
      </div>
    </div>
  );
}