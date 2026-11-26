/** @type {import("@stryker-mutator/api/core").PartialStrykerOptions} */
export default {
  testRunner: "vitest",
  plugins: ["@stryker-mutator/vitest-runner"],
  vitest: { configFile: "vitest.mutation.config.ts" },
  coverageAnalysis: "perTest",
  reporters: ["clear-text", "progress", "html"],
  htmlReporter: { fileName: "reports/mutation/index.html" },
  mutate: ["src/tokens/**/*.ts", "src/theme/**/*.ts", "!src/**/*.test.ts"],
  tsconfigFile: "stryker-skips-tsconfig-rewrite.json",
  thresholds: { high: 100, low: 90, break: null },
};
