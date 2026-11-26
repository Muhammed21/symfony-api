import { z } from "zod";

import type { SessionStore } from "../application/session-store.ts";

export type KeyValueStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const SESSION_KEY = "prime.session";

const SessionSchema = z.object({ token: z.string(), email: z.string() });

const parsed = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const createLocalStorageSessionStore = (storage: KeyValueStorage): SessionStore => ({
  load: () => {
    const raw = storage.getItem(SESSION_KEY);
    const session = SessionSchema.safeParse(raw === null ? undefined : parsed(raw));
    return session.success ? session.data : undefined;
  },
  save: (session) => storage.setItem(SESSION_KEY, JSON.stringify(session)),
  clear: () => storage.removeItem(SESSION_KEY),
});
