import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Allow public content; disallow auth, logged-in tool and interactive routes.
 * Assets (CSS, JS, images) are not path-blocked here — they are required for
 * rendering. The sitemap URL is built from SITE_URL so it follows the
 * configured production origin.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/login",
        "/signup",
        "/onboard",
        "/verify-email",
        "/forgot-password",
        "/reset-password",
        "/dashboard",
        "/profile",
        "/builder",
        "/feedback",
        "/merit",
        "/money",
        "/trends",
        "/career",
        "/convince",
        "/webinars",
        "/reality-check",
        "/study",
        "/skills/chat",
        "/skills/courses/",
        "/mentors/become",
        "/pakistan/assistant",
        "/pakistan/self-assessment",
        "/pakistan/salary-insights",
        "/abroad/assistant",
        "/abroad/self-assessment",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}