import type { Metadata } from "next";
import { LegalPage, LegalSection, LegalList } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms & Conditions" updated="September 3, 2026">
      <LegalSection title="1. Acceptance of terms">
        <p>
          By accessing or using aftermediate (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), you
          agree to be bound by these Terms &amp; Conditions. If you do not agree, please do not use
          the platform.
        </p>
      </LegalSection>

      <LegalSection title="2. Who can use aftermediate">
        <p>
          aftermediate is designed for students and parents planning higher education in Pakistan
          and abroad. You must be at least 13 years old to use the platform. If you are under 18,
          we recommend using the platform with a parent or guardian&apos;s knowledge.
        </p>
      </LegalSection>

      <LegalSection title="3. Nature of the information we provide">
        <LegalList
          items={[
            <>
              <strong>Informational only.</strong> Merit calculations, aggregates, salary figures,
              admission chances, and AI responses are estimates built from publicly available,
              sourced data. They are not official admission decisions or guarantees.
            </>,
            <>
              <strong>No counselling licence.</strong> aftermediate is not a licensed career
              counsellor, financial advisor, or education agency. Always confirm critical decisions
              with official bodies (HEC, PMDC, universities, embassies).
            </>,
            <>
              <strong>AI-generated content.</strong> Responses from our AI assistants (Rahbar,
              Manzil, Safar, Ustaad, Hunar, Qalam) may contain errors. Review important claims
              against official sources.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Your account">
        <LegalList
          items={[
            <>You are responsible for keeping your login credentials safe.</>,
            <>You must provide accurate information when signing up and using the platform.</>,
            <>
              You may not create accounts to misrepresent your qualifications, marks, or identity.
            </>,
            <>You may delete your account and data at any time (see Data Deletion).</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Acceptable use">
        <LegalList
          items={[
            <>Do not misuse, reverse-engineer, or attempt to disrupt the platform.</>,
            <>Do not upload illegal content, malware, or someone else&apos;s personal data.</>,
            <>Do not use AI assistants to generate harmful or unlawful content.</>,
            <>Do not scrape, resell, or republish our content without written permission.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="6. User content">
        <p>
          You retain ownership of content you upload (for example, marksheets, essays, profile
          data). You grant us a limited licence to store and process that content so we can run the
          services you use. Feedback and wishlist submissions may be used anonymously to improve
          the platform.
        </p>
      </LegalSection>

      <LegalSection title="7. No guarantee of admission or results">
        <p>
          aftermediate helps you understand merit, entry tests, and career options. It does not
          guarantee university admission, scholarship award, visa approval, or any academic
          outcome. Decisions remain entirely your responsibility.
        </p>
      </LegalSection>

      <LegalSection title="8. Intellectual property">
        <p>
          All content, branding, data compilations, and software on aftermediate are owned by us or
          our licensors. You may use the platform for personal, non-commercial purposes only.
        </p>
      </LegalSection>

      <LegalSection title="9. Third-party links">
        <p>
          We link to official sources such as HEC, PMDC, PBS, and universities. We are not
          responsible for the content or privacy practices of external websites.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of liability">
        <p>
          To the maximum extent permitted by law, aftermediate is provided &quot;as is&quot;. We
          are not liable for any direct or indirect loss arising from use of the platform,
          including reliance on merit calculations, salary data, or AI advice.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to these terms">
        <p>
          We may update these terms from time to time. The latest version will always be available
          on this page with the &quot;Last updated&quot; date. Continued use after changes means you
          accept the revised terms.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>
          Questions about these terms? Reach us through the contact form on the homepage or via the
          feedback page.
        </p>
      </LegalSection>
    </LegalPage>
  );
}