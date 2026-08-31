"use client";

export function WishlistStep({ onSubmitted }: { onSubmitted?: () => void }) {
  void onSubmitted; // placeholder — wired up in Task 5
  return <div data-testid="wishlist-step" />;
}
