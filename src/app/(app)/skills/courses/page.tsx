import { MonitorPlay } from "lucide-react";
import { CourseExplorer } from "@/components/skills/course-explorer";

export default function SkillsCoursesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/10 text-accent">
          <MonitorPlay className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Courses <span className="text-accent">· Course Explorer</span>
          </h1>
          <p className="text-sm text-muted">
            Filter 48 real courses by track, level, cost, and time — or follow a ready-made skill path.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <CourseExplorer />
      </div>
    </div>
  );
}
