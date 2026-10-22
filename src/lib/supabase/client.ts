import { createBrowserClient } from "@supabase/ssr";
import { authCookieOptions } from "@/lib/supabase/cookie-options";
import { isRecoveryCallback, recoveryStore } from "@/lib/supabase/recovery";

export function createClient() {
  // Capture before SDK initialization removes the callback parameters.
  const callback = typeof window !== "undefined" && isRecoveryCallback(window.location.href);
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookieOptions: authCookieOptions }
  );
  if (typeof window !== "undefined") recoveryStore.observe(client, callback);
  return client;
}
