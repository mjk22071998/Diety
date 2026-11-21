import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      thresholds: {
        statements: 85,
        lines: 85,
        functions: 85,
        branches: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "react-native": path.resolve(__dirname, "./test/mocks/react-native.tsx"),
      "react-native-svg": path.resolve(__dirname, "./test/mocks/react-native-svg.tsx"),
      "react-native-webrtc": path.resolve(__dirname, "./test/mocks/react-native-webrtc.tsx"),
    },
  },
});
