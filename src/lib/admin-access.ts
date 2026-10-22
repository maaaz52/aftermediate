import { getServerEnv } from "@/lib/server-env";

export function parseAdminEmails(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isConfiguredAdmin(email: string | null | undefined): boolean {
  return Boolean(email) && parseAdminEmails(getServerEnv().adminEmails).has(email!.trim().toLowerCase());
}
