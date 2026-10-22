import { describe, expect, it } from "vitest";
import { parseAdminEmails } from "@/lib/admin-access";

describe("admin access configuration", () => {
  it("normalizes a comma-separated allowlist", () => {
    expect(parseAdminEmails(" Admin@One.test,admin.two@test ")).toEqual(new Set(["admin@one.test", "admin.two@test"]));
  });

  it("does not grant access when the allowlist is missing", () => {
    expect(parseAdminEmails(undefined)).toEqual(new Set());
  });
});
