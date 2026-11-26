import type { Fetch } from "../../platform/http.ts";
import { accountUseCases } from "./application/account.ts";
import { createHttpAccountGateway } from "./infrastructure/http-account-gateway.ts";
import {
  createLocalStorageSessionStore,
  type KeyValueStorage,
} from "./infrastructure/local-storage-session-store.ts";

export const createAccount = ({
  apiUrl,
  fetch,
  storage,
  now,
}: {
  readonly apiUrl: string;
  readonly fetch: Fetch;
  readonly storage: KeyValueStorage;
  readonly now: () => number;
}) =>
  accountUseCases({
    gateway: createHttpAccountGateway({ apiUrl, fetch }),
    store: createLocalStorageSessionStore(storage),
    now,
  });

export type Account = ReturnType<typeof createAccount>;
