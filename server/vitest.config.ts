import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**"],
    setupFiles: ["./vitest.setup.ts"],
    hookTimeout: 30000,
    coverage: {
      provider: "v8",
      include: [
        "controllers/**/*.ts",
        "middleware/**/*.ts",
        "services/**/*.ts",
        "utils/**/*.ts",
        "constants/**/*.ts",
      ],
      exclude: ["**/node_modules/**", "utils/testDb/**", "utils/testAuth/**"],
      reportsDirectory: "./coverage",
    },
  },
});
