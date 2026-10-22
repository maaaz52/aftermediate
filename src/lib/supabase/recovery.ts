import type { SupabaseClient } from "@supabase/supabase-js";

export type RecoveryStatus = "idle" | "verifying" | "ready" | "error";
export const recoveryError =
  "This reset link is invalid or has expired. Request another link and open it in the same browser where you requested it.";

export function isRecoveryCallback(href: string) {
  const url = new URL(href);
  const hash = new URLSearchParams(url.hash.slice(1));
  if (hash.get("type") === "recovery") return true;
  // Email recovery is the app's only redirect-based PKCE flow. Google uses ID tokens.
  return ["/", "/reset-password"].includes(url.pathname) &&
    (url.searchParams.has("code") || url.searchParams.has("error") ||
      hash.has("error"));
}

export function createRecoveryStore() {
  let status: RecoveryStatus = "idle";
  const listeners = new Set<() => void>();
  const observed = new WeakSet<SupabaseClient>();
  const set = (next: RecoveryStatus) => {
    if (status === next) return;
    status = next;
    listeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => status,
    getServerSnapshot: (): RecoveryStatus => "idle",
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    clear: () => set("idle"),
    observe(client: SupabaseClient, callback: boolean) {
      if (observed.has(client)) return;
      observed.add(client);
      if (callback) set("verifying");
      const fail = () => { if (status === "verifying") set("error"); };
      const deadline = callback ? setTimeout(fail, 15000) : undefined;
      // Attach at client creation, before React effects or SDK initialization finish.
      client.auth.onAuthStateChange((event, session) => {
        if (event === "PASSWORD_RECOVERY" && session) {
          clearTimeout(deadline);
          set("ready");
        } else if (event === "SIGNED_OUT") {
          clearTimeout(deadline);
          set("idle");
        }
      });
      if (!callback) return;
      // The SDK owns the exchange. Calling exchangeCodeForSession here too
      // would consume the single-use code twice. initialize() shares its promise.
      void client.auth.initialize().then(() => {
        // The SDK schedules PASSWORD_RECOVERY on the next task after initialization.
        setTimeout(() => {
          clearTimeout(deadline);
          fail();
        }, 0);
      }).catch(() => {
        clearTimeout(deadline);
        fail();
      });
    },
  };
}

export const recoveryStore = createRecoveryStore();
