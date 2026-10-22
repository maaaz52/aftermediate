"use client";

import * as React from "react";
import { Bell, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FollowEntityType } from "@/lib/source-follow";

type FollowRecord = { entity_type: FollowEntityType; entity_id: string };

export function FollowButton({
  entityType,
  entityId,
}: {
  entityType: FollowEntityType;
  entityId: string;
}) {
  const [following, setFollowing] = React.useState<boolean | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    fetch("/api/follows")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<{ follows?: FollowRecord[] }>;
      })
      .then((data) => {
        if (active) setFollowing((data.follows ?? []).some(
          (follow) => follow.entity_type === entityType && follow.entity_id === entityId
        ));
      })
      .catch(() => {
        if (active) setFollowing(false);
      });
    return () => { active = false; };
  }, [entityId, entityType]);

  async function toggleFollow() {
    if (following === null || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/follows", {
        method: following ? "DELETE" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ entityType, entityId }),
      });
      const data = await response.json().catch(() => ({})) as { error?: string; following?: boolean };
      if (!response.ok || typeof data.following !== "boolean") {
        throw new Error(data.error ?? "Could not update your follow.");
      }
      setFollowing(data.following);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update your follow.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button type="button" variant={following ? "secondary" : "outline"} size="sm" onClick={toggleFollow} disabled={saving || following === null}>
        {saving || following === null ? <Loader2 className="animate-spin" /> : following ? <Check /> : <Bell />}
        {following ? "Following" : "Follow updates"}
      </Button>
      {error && <p role="alert" className="text-xs text-danger">{error}</p>}
    </div>
  );
}
