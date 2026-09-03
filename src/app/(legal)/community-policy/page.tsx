import type { Metadata } from "next";
import { LegalPage, LegalSection, LegalList } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: "Community Policy",
};

export default function CommunityPolicyPage() {
  return (
    <LegalPage title="Community Policy" updated="September 3, 2026">
      <LegalSection title="1. Our community">
        <p>
          aftermediate&apos;s community includes our feedback &quot;Your Voice&quot; page, wishlist
          wall, webinars, and future mentor and mentorship features. We want a space that is
          respectful, honest, and helpful for students and parents.
        </p>
      </LegalSection>

      <LegalSection title="2. Be respectful">
        <LegalList
          items={[
            <>Treat other members, mentors, and staff with respect.</>,
            <>No harassment, bullying, hate speech, or personal attacks.</>,
            <>No discrimination based on race, religion, gender, province, or background.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Be honest">
        <LegalList
          items={[
            <>Do not impersonate mentors, universities, or staff.</>,
            <>Do not misrepresent your marks, qualifications, or identity.</>,
            <>Do not post fake reviews or artificially upvote your own wishes.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Stay on topic">
        <LegalList
          items={[
            <>Keep feedback and wishlist posts relevant to education and career planning.</>,
            <>No spam, ads, or promotion of unrelated services.</>,
            <>No repeatedly posting the same content.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Privacy and safety">
        <LegalList
          items={[
            <>Do not share anyone else&apos;s personal data without permission.</>,
            <>Do not share your national ID, bank, or other sensitive details publicly.</>,
            <>Be careful about sharing private marksheets or documents.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="6. What we moderate">
        <LegalList
          items={[
            <>We may remove content that breaks this policy.</>,
            <>Repeated violations may lead to a temporary or permanent ban.</>,
            <>We may hide or delete content reported by the community while we review it.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Reporting">
        <p>
          See something that breaks this policy? Report it through the feedback page and we will
          review it. You can always reach us directly with concerns.
        </p>
      </LegalSection>

      <LegalSection title="8. AI-assisted content">
        <p>
          Responses from our AI assistants are machine-generated. If you believe an assistant gave
          harmful or incorrect advice, report it — we use that feedback to improve.
        </p>
      </LegalSection>
    </LegalPage>
  );
}