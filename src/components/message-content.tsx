"use client";

import Markdown from "react-markdown";

export function MessageContent({ children }: { children: string }) {
  return (
    <div className="space-y-2 text-sm leading-relaxed [&_h2]:mt-4 [&_h2]:text-base [&_h2]:font-extrabold [&_h2]:text-ink [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-ink [&_p]:my-1 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_strong]:font-bold [&_strong]:text-ink [&_code]:rounded bg-surface-2/40 px-1 py-0.5 font-mono text-xs text-saffron [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-surface-2/60 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_a]:text-saffron [&_a]:no-underline hover:[&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-saffron/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted">
      <Markdown>{children}</Markdown>
    </div>
  );
}
