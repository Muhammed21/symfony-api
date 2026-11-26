import { describe, expect, it } from "vitest";

import { createCatalogue } from "../catalogue-module.ts";

const apiUrl = process.env["API_URL"] ?? "http://localhost:8000";

const catalogue = createCatalogue({ apiUrl, fetch: (url, init) => fetch(url, init) });

describe("catalogue contre la vraie API chargée avec les données de test (spec 06, spec 08)", () => {
  it("donne la première page : 12 films sur 40, en 4 pages", async () => {
    const page = await catalogue.listMovies({ page: 1 });

    expect(
      page.ok && {
        total: page.value.total,
        lastPage: page.value.lastPage,
        count: page.value.movies.length,
      },
    ).toEqual({
      total: 40,
      lastPage: 4,
      count: 12,
    });
  });

  it("donne les 4 derniers films sur la dernière page", async () => {
    const page = await catalogue.listMovies({ page: 4 });

    expect(page.ok && page.value.movies.length).toBe(4);
  });

  it("donne chaque film avec au moins un genre", async () => {
    const page = await catalogue.listMovies({ page: 1 });

    expect(page.ok && page.value.movies.every((movie) => movie.genres.length > 0)).toBe(true);
  });
});
