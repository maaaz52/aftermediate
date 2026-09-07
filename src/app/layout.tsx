import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "@fontsource/silkscreen/400.css";
import "@fontsource/silkscreen/700.css";
import "@fontsource/plus-jakarta-sans/400.css";
import "@fontsource/plus-jakarta-sans/500.css";
import "@fontsource/plus-jakarta-sans/600.css";
import "@fontsource/plus-jakarta-sans/700.css";
import "@fontsource/plus-jakarta-sans/800.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import "./globals.css";
import { StudentProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth";
import { ProfileSync } from "@/components/profile-sync";
import { JsonLd } from "@/components/json-ld";
import { SITE_URL, absoluteUrl } from "@/lib/site";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "aftermediate — your post-FSc compass",
    template: "%s · aftermediate",
  },
  description:
    "AI-driven, hyper-localized career counseling and university entry-roadmap platform for Pakistani FSc, ICS, I.Com and A-Level students.",
  alternates: { canonical: "/" },
  openGraph: {
    siteName: "aftermediate",
    type: "website",
    url: "/",
    title: "aftermediate — your post-FSc compass",
    description:
      "AI-driven, hyper-localized career counseling and university entry-roadmap platform for Pakistani FSc, ICS, I.Com and A-Level students.",
    images: [
      { url: "/opengraph-image.png", width: 1200, height: 630, alt: "aftermediate" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "aftermediate — your post-FSc compass",
    description:
      "Career counseling and university entry-roadmap platform for Pakistani FSc, ICS, I.Com and A-Level students.",
    images: ["/opengraph-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#f4f2eb",
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "aftermediate",
      url: SITE_URL,
      logo: absoluteUrl("/logos/logo-mark.png"),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "aftermediate",
      description:
        "AI-driven career counseling and university entry-roadmap platform for Pakistani FSc, ICS, I.Com and A-Level students.",
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-ink antialiased">
        {GA_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', { page_path: window.location.pathname });
            `}</Script>
          </>
        )}
        <AuthProvider>
          <StudentProvider>
            {children}
            <ProfileSync />
          </StudentProvider>
        </AuthProvider>
        <JsonLd data={orgJsonLd} />
      </body>
    </html>
  );
}
