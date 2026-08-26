import type { Metadata, Viewport } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "aftermediate — your post-FSc compass",
    template: "%s · aftermediate",
  },
  description:
    "AI-driven, hyper-localized career counseling and university entry-roadmap platform for Pakistani FSc, ICS, I.Com and A-Level students.",
};

export const viewport: Viewport = {
  themeColor: "#08080d",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-background text-ink antialiased">
        <AuthProvider>
          <StudentProvider>{children}</StudentProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
