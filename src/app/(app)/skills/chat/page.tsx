import { MessageSquareText } from "lucide-react";
import { SkillsChat } from "@/components/skills/skills-chat";

export default function SkillsChatPage() {
  return (
    <div data-tour="hunar-ai" className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald/10 text-emerald">
          <MessageSquareText className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Hunar A.I <span className="text-emerald">· ہنر</span>
          </h1>
          <p className="text-sm text-muted">
            Your freelancing & side-hustle coach — skills, pricing, clients, and getting paid from Pakistan.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-1 flex-col overflow-hidden">
        <SkillsChat />
      </div>
    </div>
  );
}
