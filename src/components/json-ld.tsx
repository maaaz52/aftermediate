/**
 * Renders JSON-LD structured data. `JSON.stringify` output is escaped so a
 * dynamic string containing "</script>" cannot break out of the script block.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}