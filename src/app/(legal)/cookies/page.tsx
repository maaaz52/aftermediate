import type { Metadata } from "next";
import { LegalPage, LegalSection, LegalList } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Cookie Policy",
};

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated="September 3, 2026">
      <LegalSection title="1. What cookies we use">
        <p>
          aftermediate uses cookies and similar local storage technologies to keep the platform
          working. We do not use advertising or cross-site tracking cookies.
        </p>
      </LegalSection>

      <LegalSection title="2. Essential cookies">
        <LegalList
          items={[
            <>
              <strong>Authentication</strong> — keep you signed in through Supabase sessions.
            </>,
            <>
              <strong>Local preferences</strong> — remember your profile and quiz data in your
              browser (localStorage) so the app loads fast and keeps state.
            </>,
            <>
              <strong>Security</strong> — help detect and prevent abuse.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="3. What we do NOT use">
        <LegalList
          items={[
            <>No advertising cookies.</>,
            <>No cross-site tracking for profiling.</>,
            <>No selling of cookie data to third parties.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Managing cookies">
        <p>
          Essential cookies cannot be disabled without breaking sign-in. You can clear site data
          and localStorage through your browser settings at any time — doing so may sign you out or
          reset your profile.
        </p>
      </LegalSection>

      <LegalSection title="5. Changes to this policy">
        <p>
          If we introduce new cookies or tracking, we will update this policy and, where required,
          ask for consent first.
        </p>
      </LegalSection>
    </LegalPage>
  );
}