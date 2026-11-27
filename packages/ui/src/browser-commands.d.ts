export type HoldRequests = (url: string) => Promise<void>;

export type ReduceMotion = (reduce: boolean) => Promise<void>;

declare module "vitest/browser" {
  interface BrowserCommands {
    holdRequests: HoldRequests;
    reduceMotion: ReduceMotion;
  }
}
