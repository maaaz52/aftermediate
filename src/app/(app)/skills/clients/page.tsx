import { Handshake } from "lucide-react";
import { ClientPlaybook } from "@/components/skills/client-playbook";

export default function SkillsClientsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber/10 text-amber">
          <Handshake className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            Clients <span className="text-amber">· Client Playbook</span>
          </h1>
          <p className="text-sm text-muted">
            Real insider tactics for finding, pricing, and keeping clients — templates, scripts, and a quote builder.
          </p>
        </div>
      </div>
      <div className="mt-6">
        <ClientPlaybook />
      </div>
    </div>
  );
}
