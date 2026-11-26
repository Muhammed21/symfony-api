import { describe, expect, it } from "vitest";

import { createCatalogue } from "../catalogue-module.ts";

const apiUrl = process.env["API_URL"] ?? "http://localhost:8000";

const catalogue = createCatalogue({ apiUrl, fetch: (url, init) => fetch(url, init) });

describe("catalogue contre la vraie API chargée avec les données de test (spec 06, spec 08)", () => {
  it("donne la première page : 12 films sur 40, en 4 pages", async () => {
    const page = await catalogue.listMovies({ page: 1, filters: {} });

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
    const page = await catalogue.listMovies({ page: 4, filters: {} });

    expect(page.ok && page.value.movies.length).toBe(4);
  });

  it("donne chaque film avec au moins un genre", async () => {
    const page = await catalogue.listMovies({ page: 1, filters: {} });

    expect(page.ok && page.value.movies.every((movie) => movie.genres.length > 0)).toBe(true);
  });

  it("ne donne que les films dont le titre contient le texte cherché", async () => {
    const page = await catalogue.listMovies({ page: 1, filters: { title: "LIBERTÉ" } });

    expect(
      page.ok &&
        page.value.total > 0 &&
        page.value.movies.every((movie) => movie.title.toLowerCase().includes("liberté")),
    ).toBe(true);
  });

  it("cumule le genre et l'année", async () => {
    const all = await catalogue.listMovies({ page: 1, filters: {} });
    const [movie] = all.ok ? all.value.movies : [];
    const genres = await catalogue.listGenres();
    const genre = genres.ok
      ? genres.value.find(({ name }) => name === movie?.genres[0])
      : undefined;

    const page = await catalogue.listMovies({
      page: 1,
      filters: { year: movie?.releaseYear ?? 0, genre: genre?.id ?? 0 },
    });

    expect(page.ok && page.value.movies.map(({ id }) => id)).toContain(movie?.id);
    expect(
      page.ok && page.value.movies.every(({ releaseYear }) => releaseYear === movie?.releaseYear),
    ).toBe(true);
  });

  it("donne les 10 genres, triés par nom", async () => {
    const genres = await catalogue.listGenres();

    const names = genres.ok ? genres.value.map(({ name }) => name) : [];
    expect(names).toHaveLength(10);
    expect(names).toEqual(names.toSorted((a, b) => a.localeCompare(b)));
  });
});
