import type { Result } from "@prime/result";

import type { AccountFailure, Credentials } from "../domain/account.ts";

export type AccountGateway = {
  readonly logIn: (credentials: Credentials) => Promise<Result<string, AccountFailure>>;
  readonly register: (credentials: Credentials) => Promise<Result<undefined, AccountFailure>>;
  readonly me: (
    token: string,
  ) => Promise<Result<{ readonly email: string }, "unauthorized" | "unavailable">>;
};
