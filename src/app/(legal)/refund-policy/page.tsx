import type { Metadata } from "next";
import { pageMetadata } from "@/lib/site";
import { LegalPage, LegalSection, LegalList } from "@/components/legal/legal-page";

export const metadata: Metadata = pageMetadata({
  title: "Refund Policy",
  description: "aftermediate's refund policy for paid services.",
  path: "/refund-policy",
});

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund Policy" updated="September 3, 2026">
      <LegalSection title="1. Overview">
        <p>
          aftermediate is currently free to use. This policy explains how refunds would work for
          any paid features we introduce in the future (for example, premium plans, paid webinars,
          or mentorship bookings).
        </p>
      </LegalSection>

      <LegalSection title="2. Free services">
        <p>
          All current features — merit calculators, practice tests, AI assistants, career data, and
          study-abroad tools — are free. There is nothing to refund for free usage.
        </p>
      </LegalSection>

      <LegalSection title="3. Paid services (if and when introduced)">
        <LegalList
          items={[
            <>
              <strong>Subscription plans:</strong> if we introduce a subscription, you may cancel
              at any time. Refunds for the current billing period are generally not issued, but
              cancellation stops future charges.
            </>,
            <>
              <strong>One-time purchases:</strong> digital products (courses, reports, webinar
              recordings) are refundable within 7 days of purchase if you have not accessed the
              full content.
            </>,
            <>
              <strong>Service bookings:</strong> mentor sessions or paid consultations cancelled at
              least 24 hours in advance are fully refundable; cancellations inside 24 hours may be
              non-refundable.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="4. How to request a refund">
        <p>
          Contact us through the feedback page or the contact form with your email and the payment
          reference. We respond to refund requests within 7 business days. Approved refunds are
          returned to the original payment method within 5–10 business days.
        </p>
      </LegalSection>

      <LegalSection title="5. Non-refundable cases">
        <LegalList
          items={[
            <>Usage already fully delivered (e.g. attended sessions, downloaded complete content).</>,
            <>Claims based on admission, visa, or scholarship outcomes (we do not guarantee results).</>,
            <>Requests made more than 30 days after the purchase date.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="6. Changes to this policy">
        <p>
          We will update this policy before introducing any paid feature. The latest version will
          always be on this page with a &quot;Last updated&quot; date.
        </p>
      </LegalSection>
    </LegalPage>
  );
}