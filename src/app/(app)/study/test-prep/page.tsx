import { Badge } from "@/components/ui/badge";
import { TestPrepHub } from "@/components/study/test-prep-hub";

export const metadata = {
  title: "Test Prep — aftermediate",
  description:
    "Every entry test across Pakistan and abroad in one place: MDCAT, NET, ECAT, IELTS, SAT and more — with patterns, fees, lecture playlists and resources.",
};

export default function TestPrepPage() {
  return (
    <div data-tour="test-prep" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="animate-reveal flex items-center gap-2">
        <Badge variant="info">Resources</Badge>
        <span className="font-mono text-xs text-faint">all tests · one place</span>
      </div>
      <h1
        className="animate-reveal mt-3 text-3xl font-extrabold tracking-tight text-ink sm:text-5xl"
        style={{ animationDelay: "60ms" }}
      >
        Test prep, everything in one place.
      </h1>
      <p
        className="animate-reveal mt-2 max-w-xl text-muted"
        style={{ animationDelay: "120ms" }}
      >
        MDCAT to IELTS, NET to SAT — every entry test from Pakistan and abroad, with patterns,
        fees, lecture playlists and resources. Pick a test to dive in.
      </p>
      <div className="animate-reveal mt-8" style={{ animationDelay: "180ms" }}>
        <TestPrepHub />
      </div>
    </div>
  );
}