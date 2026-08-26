import type { StudentProfile } from "@/lib/store";

export interface ProfileChoice {
  use: "local" | "remote";
  profile: Partial<StudentProfile>;
}

/**
 * Last-write-wins on updated_at. A single student across their own devices,
 * so a simple timestamp comparison is sufficient.
 */
export function chooseProfile(
  local: Partial<StudentProfile>,
  localUpdatedAt: string | null,
  remote: Partial<StudentProfile> | null,
  remoteUpdatedAt: string | null
): ProfileChoice {
  if (!remote) return { use: "local", profile: local };
  if (!localUpdatedAt) return { use: "remote", profile: remote };
  if (!remoteUpdatedAt) return { use: "local", profile: local };
  return Date.parse(remoteUpdatedAt) > Date.parse(localUpdatedAt)
    ? { use: "remote", profile: remote }
    : { use: "local", profile: local };
}
