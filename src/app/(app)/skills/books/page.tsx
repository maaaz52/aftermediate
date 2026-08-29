import { BookMarked } from "lucide-react";
import { BookLibrary } from "@/components/skills/book-library";

export default function SkillsBooksPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet/10 text-violet">
          <BookMarked className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Books <span className="text-violet">· Skill Library</span>
          </h1>
          <p className="text-sm text-muted">
            36 hand-picked books by skill area — with free copies, read-time estimates, and a progress queue.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <BookLibrary />
      </div>
    </div>
  );
}
