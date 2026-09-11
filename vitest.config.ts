import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Minimal vitest setup — runs the registry/renderer coverage guard (Rule 4) and any future
// unit tests. The "@/..." alias is defined directly (no ESM-only plugin) so the config loads
// under this repo's CommonJS resolution.
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": root },
  },
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    environment: "node",
  },
});
