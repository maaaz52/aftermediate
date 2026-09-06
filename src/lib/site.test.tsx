import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { JsonLd } from "@/components/json-ld";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/site";

describe("pageMetadata", () => {
  it("produces absolute canonical, og:url and og:image", () => {
    const m = pageMetadata({ title: "Test", description: "Desc", path: "/pakistan/universities" });
    const og = m.openGraph as Record<string, unknown> | undefined;
    const img = (og?.images as { url?: string; width?: number; height?: number }[] | undefined)?.[0];
    expect(m.alternates?.canonical).toBe("https://www.aftermediate.site/pakistan/universities");
    expect(og?.url).toBe("https://www.aftermediate.site/pakistan/universities");
    expect(og?.siteName).toBe("aftermediate");
    expect(og?.type).toBe("website");
    expect(img).toMatchObject({ width: 1200, height: 630 });
    expect(img?.url).toBe("https://www.aftermediate.site/opengraph-image.png");
  });
});

describe("breadcrumbJsonLd", () => {
  it("builds an absolute BreadcrumbList", () => {
    const data = breadcrumbJsonLd([
      { name: "Universities", path: "/pakistan/universities" },
      { name: "NUST", path: "/pakistan/universities/nust" },
    ]);
    expect(data["@type"]).toBe("BreadcrumbList");
    expect(data.itemListElement).toHaveLength(2);
    expect(data.itemListElement[1].item).toBe("https://www.aftermediate.site/pakistan/universities/nust");
  });
});

describe("JsonLd", () => {
  it("escapes `<` so an injected `</script>` cannot create a second script block", () => {
    const html = renderToStaticMarkup(
      <JsonLd data={{ "@type": "Thing", name: '</script><script>alert(1)</script>' }} />
    );
    // The injected "<" characters become \u003c, so the payload cannot close
    // or open another script element — exactly one of each remains.
    expect(html).toContain("\\u003c/script>");
    expect((html.match(/<script/g) ?? []).length).toBe(1);
    expect((html.match(/<\/script>/g) ?? []).length).toBe(1);
  });

  it("renders valid JSON inside the script tag", () => {
    const html = renderToStaticMarkup(<JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite" }} />);
    const json = html.replace(/^<script type="application\/ld\+json">/, "").replace(/<\/script>$/, "");
    expect(() => JSON.parse(json)).not.toThrow();
  });
});

describe("absoluteUrl", () => {
  it("joins a leading slash correctly", () => {
    expect(absoluteUrl("/x")).toBe("https://www.aftermediate.site/x");
    expect(absoluteUrl("x")).toBe("https://www.aftermediate.site/x");
  });
});