import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { SkillsChat } from "@/components/skills/skills-chat";

export const metadata: Metadata = pageMetadata({
  title: "Hunar A.I",
  description: "Your freelancing & side-hustle coach — skills, pricing, clients, and getting paid from Pakistan.",
  path: "/skills/chat",
});

export default function SkillsChatPage() {
  return (
    <div data-tour="hunar-ai" className="chat-page-shell"><SkillsChat /></div>
  );
}
