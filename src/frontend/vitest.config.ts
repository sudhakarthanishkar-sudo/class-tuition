import { fileURLToPath, URL } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/**
 * Test-only configuration. It mirrors the `@` and `declarations` aliases from
 * `vite.config.js` so component tests resolve the same modules the app does,
 * and pins a single-fork pool so the suite runs deterministically in the
 * container regardless of ambient worker settings.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "declarations",
        replacement: fileURLToPath(new URL("../declarations", import.meta.url)),
      },
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
    dedupe: ["@icp-sdk/core"],
  },
  test: {
    environment: "jsdom",
    globals: false,
    pool: "forks",
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: 1,
      },
    },
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
