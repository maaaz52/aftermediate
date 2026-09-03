import type { Metadata } from "next";
import { LegalPage, LegalSection, LegalList } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="September 3, 2026">
      <LegalSection title="1. Overview">
        <p>
          aftermediate (&quot;we&quot;) respects your privacy. This policy explains what we
          collect, why we collect it, and the choices you have. It applies to every visitor and
          registered user of the platform.
        </p>
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <LegalList
          items={[
            <>
              <strong>Account information.</strong> Name, email address, and (if you choose) Google
              login information.
            </>,
            <>
              <strong>Profile and academic information.</strong> Stream, board, exam year, entry
              tests taken, matric/FSc marks, uploaded marksheets, budget, city, and career
              preferences.
            </>,
            <>
              <strong>Activity data.</strong> Practice-test attempts, quiz answers, watchlist items,
              feedback submissions, and chat history with our AI assistants.
            </>,
            <>
              <strong>Technical data.</strong> Basic usage information such as pages visited and
              browser type.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="3. How we use your information">
        <LegalList
          items={[
            <>To calculate merit, aggregates, and admission chances for your profile.</>,
            <>To personalise career, university, and study-abroad recommendations.</>,
            <>To run practice tests and track your progress.</>,
            <>To provide AI guidance that is relevant to your stream and goals.</>,
            <>To improve the platform and respond to feedback.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="4. How we store your data">
        <p>
          Your data is stored securely using third-party infrastructure (including Supabase and
          Vercel). We apply reasonable technical measures to protect it. Academic data you enter is
          used only to power the features you use — we do not sell your personal data to anyone.
        </p>
      </LegalSection>

      <LegalSection title="5. AI assistants and your data">
        <p>
          When you chat with Rahbar, Manzil, Safar, Ustaad, Hunar, or Qalam, your profile details
          may be read so the assistant can give relevant answers. Do not share sensitive personal
          data (national ID numbers, bank details) in chat. Chat history is stored so you can pick
          up where you left off.
        </p>
      </LegalSection>

      <LegalSection title="6. Marksheets and uploads">
        <p>
          Marksheet images are processed (including OCR) solely to extract marks for your profile
          and merit calculations. You can remove uploaded documents from your profile at any time.
        </p>
      </LegalSection>

      <LegalSection title="7. Third-party services">
        <LegalList
          items={[
            <>
              <strong>Supabase</strong> — authentication and database storage.
            </>,
            <>
              <strong>Google</strong> — optional sign-in (only if you choose &quot;Continue with
              Google&quot;).
            </>,
            <>
              <strong>Vercel / hosting providers</strong> — serving the site.
            </>,
          ]}
        />
        <p>
          These providers have their own privacy policies. We only share the minimum data needed to
          operate their services.
        </p>
      </LegalSection>

      <LegalSection title="8. Cookies">
        <p>
          We use essential cookies to keep you signed in and to operate the platform. We do not use
          advertising trackers. See our Cookie Policy for details.
        </p>
      </LegalSection>

      <LegalSection title="9. Children&apos;s privacy">
        <p>
          We do not knowingly collect data from children under 13. If you believe a child under 13
          has provided us personal data, contact us and we will delete it.
        </p>
      </LegalSection>

      <LegalSection title="10. Your rights">
        <LegalList
          items={[
            <>Access and correct your profile information at any time.</>,
            <>Delete your account and all associated data (see Data Deletion).</>,
            <>Opt out of non-essential communications.</>,
            <>
              Request a copy or deletion of your data by contacting us through the feedback page.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="11. Data retention">
        <p>
          We keep your data while your account is active. If you delete your account, we remove or
          anonymise your personal data within a reasonable period, except where we are required to
          keep records by law.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to this policy">
        <p>
          We may update this policy as features evolve. The latest version will always be on this
          page with a &quot;Last updated&quot; date.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          Privacy questions? Reach us through the contact form on the homepage or via the feedback
          page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}