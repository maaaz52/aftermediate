import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Brand } from "@/components/brand";
import { SiteFooter } from "@/components/landing/footer";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <header className="border-b-2 border-ink bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" aria-label="aftermediate home">
            <Brand nav />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted transition-colors hover:text-accent"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}