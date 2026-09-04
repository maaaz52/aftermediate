const AVATAR_PALETTES: Record<string, string[]> = {
  geometric: ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444"],
  abstract: ["#f59e0b", "#06b6d4", "#a855f7", "#ec4899", "#84cc16"],
  minimal: ["#f59e0b", "#64748b", "#0ea5e9", "#22c55e", "#f97316"],
};

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function generateAvatarSvg(style: string | undefined, seed: string): string {
  const h = hashStr(seed);
  const palette = AVATAR_PALETTES[style ?? "geometric"] ?? AVATAR_PALETTES.geometric;
  const bg = palette[h % palette.length];
  const fg = palette[(h + 2) % palette.length];
  const letter = (seed.charAt(0) || "A").toUpperCase();

  return `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
    <rect width="80" height="80" rx="16" fill="${bg}"/>
    <circle cx="${20 + (h % 40)}" cy="${20 + ((h >> 3) % 40)}" r="${12 + (h % 8)}" fill="${fg}" opacity="0.3"/>
    <text x="40" y="52" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="32" fill="white">${letter}</text>
  </svg>`;
}
