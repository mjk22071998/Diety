import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 90,
        lines: 90,
        functions: 90,
        branches: 85,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "@diety/types": path.resolve(__dirname, "../../packages/types/src/index.ts"),
      "@diety/validation": path.resolve(__dirname, "../../packages/validation/src/index.ts"),
    },
  },
});
