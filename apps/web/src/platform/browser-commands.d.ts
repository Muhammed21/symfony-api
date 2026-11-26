export type ReduceMotion = (reduce: boolean) => Promise<void>;

declare module "vitest/browser" {
  interface BrowserCommands {
    reduceMotion: ReduceMotion;
  }
}
