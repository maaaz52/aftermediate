import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
      <p className="font-mono text-xs uppercase tracking-widest text-muted">
        Last updated · {updated}
      </p>
      <h1 className="mt-3 text-3xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
        {title}
      </h1>
      <div className="mt-10 space-y-10">{children}</div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-ink sm:text-xl">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
        {children}
      </div>
    </section>
  );
}

export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 marker:text-accent">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}