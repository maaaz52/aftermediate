import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { LegalPage, LegalSection, LegalList } from "@/components/legal/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Disclaimer",
  description: "Important disclaimers about the information on aftermediate.",
  path: "/disclaimer",
});

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" updated="September 3, 2026">
      <LegalSection title="1. Educational information only">
        <p>
          The content on aftermediate is provided for educational and informational purposes only.
          It is not professional career, legal, financial, or visa advice.
        </p>
      </LegalSection>

      <LegalSection title="2. Merit and aggregate figures">
        <p>
          Merit calculators, aggregates (NUST, FAST, MDCAT, ECAT, and others), and &quot;admission
          chances&quot; are estimates based on publicly available closing merits and formula
          weights. Actual closing merits change every year and are decided by the respective
          institutions. A &quot;safe&quot; or &quot;reach&quot; label is a rough guide, not a
          promise.
        </p>
      </LegalSection>

      <LegalSection title="3. Salary and demand data">
        <p>
          Salary ranges and demand scores are compiled from public sources and industry reports.
          They are approximations and vary by city, employer, and experience. Do not make financial
          commitments based solely on these figures.
        </p>
      </LegalSection>

      <LegalSection title="4. AI-generated answers">
        <p>
          Responses from our AI assistants are generated from curated knowledge bases and may be
          incomplete or incorrect. Always verify critical information — admission deadlines, fees,
          visa rules, scholarship criteria — with the official source (HEC, PMDC, universities,
          embassies, scholarship providers).
        </p>
      </LegalSection>

      <LegalSection title="5. External links">
        <p>
          Where we link to official bodies, we do not control their content and are not responsible
          for the accuracy of external pages.
        </p>
      </LegalSection>

      <LegalSection title="6. No liability">
        <LegalList
          items={[
            <>We are not liable for admission decisions made by any university.</>,
            <>We are not liable for visa or scholarship outcomes.</>,
            <>We are not liable for losses from relying on estimates or AI output.</>,
          ]}
        />
        <p>
          Your education and career decisions are yours. Use aftermediate as a starting point, and
          confirm the final details with official sources.
        </p>
      </LegalSection>
    </LegalPage>
  );
}