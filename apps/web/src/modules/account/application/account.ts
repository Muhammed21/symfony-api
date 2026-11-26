import { err, ok, type Result } from "@prime/result";

import {
  type AccountFailure,
  type Credentials,
  credentialErrors,
  type CredentialsPurpose,
  isActive,
  normalized,
  type Session,
} from "../domain/account.ts";
import type { AccountGateway } from "./account-gateway.ts";
import type { SessionStore } from "./session-store.ts";

const validated = (
  credentials: Credentials,
  purpose: CredentialsPurpose,
): Result<Credentials, AccountFailure> => {
  const cleaned = normalized(credentials);
  const fields = credentialErrors(cleaned, purpose);
  return Object.keys(fields).length === 0 ? ok(cleaned) : err({ kind: "invalid", fields });
};

export const accountUseCases = ({
  gateway,
  store,
  now,
}: {
  readonly gateway: AccountGateway;
  readonly store: SessionStore;
  readonly now: () => number;
}) => {
  const openSession = async (
    credentials: Credentials,
  ): Promise<Result<Session, AccountFailure>> => {
    const token = await gateway.logIn(credentials);
    if (!token.ok) {
      return token;
    }
    const session = { token: token.value, email: credentials.email };
    store.save(session);
    return ok(session);
  };

  const currentSession = (): Session | undefined => {
    const session = store.load();
    if (session !== undefined && isActive(session, now())) {
      return session;
    }
    store.clear();
    return undefined;
  };

  return {
    logIn: async (credentials: Credentials): Promise<Result<Session, AccountFailure>> => {
      const valid = validated(credentials, "log_in");
      return valid.ok ? openSession(valid.value) : valid;
    },
    register: async (credentials: Credentials): Promise<Result<Session, AccountFailure>> => {
      const valid = validated(credentials, "register");
      if (!valid.ok) {
        return valid;
      }
      const created = await gateway.register(valid.value);
      return created.ok ? openSession(valid.value) : created;
    },
    currentSession,
    verifySession: async (): Promise<Session | undefined> => {
      const session = currentSession();
      if (session === undefined) {
        return undefined;
      }
      const user = await gateway.me(session.token);
      if (user.ok) {
        return { ...session, email: user.value.email };
      }
      if (user.error === "unauthorized") {
        store.clear();
        return undefined;
      }
      return session;
    },
    logOut: (): void => store.clear(),
  };
};
