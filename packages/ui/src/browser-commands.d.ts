export type HoldRequests = (url: string) => Promise<void>;

declare module "vitest/browser" {
  interface BrowserCommands {
    holdRequests: HoldRequests;
  }
}
