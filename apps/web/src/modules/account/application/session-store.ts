import type { Session } from "../domain/account.ts";

export type SessionStore = {
  readonly load: () => Session | undefined;
  readonly save: (session: Session) => void;
  readonly clear: () => void;
};
