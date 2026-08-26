import { SiteHeader } from "@/components/site-header";
import { Chatbot } from "@/components/chatbot";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <Chatbot />
    </div>
  );
}
