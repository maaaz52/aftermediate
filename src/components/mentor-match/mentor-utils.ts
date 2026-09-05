import type { Availability, MentorField } from "./mentor-match-page";

// ── Shared constants ──

export const AVAILABILITY_CONFIG: Record<
  Availability,
  { dot: string; label: string }
> = {
  available: { dot: "bg-emerald", label: "Available this week" },
  limited: { dot: "bg-amber", label: "1-2 slots open" },
  booked: { dot: "bg-danger", label: "Fully booked — join waitlist" },
};

export const FIELD_GRADIENTS: Record<MentorField, string> = {
  engineering: "linear-gradient(135deg, #d99a2b, #f59e0b)",
  medical: "linear-gradient(135deg, #1c9e62, #10b981)",
  tech: "linear-gradient(135deg, #2f55d4, #4a6cf0)",
  business: "linear-gradient(135deg, #7a5bd4, #8b5cf6)",
  arts: "linear-gradient(135deg, #e1306c, #f472b6)",
  "civil-services": "linear-gradient(135deg, #566073, #8a93a6)",
};

export const PLATFORM_COLORS: Record<string, string> = {
  instagram: "#e1306c",
  discord: "#5865f2",
  whatsapp: "#25d366",
  email: "#566073",
  linkedin: "#0a66c2",
};

// ── Helpers ──

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}
