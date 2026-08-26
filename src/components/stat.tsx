import { ExternalLink } from "lucide-react";
import type { Stat } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SourceTag({ stat, className }: { stat: Stat; className?: string }) {
  return (
    <a
      href={stat.source_url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium text-faint transition-colors hover:text-saffron",
        className
      )}
    >
      <span className="font-mono">{stat.source}</span>
      <span className="text-faint">·</span>
      <span className="font-mono">{stat.year}</span>
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

export function StatCard({
  stat,
  label,
  accent = "saffron",
  className,
}: {
  stat: Stat;
  label: string;
  accent?: "saffron" | "emerald" | "danger" | "info" | "violet";
  className?: string;
}) {
  const accentText: Record<string, string> = {
    saffron: "text-saffron",
    emerald: "text-emerald",
    danger: "text-danger",
    info: "text-info",
    violet: "text-violet",
  };
  return (
    <div className={cn("card-glass rounded-2xl p-5", className)}>
      <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
      <p className={cn("mt-2 font-mono text-2xl font-bold leading-none", accentText[accent])}>
        {stat.value}
      </p>
      <div className="mt-3">
        <SourceTag stat={stat} />
      </div>
    </div>
  );
}
