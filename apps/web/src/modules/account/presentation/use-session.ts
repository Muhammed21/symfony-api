import { useQuery } from "@tanstack/react-query";

import type { AccountUseCases } from "./use-cases.ts";

export const SESSION_QUERY_KEY = ["session"] as const;

export const useSession = (account: AccountUseCases) =>
  useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => (await account.verifySession()) ?? null,
    initialData: () => account.currentSession() ?? null,
    initialDataUpdatedAt: 0,
  });
