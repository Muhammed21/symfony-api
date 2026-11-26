import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import type { BrowserCommand } from "vitest/node";

const reduceMotion: BrowserCommand<[reduce: boolean]> = async (context, reduce) => {
  if (context.provider.name !== "playwright") {
    throw new Error("reduceMotion demande Playwright");
  }
  await context.page.emulateMedia({ reducedMotion: reduce ? "reduce" : "no-preference" });
};

export default defineConfig({
  plugins: [react()],
  test: {
    name: "browser",
    include: ["src/**/*.test.tsx"],
    setupFiles: ["@prime/ui/theme.css", "./src/platform/global.css"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
      commands: { reduceMotion },
    },
  },
});
