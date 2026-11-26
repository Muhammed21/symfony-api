import { describe, expect, it } from "vitest";

import { createAccount } from "../account-module.ts";

const API_URL = "/api";

const NOW = Date.UTC(2026, 10, 26, 12, 0, 0);

const SESSION_KEY = "prime.session";

const base64Url = (value: unknown) =>
  btoa(JSON.stringify(value)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");

const tokenWithPayload = (payload: unknown) =>
  `${base64Url({ alg: "RS256" })}.${base64Url(payload)}.signature`;

const tokenExpiringAt = (milliseconds: number) =>
  tokenWithPayload({ exp: milliseconds / 1000, username: "a@b.fr" });

const VALID_TOKEN = tokenExpiringAt(NOW + 3_600_000);

const memoryStorage = (initial: Readonly<Record<string, string>> = {}) => {
  const items = new Map(Object.entries(initial));
  return {
    items,
    storage: {
      getItem: (key: string) => items.get(key) ?? null,
      setItem: (key: string, value: string) => {
        items.set(key, value);
      },
      removeItem: (key: string) => {
        items.delete(key);
      },
    },
  };
};

type Call = { readonly url: string; readonly init: RequestInit };

type Answer = (call: Call) => Promise<Response>;

const json =
  (body: unknown, status = 200): Answer =>
  () =>
    Promise.resolve(Response.json(body, { status }));

const setUp = ({
  answers = [],
  stored = {},
}: {
  readonly answers?: readonly Answer[];
  readonly stored?: Readonly<Record<string, string>>;
} = {}) => {
  const calls: Call[] = [];
  const pending = [...answers];
  const fetch = (url: string, init: RequestInit) => {
    const call = { url, init };
    calls.push(call);
    const answer = pending.shift();
    return answer === undefined ? Promise.reject(new Error("aucune réponse prévue")) : answer(call);
  };
  const { items, storage } = memoryStorage(stored);
  const account = createAccount({ apiUrl: API_URL, fetch, storage, now: () => NOW });
  return { account, calls, items };
};

const storedSession = (token: string, email = "ada@exemple.fr") => ({
  [SESSION_KEY]: JSON.stringify({ token, email }),
});

const JSON_HEADERS = { "Content-Type": "application/json", Accept: "application/json" };

describe("connexion (spec 12)", () => {
  it("demande l'e-mail et le mot de passe avant tout appel", async () => {
    const { account, calls } = setUp();

    const result = await account.logIn({ email: "", password: "" });

    expect(result).toEqual({
      ok: false,
      error: {
        kind: "invalid",
        fields: {
          email: "Saisissez votre e-mail.",
          password: "Saisissez votre mot de passe.",
        },
      },
    });
    expect(calls).toEqual([]);
  });

  it("refuse un e-mail mal formé", async () => {
    const { account } = setUp();

    expect(await account.logIn({ email: "ada@exemple", password: "secret" })).toEqual({
      ok: false,
      error: { kind: "invalid", fields: { email: "Cet e-mail n'est pas valide." } },
    });
    for (const email of ["ada exemple.fr", "ada lovelace@exemple.fr", "ada@exemple.fr fin"]) {
      expect(await account.logIn({ email, password: "secret" })).toMatchObject({
        error: { fields: { email: "Cet e-mail n'est pas valide." } },
      });
    }
  });

  it("envoie les identifiants à l'API et garde la session", async () => {
    const { account, calls, items } = setUp({ answers: [json({ token: VALID_TOKEN })] });

    const result = await account.logIn({ email: " ada@exemple.fr ", password: "court" });

    expect(calls).toEqual([
      {
        url: `${API_URL}/login`,
        init: {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ email: "ada@exemple.fr", password: "court" }),
        },
      },
    ]);
    expect(result).toEqual({ ok: true, value: { token: VALID_TOKEN, email: "ada@exemple.fr" } });
    expect(items.get(SESSION_KEY)).toBe(
      JSON.stringify({ token: VALID_TOKEN, email: "ada@exemple.fr" }),
    );
  });

  it("signale des identifiants refusés, sans garder de session", async () => {
    const { account, items } = setUp({
      answers: [json({ code: 401, message: "Identifiants invalides." }, 401)],
    });

    expect(await account.logIn({ email: "ada@exemple.fr", password: "faux" })).toEqual({
      ok: false,
      error: { kind: "rejected" },
    });
    expect(items.has(SESSION_KEY)).toBe(false);
  });

  it("signale un service indisponible : erreur serveur, réseau coupé, réponse inattendue", async () => {
    const credentials = { email: "ada@exemple.fr", password: "secret" };
    const unavailable = { ok: false, error: { kind: "unavailable" } };

    expect(
      await setUp({ answers: [json({ token: VALID_TOKEN }, 500)] }).account.logIn(credentials),
    ).toEqual(unavailable);
    expect(
      await setUp({ answers: [() => Promise.reject(new Error("réseau"))] }).account.logIn(
        credentials,
      ),
    ).toEqual(unavailable);
    expect(await setUp({ answers: [json({ jeton: "x" })] }).account.logIn(credentials)).toEqual(
      unavailable,
    );
  });
});

describe("création de compte (spec 12)", () => {
  it("demande au moins 8 caractères de mot de passe", async () => {
    const { account, calls } = setUp();

    expect(await account.register({ email: "ada@exemple.fr", password: "1234567" })).toEqual({
      ok: false,
      error: {
        kind: "invalid",
        fields: { password: "Le mot de passe doit contenir au moins 8 caractères." },
      },
    });
    expect(calls).toEqual([]);
  });

  it("crée le compte puis se connecte avec les mêmes identifiants", async () => {
    const { account, calls, items } = setUp({
      answers: [
        json({ id: 3, email: "ada@exemple.fr", roles: ["ROLE_USER"] }, 201),
        json({ token: VALID_TOKEN }),
      ],
    });

    const result = await account.register({ email: "ada@exemple.fr", password: "12345678" });

    expect(calls.map(({ url, init }) => [url, init])).toEqual([
      [
        `${API_URL}/register`,
        {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ email: "ada@exemple.fr", password: "12345678" }),
        },
      ],
      [
        `${API_URL}/login`,
        {
          method: "POST",
          headers: JSON_HEADERS,
          body: JSON.stringify({ email: "ada@exemple.fr", password: "12345678" }),
        },
      ],
    ]);
    expect(result).toEqual({ ok: true, value: { token: VALID_TOKEN, email: "ada@exemple.fr" } });
    expect(items.has(SESSION_KEY)).toBe(true);
  });

  it("signale un e-mail déjà pris", async () => {
    const { account, calls } = setUp({
      answers: [json({ status: 409, detail: "Un compte existe déjà avec cet e-mail." }, 409)],
    });

    expect(await account.register({ email: "ada@exemple.fr", password: "12345678" })).toEqual({
      ok: false,
      error: { kind: "email_taken" },
    });
    expect(calls).toHaveLength(1);
  });

  it("reprend les messages de l'API pour les champs qu'elle refuse", async () => {
    const { account } = setUp({
      answers: [
        json(
          {
            status: 422,
            violations: [
              { propertyPath: "email", title: "L'e-mail ne peut pas dépasser 180 caractères." },
              { propertyPath: "roles", title: "Ignoré." },
            ],
          },
          422,
        ),
      ],
    });

    expect(await account.register({ email: "ada@exemple.fr", password: "12345678" })).toEqual({
      ok: false,
      error: {
        kind: "invalid",
        fields: { email: "L'e-mail ne peut pas dépasser 180 caractères." },
      },
    });
  });

  it("signale un service indisponible à la création, même quand l'API se contredit", async () => {
    const credentials = { email: "ada@exemple.fr", password: "12345678" };
    const violations = {
      violations: [{ propertyPath: "email", title: "L'e-mail est obligatoire." }],
    };

    for (const answer of [
      json({}, 503),
      json(violations, 400),
      json({ violations: [{ propertyPath: "roles", title: "Ignoré." }] }, 422),
      () => Promise.resolve(new Response("<html>erreur</html>", { status: 422 })),
      () => Promise.reject(new Error("réseau")),
    ]) {
      expect(await setUp({ answers: [answer] }).account.register(credentials)).toEqual({
        ok: false,
        error: { kind: "unavailable" },
      });
    }
  });
});

describe("session (spec 12)", () => {
  it("sans session gardée, personne n'est connecté", () => {
    expect(setUp().account.currentSession()).toBeUndefined();
  });

  it("reprend la session gardée tant que son jeton n'a pas expiré", () => {
    const { account } = setUp({ stored: storedSession(VALID_TOKEN) });

    expect(account.currentSession()).toEqual({ token: VALID_TOKEN, email: "ada@exemple.fr" });
  });

  it("lit un jeton encodé en base64url", () => {
    const token = tokenWithPayload({ exp: 2_000_000_000, n: "???>" });
    const { account } = setUp({ stored: storedSession(token) });

    expect(token.split(".")[1]).toMatch(/-.*_|_.*-/);
    expect(account.currentSession()).toEqual({ token, email: "ada@exemple.fr" });
  });

  it("oublie une session dont le jeton a expiré", () => {
    const { account, items } = setUp({ stored: storedSession(tokenExpiringAt(NOW)) });

    expect(account.currentSession()).toBeUndefined();
    expect(items.has(SESSION_KEY)).toBe(false);
  });

  it("oublie une session illisible", () => {
    for (const stored of [
      { [SESSION_KEY]: "pas du json" },
      { [SESSION_KEY]: JSON.stringify({ token: 42 }) },
      storedSession("jeton.sans-expiration.lisible"),
      storedSession(tokenWithPayload(null)),
      storedSession(tokenWithPayload({ exp: String((NOW + 3_600_000) / 1000) })),
    ]) {
      const { account, items } = setUp({ stored });

      expect(account.currentSession()).toBeUndefined();
      expect(items.has(SESSION_KEY)).toBe(false);
    }
  });

  it("vérifie la session auprès de l'API avec son jeton", async () => {
    const { account, calls } = setUp({
      stored: storedSession(VALID_TOKEN),
      answers: [json({ id: 3, email: "ada.lovelace@exemple.fr", roles: ["ROLE_USER"] })],
    });

    expect(await account.verifySession()).toEqual({
      token: VALID_TOKEN,
      email: "ada.lovelace@exemple.fr",
    });
    expect(calls).toEqual([
      {
        url: `${API_URL}/me`,
        init: {
          method: "GET",
          headers: { Accept: "application/json", Authorization: `Bearer ${VALID_TOKEN}` },
        },
      },
    ]);
  });

  it("oublie la session que l'API refuse", async () => {
    const { account, items } = setUp({
      stored: storedSession(VALID_TOKEN),
      answers: [json({ code: 401, message: "Invalid JWT Token" }, 401)],
    });

    expect(await account.verifySession()).toBeUndefined();
    expect(items.has(SESSION_KEY)).toBe(false);
  });

  it("garde la session telle quelle quand l'API ne répond pas comme prévu", async () => {
    for (const answer of [
      () => Promise.reject(new Error("réseau")),
      json({ email: "autre@exemple.fr" }, 500),
      json({ courriel: "autre@exemple.fr" }),
    ]) {
      const { account, items } = setUp({ stored: storedSession(VALID_TOKEN), answers: [answer] });

      expect(await account.verifySession()).toEqual({
        token: VALID_TOKEN,
        email: "ada@exemple.fr",
      });
      expect(items.has(SESSION_KEY)).toBe(true);
    }
  });

  it("sans session, ne vérifie rien", async () => {
    const { account, calls } = setUp();

    expect(await account.verifySession()).toBeUndefined();
    expect(calls).toEqual([]);
  });

  it("se déconnecter oublie la session", () => {
    const { account, items } = setUp({ stored: storedSession(VALID_TOKEN) });

    account.logOut();

    expect(items.has(SESSION_KEY)).toBe(false);
    expect(account.currentSession()).toBeUndefined();
  });
});
