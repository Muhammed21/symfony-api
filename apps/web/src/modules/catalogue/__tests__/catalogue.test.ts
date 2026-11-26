import { describe, expect, it } from "vitest";

import { createCatalogue } from "../catalogue-module.ts";

const API_URL = "/api";

const makeMovieOutput = (overrides: Readonly<Record<string, unknown>> = {}) => ({
  id: 1,
  title: "Les Évadés",
  releaseYear: 1994,
  duration: 142,
  ageRating: "13+",
  posterUrl: null,
  backdropUrl: null,
  genres: [{ id: 6, name: "Drame" }],
  ...overrides,
});

const makePageOutput = (overrides: Readonly<Record<string, unknown>> = {}) => ({
  total: 1,
  lastPage: 1,
  items: [makeMovieOutput()],
  ...overrides,
});

type Call = { readonly url: string; readonly init: RequestInit };

const answering = (response: () => Promise<Response>) => {
  const calls: Call[] = [];
  const fetch = (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return response();
  };
  return { catalogue: createCatalogue({ apiUrl: API_URL, fetch }), calls };
};

const json =
  (body: unknown, status = 200) =>
  () =>
    Promise.resolve(Response.json(body, { status }));

describe("lecture du catalogue dans l'app web (spec 08)", () => {
  it("demande la page voulue à l'API, 12 films par page", async () => {
    const { catalogue, calls } = answering(json(makePageOutput()));

    await catalogue.listMovies({ page: 2, filters: {} });

    expect(calls).toEqual([{ url: `${API_URL}/movies?page=2&limit=12`, init: { method: "GET" } }]);
  });

  it("transmet les filtres de titre, d'année et de genre à l'API", async () => {
    const { catalogue, calls } = answering(json(makePageOutput()));

    await catalogue.listMovies({ page: 1, filters: { title: "le par", year: 1972, genre: 6 } });

    expect(calls.map((call) => call.url)).toEqual([
      `${API_URL}/movies?page=1&limit=12&title=le+par&year=1972&genre=6`,
    ]);
  });

  it("n'envoie que les filtres renseignés", async () => {
    const { catalogue, calls } = answering(json(makePageOutput()));

    await catalogue.listMovies({ page: 3, filters: { genre: 2 } });

    expect(calls.map((call) => call.url)).toEqual([`${API_URL}/movies?page=3&limit=12&genre=2`]);
  });

  it("demande les films les plus récents d'abord quand on le précise", async () => {
    const { catalogue, calls } = answering(json(makePageOutput()));

    await catalogue.listMovies({ page: 1, filters: { genre: 2 }, sort: "recent" });

    expect(calls.map((call) => call.url)).toEqual([
      `${API_URL}/movies?page=1&limit=12&genre=2&sort=recent`,
    ]);
  });

  it("donne l'affiche et la bannière de chaque film, quand il en a", async () => {
    const { catalogue } = answering(
      json(
        makePageOutput({
          items: [
            makeMovieOutput({
              posterUrl: "https://images.exemple.fr/affiche.jpg",
              backdropUrl: "https://images.exemple.fr/banniere.jpg",
            }),
            makeMovieOutput({ id: 2 }),
          ],
        }),
      ),
    );

    const page = await catalogue.listMovies({ page: 1, filters: {} });

    expect(
      page.ok &&
        page.value.movies.map(({ posterUrl, backdropUrl }) => ({ posterUrl, backdropUrl })),
    ).toStrictEqual([
      {
        posterUrl: "https://images.exemple.fr/affiche.jpg",
        backdropUrl: "https://images.exemple.fr/banniere.jpg",
      },
      { posterUrl: undefined, backdropUrl: undefined },
    ]);
  });

  it("donne les films de la page avec le nombre total de films et de pages", async () => {
    const { catalogue } = answering(
      json(
        makePageOutput({
          total: 40,
          lastPage: 4,
          items: [
            makeMovieOutput(),
            makeMovieOutput({ id: 2, title: "Le Roi Lion", ageRating: "ALL", genres: [] }),
          ],
        }),
      ),
    );

    expect(await catalogue.listMovies({ page: 1, filters: {} })).toEqual({
      ok: true,
      value: {
        total: 40,
        lastPage: 4,
        movies: [
          {
            id: 1,
            title: "Les Évadés",
            releaseYear: 1994,
            duration: 142,
            ageRating: "13+",
            genres: ["Drame"],
          },
          {
            id: 2,
            title: "Le Roi Lion",
            releaseYear: 1994,
            duration: 142,
            ageRating: "ALL",
            genres: [],
          },
        ],
      },
    });
  });

  it.each([500, 503, 429])("se dit indisponible quand l'API répond %i", async (status) => {
    const { catalogue } = answering(json({ title: "Erreur" }, status));

    expect(await catalogue.listMovies({ page: 1, filters: {} })).toEqual({
      ok: false,
      error: "unavailable",
    });
  });

  it("se dit indisponible quand l'API est injoignable", async () => {
    const { catalogue } = answering(() => Promise.reject(new TypeError("Failed to fetch")));

    expect(await catalogue.listMovies({ page: 1, filters: {} })).toEqual({
      ok: false,
      error: "unavailable",
    });
  });

  it.each([
    ["une page refusée", json({ title: "La page doit être supérieure à 0." }, 422)],
    ["un corps au format inattendu", json({ items: [{ id: "pas-un-nombre" }] })],
    [
      "une classification d'âge inconnue",
      json(makePageOutput({ items: [makeMovieOutput({ ageRating: "21+" })] })),
    ],
    [
      "un corps qui n'est pas du JSON",
      () => Promise.resolve(new Response("<html>", { status: 200 })),
    ],
  ])("signale une réponse invalide pour %s", async (_case, response) => {
    const { catalogue } = answering(response);

    expect(await catalogue.listMovies({ page: 1, filters: {} })).toEqual({
      ok: false,
      error: "invalid_response",
    });
  });
});

describe("genres du catalogue (spec 09)", () => {
  it("demande tous les genres à l'API", async () => {
    const { catalogue, calls } = answering(json({ total: 0, lastPage: 1, items: [] }));

    await catalogue.listGenres();

    expect(calls).toEqual([{ url: `${API_URL}/genres?limit=100`, init: { method: "GET" } }]);
  });

  it("donne chaque genre avec son identifiant et son nom", async () => {
    const { catalogue } = answering(
      json({
        total: 2,
        lastPage: 1,
        items: [
          { id: 1, name: "Action" },
          { id: 6, name: "Drame" },
        ],
      }),
    );

    expect(await catalogue.listGenres()).toEqual({
      ok: true,
      value: [
        { id: 1, name: "Action" },
        { id: 6, name: "Drame" },
      ],
    });
  });

  it("se dit indisponible quand l'API répond 503", async () => {
    const { catalogue } = answering(json({ title: "Erreur" }, 503));

    expect(await catalogue.listGenres()).toEqual({ ok: false, error: "unavailable" });
  });

  it("se dit indisponible quand l'API est injoignable", async () => {
    const { catalogue } = answering(() => Promise.reject(new TypeError("Failed to fetch")));

    expect(await catalogue.listGenres()).toEqual({ ok: false, error: "unavailable" });
  });

  it.each([
    ["une requête refusée", json({ title: "Limite invalide" }, 422)],
    ["un genre au format inattendu", json({ total: 1, lastPage: 1, items: [{ id: "un" }] })],
  ])("signale une réponse invalide pour %s", async (_case, response) => {
    const { catalogue } = answering(response);

    expect(await catalogue.listGenres()).toEqual({ ok: false, error: "invalid_response" });
  });
});
