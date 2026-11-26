import { describe, expect, it } from "vitest";

import { configOf } from "../config.ts";

const INVALID = {
  kind: "invalid",
  message:
    "Configuration invalide : VITE_API_URL manque ou n'est ni une URL http(s) ni un chemin (voir .env.example).",
};

describe("configuration de l'app web", () => {
  it.each(["/api", "http://localhost:8000", "https://api.prime.local"])(
    "accepte l'adresse de l'API %s",
    (apiUrl) => {
      expect(configOf({ env: { VITE_API_URL: apiUrl } })).toEqual({ kind: "ready", apiUrl });
    },
  );

  it.each([
    undefined,
    "",
    "api",
    "ftp://api.prime.local",
    "xhttps://api.prime.local",
    "httpsx://api.prime.local",
    "//api.prime.local",
    42,
  ])("refuse l'adresse de l'API %s", (apiUrl) => {
    expect(configOf({ env: { VITE_API_URL: apiUrl } })).toEqual(INVALID);
  });

  it("refuse une configuration sans adresse d'API", () => {
    expect(configOf({ env: {} })).toEqual(INVALID);
  });
});
