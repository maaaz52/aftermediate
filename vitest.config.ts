import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    // Heavy DOM-interaction tests (user-event typing, real animation timers)
    // cross the 5s default under full-suite parallel load.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
