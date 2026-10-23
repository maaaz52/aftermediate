"use client";

import Markdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

/**
 * Models occasionally omit the required space after Markdown markers (for
 * example, `##Next steps`). CommonMark then treats the marker as plain text,
 * leaving visible # signs in the response. Repair those harmless formatting
 * mistakes before handing the message to the Markdown renderer.
 */
export function normalizeChatMarkdown(content: string): string {
  return content
    .replace(/\\\[\s*/g, () => "$$\n")
    .replace(/\s*\\\]/g, () => "\n$$")
    .replace(/^(\s{0,3}#{1,6})([^\s#])/gm, "$1 $2")
    .replace(/^(\s{0,3}\d+\.)(?=\S)/gm, "$1 ")
    .replace(/^(\s{0,3}[-+*])(?=[\p{L}\p{N}])/gmu, "$1 ");
}

export function MessageContent({ children }: { children: string }) {
  return (
    <div className="min-w-0 font-[inherit] text-[1.0625rem] font-normal leading-[1.7] tracking-normal text-ink [&_h1]:mt-7 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:leading-snug [&_h2]:mt-6 [&_h2]:border-b [&_h2]:border-neutral-200 [&_h2]:pb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:leading-snug [&_h3]:mt-5 [&_h3]:text-[1.0625rem] [&_h3]:font-bold [&_h3]:leading-snug [&_h4]:mt-4 [&_h4]:font-bold [&_p]:my-1 [&_p:first-child]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-surface-2/40 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_code]:text-saffron [&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-surface-2/60 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-sm [&_a]:font-medium [&_a]:text-saffron [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-2 [&_blockquote]:border-saffron/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted [&_hr]:my-5 [&_hr]:border-neutral-200 [&_table]:my-4 [&_table]:w-full [&_table]:min-w-[32rem] [&_table]:border-collapse [&_table]:text-left [&_table]:text-[0.95rem] [&_th]:border-b-2 [&_th]:border-neutral-300 [&_th]:bg-surface-2/50 [&_th]:px-3 [&_th]:py-2 [&_th]:font-semibold [&_td]:border-b [&_td]:border-neutral-200 [&_td]:px-3 [&_td]:py-2 [&_.katex-display]:my-4 [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1">
      <div className="min-w-0 space-y-3 overflow-x-auto">
        <Markdown
          remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: false }]]}
          rehypePlugins={[rehypeKatex]}
        >
          {normalizeChatMarkdown(children)}
        </Markdown>
      </div>
    </div>
  );
}
