import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.ts"],
  collectCoverageFrom: [
    "controllers/**/*.ts",
    "middleware/**/*.ts",
    "errors.utils.ts",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  setupFiles: ["./jest.setup.ts"],
  moduleFileExtensions: ["ts", "js", "json"],
};

export default config;
