import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Reality Check",
};

export default function RealityCheckPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="saffron">Reality Check</Badge>
        <span className="font-mono text-xs text-faint">under construction</span>
      </div>
      <h1 className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
        Reality Check
      </h1>
      <p className="animate-reveal mt-2 max-w-xl text-muted" style={{ animationDelay: "120ms" }}>
        The hard numbers behind the plan — real merit lists, closing scores, and
        what the data actually says.
      </p>

      {/* Coming soon */}
      <div className="animate-reveal mt-10 grid place-items-center border border-line bg-surface py-24 text-center" style={{ animationDelay: "180ms" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="grid h-16 w-16 place-items-center border-2 border-ink bg-saffron/10">
            <Eye className="h-7 w-7 text-saffron" />
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-faint">cooking up</p>
            <p className="mt-1 text-2xl font-extrabold text-ink">Coming soon</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
              We&apos;re building this page right now. It&apos;ll land here in the
              Resources section once it&apos;s ready.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}