"use client";

import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ResumeData } from "@/lib/resume-model";
import { DARK_INPUT } from "./input-panel";

export interface IdentityTabProps {
  identity: ResumeData["identity"];
  updateIdentity: (patch: Partial<ResumeData["identity"]>) => void;
  setTargetRole: (role: string) => void;
}

const TARGET_ROLE_EXAMPLES = [
  "Junior Web Developer",
  "Pre-Med Research Intern",
  "Freelance Graphic Designer",
];

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium text-[#8a93a6]">
        {label}
      </Label>
      {children}
    </div>
  );
}

export function IdentityTab({ identity, updateIdentity, setTargetRole }: IdentityTabProps) {
  return (
    <div className="space-y-4">
      <Field label="Full name" htmlFor="builder-name">
        <Input
          id="builder-name"
          value={identity.name}
          onChange={(e) => updateIdentity({ name: e.target.value })}
          placeholder="Your name"
          className={DARK_INPUT}
        />
      </Field>

      <Field label="Email" htmlFor="builder-email">
        <Input
          id="builder-email"
          type="email"
          value={identity.email}
          onChange={(e) => updateIdentity({ email: e.target.value })}
          placeholder="you@example.com"
          className={DARK_INPUT}
        />
      </Field>

      <Field label="Phone" htmlFor="builder-phone">
        <Input
          id="builder-phone"
          type="tel"
          value={identity.phone}
          onChange={(e) => updateIdentity({ phone: e.target.value })}
          placeholder="+92-300-0000000"
          className={DARK_INPUT}
        />
      </Field>

      <Field label="Location" htmlFor="builder-location">
        <Input
          id="builder-location"
          value={identity.location}
          onChange={(e) => updateIdentity({ location: e.target.value })}
          placeholder="City, Country"
          className={DARK_INPUT}
        />
      </Field>

      <Field label="GitHub URL" htmlFor="builder-github">
        <Input
          id="builder-github"
          value={identity.github}
          onChange={(e) => updateIdentity({ github: e.target.value })}
          placeholder="https://github.com/your-handle"
          className={DARK_INPUT}
        />
      </Field>

      <Field label="LinkedIn URL" htmlFor="builder-linkedin">
        <Input
          id="builder-linkedin"
          value={identity.linkedin}
          onChange={(e) => updateIdentity({ linkedin: e.target.value })}
          placeholder="https://linkedin.com/in/your-handle"
          className={DARK_INPUT}
        />
      </Field>

      <Field label="Target role" htmlFor="builder-target-role">
        <Input
          id="builder-target-role"
          list="builder-target-roles"
          value={identity.targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. Junior Web Developer"
          className={DARK_INPUT}
        />
        <datalist id="builder-target-roles">
          {TARGET_ROLE_EXAMPLES.map((role) => (
            <option key={role} value={role} />
          ))}
        </datalist>
      </Field>

      <p className="pt-1 text-[11px] leading-relaxed text-[#555d6e]">
        Your target role drives the ATS keyword score and the skill suggestions in the Skills tab.
      </p>
    </div>
  );
}
