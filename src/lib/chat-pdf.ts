import type { ChatMessage } from "@/lib/chat-request";
import { escapeHtml } from "@/lib/escape-html";

export async function exportChatAsPDF(
  messages: ChatMessage[],
  title: string,
  personaLabel: string
): Promise<void> {
  const html2pdf = (await import("html2pdf.js")).default;

  const container = document.createElement("div");
  container.style.cssText = "font-family: sans-serif; padding: 32px; max-width: 700px; color: #1a1a1a;";

  const header = document.createElement("div");
  header.style.cssText = "margin-bottom: 24px; border-bottom: 2px solid #e5e5e5; padding-bottom: 16px;";
  header.innerHTML = `
    <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;">${escapeHtml(personaLabel)}</h1>
    <p style="margin:0;font-size:13px;color:#666;">${escapeHtml(title)}</p>
    <p style="margin:4px 0 0;font-size:11px;color:#999;">Exported from Aftermediate</p>
  `;
  container.appendChild(header);

  for (const msg of messages) {
    const wrapper = document.createElement("div");
    wrapper.style.cssText = `margin: 12px 0; display: flex; ${msg.role === "user" ? "justify-content: flex-end;" : "justify-content: flex-start;"}`;

    const bubble = document.createElement("div");
    bubble.style.cssText = `
      max-width: 80%; padding: 10px 14px; border-radius: 12px; font-size: 13px; line-height: 1.6;
      ${msg.role === "user"
        ? "background: #d97706; color: white;"
        : "background: #f5f5f5; color: #1a1a1a;"}
    `;
    bubble.textContent = msg.content;
    wrapper.appendChild(bubble);
    container.appendChild(wrapper);
  }

  document.body.appendChild(container);

  await html2pdf()
    .set({
      margin: 10,
      filename: `${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(container)
    .save();

  document.body.removeChild(container);
}
