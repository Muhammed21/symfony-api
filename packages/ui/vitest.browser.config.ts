import react from "@vitejs/plugin-react";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";
import type { BrowserCommand } from "vitest/node";

const holdRequests: BrowserCommand<[url: string]> = async (context, url) => {
  if (context.provider.name !== "playwright") {
    throw new Error("holdRequests demande Playwright");
  }
  await context.page.route(url, () => undefined);
};

export default defineConfig({
  plugins: [react()],
  test: {
    name: "browser",
    include: ["src/**/*.test.tsx"],
    setupFiles: ["./src/theme/theme.css"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      instances: [{ browser: "chromium" }],
      commands: { holdRequests },
    },
  },
});
