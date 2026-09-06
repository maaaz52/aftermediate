/**
 * Canonical site configuration.
 *
 * `SITE_URL` is the production origin used for canonical URLs, Open Graph and
 * structured data. Override it per environment with NEXT_PUBLIC_SITE_URL
 * (e.g. `https://preview.example.vercel.app`); it defaults to the production
 * domain so development builds are safe and absolute.
 */
import type { Metadata } from "next";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.aftermediate.site"
).replace(/\/+$/, "");

/** Resolve a site-relative path to an absolute URL. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Build a BreadcrumbList JSON-LD object for a page hierarchy. */
export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/**
 * Complete per-page metadata: title, unique description, canonical URL and
 * full Open Graph (site name, type, url, title, description, 1200×630 image).
 * Pages set their own `openGraph` here because Next.js does not deep-merge it
 * with the root layout's defaults.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  ogDescription?: string;
}): Metadata {
  const url = absoluteUrl(opts.path);
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      siteName: "aftermediate",
      type: "website",
      url,
      title: opts.title,
      description: opts.ogDescription ?? opts.description,
      images: [
        { url: absoluteUrl("/opengraph-image.png"), width: 1200, height: 630, alt: "aftermediate" },
      ],
    },
  };
}