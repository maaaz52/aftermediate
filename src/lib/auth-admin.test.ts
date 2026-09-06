import { beforeEach, describe, expect, it, vi } from "vitest";
import { revokeUserSessions } from "@/lib/auth-admin";

const fetchMock = vi.fn();

vi.stubGlobal("fetch", fetchMock);

vi.mock("@/lib/server-env", () => ({
  getServerEnv: () => ({
    supabaseUrl: "https://proj.supabase.co",
    supabaseServiceRoleKey: "svc-key",
    resendApiKey: undefined,
    otpHmacSecret: undefined,
    googleModel: "x",
  }),
}));

describe("revokeUserSessions", () => {
  beforeEach(() => fetchMock.mockReset());

  it("calls the GoTrue admin logout endpoint with the user id and service-role auth", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 });
    await revokeUserSessions("user-123");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://proj.supabase.co/auth/v1/admin/logout");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ uid: "user-123" }));
    expect(init.headers).toMatchObject({ Authorization: "Bearer svc-key" });
  });

  it("does not throw when the revoke endpoint fails (best-effort)", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(revokeUserSessions("user-123")).resolves.toBeUndefined();
  });
});