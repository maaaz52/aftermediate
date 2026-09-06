import type { Metadata } from "next";
import { Store } from "lucide-react";
import { PlatformWarRoom } from "@/components/skills/platform-war-room";

export const metadata: Metadata = {
  title: "Platforms · Platform War Room",
};

export default function SkillsPlatformsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-info/10 text-info">
          <Store className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Platforms <span className="text-info">· Platform War Room</span>
          </h1>
          <p className="text-sm text-muted">
            Upwork, Fiverr, Toptal and more — compare fees, competition, and payouts, or let the wizard pick your start.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <PlatformWarRoom />
      </div>
    </div>
  );
}
