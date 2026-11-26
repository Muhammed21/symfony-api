import type { Result } from "@prime/result";

import type { AccountFailure, Credentials, Session } from "../domain/account.ts";

export type AccountUseCases = {
  readonly logIn: (credentials: Credentials) => Promise<Result<Session, AccountFailure>>;
  readonly register: (credentials: Credentials) => Promise<Result<Session, AccountFailure>>;
  readonly currentSession: () => Session | undefined;
  readonly verifySession: () => Promise<Session | undefined>;
  readonly logOut: () => void;
};

export type LoadBackdrop = () => Promise<string | undefined>;
