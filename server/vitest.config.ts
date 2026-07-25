import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["**/node_modules/**"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      include: [
        "controllers/**/*.ts",
        "middleware/**/*.ts",
        "services/**/*.ts",
        "utils/**/*.ts",
        "constants/**/*.ts",
      ],
      exclude: ["**/node_modules/**"],
      reportsDirectory: "./coverage",
    },
  },
});
