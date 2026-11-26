import { describe, expect, it } from "vitest";

import { createAccount } from "../account-module.ts";

const apiUrl = process.env["API_URL"] ?? "http://localhost:8000";

const accountWithMemory = () => {
  const items = new Map<string, string>();
  return createAccount({
    apiUrl,
    fetch: (url, init) => fetch(url, init),
    storage: {
      getItem: (key) => items.get(key) ?? null,
      setItem: (key, value) => {
        items.set(key, value);
      },
      removeItem: (key) => {
        items.delete(key);
      },
    },
    now: () => Date.now(),
  });
};

describe("compte contre la vraie API chargée avec les données de test (spec 03, spec 12)", () => {
  it("connecte l'administrateur des données de test, et l'API reconnaît sa session", async () => {
    const account = accountWithMemory();

    const session = await account.logIn({ email: "admin@prime.local", password: "password" });

    expect(session.ok && session.value.email).toBe("admin@prime.local");
    expect((await account.verifySession())?.email).toBe("admin@prime.local");
  });

  it("refuse un mauvais mot de passe", async () => {
    const result = await accountWithMemory().logIn({
      email: "admin@prime.local",
      password: "mauvais-mot-de-passe",
    });

    expect(result).toEqual({ ok: false, error: { kind: "rejected" } });
  });

  it("crée un compte et s'y connecte aussitôt", async () => {
    const account = accountWithMemory();
    const email = `spectateur-${crypto.randomUUID()}@exemple.fr`;

    const session = await account.register({ email, password: "un-bon-mot-de-passe" });

    expect(session.ok && session.value.email).toBe(email);
    expect((await account.verifySession())?.email).toBe(email);
  });

  it("refuse un e-mail déjà pris", async () => {
    const result = await accountWithMemory().register({
      email: "ADMIN@prime.local",
      password: "un-bon-mot-de-passe",
    });

    expect(result).toEqual({ ok: false, error: { kind: "email_taken" } });
  });
});
