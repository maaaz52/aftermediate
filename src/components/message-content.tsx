"use client";

import Markdown from "react-markdown";

/**
 * Models occasionally omit the required space after Markdown markers (for
 * example, `##Next steps`). CommonMark then treats the marker as plain text,
 * leaving visible # signs in the response. Repair those harmless formatting
 * mistakes before handing the message to the Markdown renderer.
 */
export function normalizeChatMarkdown(content: string): string {
  return content
    .replace(/^(\s{0,3}#{1,6})([^\s#])/gm, "$1 $2")
    .replace(/^(\s{0,3}\d+\.)(?=\S)/gm, "$1 ")
    .replace(/^(\s{0,3}[-+*])(?=[\p{L}\p{N}])/gmu, "$1 ");
}

export function MessageContent({ children }: { children: string }) {
  return (
    <div className="space-y-2 font-[inherit] text-base font-normal leading-[1.625] tracking-normal [&_h2]:mt-6 [&_h2]:border-b [&_h2]:border-neutral-200 [&_h2]:pb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:text-ink [&_h3]:mt-5 [&_h3]:text-base [&_h3]:font-bold [&_h3]:leading-snug [&_h3]:text-ink [&_p]:my-1 [&_p:first-child]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_strong]:font-semibold [&_strong]:text-ink [&_code]:rounded bg-surface-2/40 px-1 py-0.5 font-mono text-xs text-saffron [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-surface-2/60 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:text-saffron [&_a]:no-underline hover:[&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-saffron/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted">
      <Markdown>{normalizeChatMarkdown(children)}</Markdown>
    </div>
  );
}
