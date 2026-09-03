"use client";

import * as React from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            [key: string]: unknown;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              text?: string;
              width?: string;
              [key: string]: unknown;
            }
          ) => void;
        };
      };
    };
  }
}

/**
 * Google sign-in button that talks to Google directly (Google Identity
 * Services), so no Supabase OAuth URL ever appears in the address bar.
 *
 * Loads Google's own script, renders Google's official button, and hands the
 * ID token back via `onCredential`. The caller then passes that token to
 * Supabase's `signInWithIdToken` to create the session.
 */
export function GoogleSignInButton({
  onCredential,
  clientId,
  onError,
}: {
  onCredential: (token: string) => void;
  clientId: string;
  onError?: (error: string) => void;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.google?.accounts?.id) {
      setScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => onError?.("Could not load Google sign-in.");
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [onError]);

  React.useEffect(() => {
    if (!scriptLoaded || !window.google?.accounts?.id || !containerRef.current) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => {
        if (credential) onCredential(credential);
      },
    });

    window.google.accounts.id.renderButton(containerRef.current, {
      theme: "outline",
      size: "large",
      text: "continue_with",
      width: "100%",
    });
  }, [scriptLoaded, clientId, onCredential]);

  return <div ref={containerRef} className="min-h-[44px] w-full" />;
}