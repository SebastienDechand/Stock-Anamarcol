module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  collectCoverageFrom: [
    "controllers/**/*.js",
    "middleware/**/*.js",
    "errors.utils.js",
    "!**/node_modules/**",
  ],
  coverageDirectory: "coverage",
  setupFiles: ["./jest.setup.js"],
};
