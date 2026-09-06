import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import Link from "next/link";
import { LegalPage, LegalSection, LegalList } from "@/components/legal/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Data Deletion",
  description: "How to request deletion of your data from aftermediate.",
  path: "/data-deletion",
});

export default function DataDeletionPage() {
  return (
    <LegalPage title="Data Deletion & Account Removal" updated="September 3, 2026">
      <LegalSection title="What we store about you">
        <p>
          When you use aftermediate, we store your account details, profile and academic
          information, practice-test history, watchlist, AI chat history, and any marksheets or
          documents you upload. All of this can be removed.
        </p>
      </LegalSection>

      <LegalSection title="How to delete your account and data">
        <LegalList
          items={[
            <>
              <strong>Self-service (recommended):</strong> delete your account from the{" "}
              <Link href="/profile" className="font-semibold text-accent underline underline-offset-2">
                profile page
              </Link>{" "}
              — sign out afterwards to clear locally stored data.
            </>,
            <>
              <strong>Request deletion:</strong> contact us through the{" "}
              <Link href="/feedback" className="font-semibold text-accent underline underline-offset-2">
                feedback page
              </Link>{" "}
              with the email address you signed up with, and we will process the request.
            </>,
            <>
              <strong>Data-only removal:</strong> if you only want marks, uploads, or chat history
              removed but want to keep your account, edit or remove that data from your profile.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="What happens after deletion">
        <LegalList
          items={[
            <>Your account will no longer be able to sign in.</>,
            <>Profile data, practice history, watchlist, and chat history are removed or anonymised.</>,
            <>
              We may keep minimal records where required by law (for example, to prevent fraud or
              resolve disputes), but these will not include your marks or personal profile.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="How long it takes">
        <p>
          Self-service deletion is immediate. Manual requests are typically completed within 30
          days of verification.
        </p>
      </LegalSection>

      <LegalSection title="Browser / local data">
        <p>
          Some data is cached in your browser (localStorage) so the app loads fast. Deleting your
          account removes server data; to clear local copies, clear your browser&apos;s site data
          for aftermediate.
        </p>
      </LegalSection>
    </LegalPage>
  );
}