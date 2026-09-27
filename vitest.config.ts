import { defineConfig } from "vitest/config";
import path from "path";

// Test-only configuration. The app build/dev config (vite.config.ts) is
// platform-managed and stays untouched.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
