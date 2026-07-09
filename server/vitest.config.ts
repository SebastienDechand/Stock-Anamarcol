import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "controllers/**/*.ts",
        "middleware/**/*.ts",
        "utils/**/*.ts",
        "constants/**/*.ts",
        "errors.utils.ts",
      ],
      exclude: ["**/node_modules/**"],
      reportsDirectory: "./coverage",
    },
  },
});
