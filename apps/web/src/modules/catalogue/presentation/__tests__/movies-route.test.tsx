import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { err, ok, type Result } from "@prime/result";

import type { CatalogueFailure, Movie, MoviePage } from "../../domain/movie.ts";
import { moviesRoute } from "../movies-route.tsx";

type ListMovies = (query: {
  readonly page: number;
}) => Promise<Result<MoviePage, CatalogueFailure>>;

const makeMovie = (overrides: Partial<Movie> = {}): Movie => ({
  id: 1,
  title: "Les Évadés",
  releaseYear: 1994,
  duration: 142,
  ageRating: "13+",
  genres: ["Drame"],
  ...overrides,
});

const listing =
  (page: Partial<MoviePage> = {}): ListMovies =>
  () =>
    Promise.resolve(ok({ movies: [makeMovie()], total: 1, lastPage: 1, ...page }));

const catalogueOfFourPages: ListMovies = ({ page }) =>
  Promise.resolve(
    ok({
      movies: [makeMovie({ id: page, title: `Film de la page ${page}` })],
      total: 48,
      lastPage: 4,
    }),
  );

const renderMovies = (listMovies: ListMovies, url = "/") => {
  const root = createRootRoute();
  const router = createRouter({
    routeTree: root.addChildren([moviesRoute({ parent: root, listMovies })]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
};

describe("page du catalogue (spec 08)", () => {
  it("présente chaque film avec son année, sa durée, sa classification d'âge et ses genres", async () => {
    const screen = await renderMovies(
      listing({
        movies: [
          makeMovie(),
          makeMovie({
            id: 2,
            title: "Le Roi Lion",
            duration: 88,
            ageRating: "ALL",
            genres: ["Animation", "Aventure"],
          }),
        ],
      }),
    );

    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Prime Video" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("heading", { level: 2, name: "Catalogue" }))
      .toBeVisible();
    await expect
      .element(screen.getByRole("heading", { level: 3, name: "Les Évadés" }))
      .toBeVisible();
    const evades = screen.getByRole("article", { name: "Les Évadés" });
    await expect.element(evades).toMatchTextContent("1994 · 2 h 22 · 13+");
    await expect.element(evades).toMatchTextContent("Drame");
    const roiLion = screen.getByRole("article", { name: "Le Roi Lion" });
    await expect.element(roiLion).toMatchTextContent("1994 · 1 h 28 · Tous publics");
    await expect.element(roiLion).toMatchTextContent("Animation, Aventure");
  });

  it("lit la page dans l'adresse", async () => {
    const asked: number[] = [];
    const screen = await renderMovies(({ page }) => {
      asked.push(page);
      return catalogueOfFourPages({ page });
    }, "/?page=3");

    await expect.element(screen.getByRole("heading", { name: "Film de la page 3" })).toBeVisible();
    await expect.element(screen.getByText("Page 3 sur 4")).toBeVisible();
    expect(asked).toEqual([3]);
  });

  it.each(["/?page=0", "/?page=-2", "/?page=deux", "/?page=1.5"])(
    "revient à la première page pour une adresse invalide (%s)",
    async (url) => {
      const screen = await renderMovies(catalogueOfFourPages, url);

      await expect.element(screen.getByText("Page 1 sur 4")).toBeVisible();
    },
  );

  it("passe à la page suivante puis revient à la précédente", async () => {
    const screen = await renderMovies(catalogueOfFourPages, "/?page=2");
    await expect.element(screen.getByText("Page 2 sur 4")).toBeVisible();

    await screen.getByRole("link", { name: "Suivant" }).click();

    await expect.element(screen.getByRole("heading", { name: "Film de la page 3" })).toBeVisible();
    await expect.element(screen.getByText("Page 3 sur 4")).toBeVisible();

    await screen.getByRole("link", { name: "Précédent" }).click();

    await expect.element(screen.getByRole("heading", { name: "Film de la page 2" })).toBeVisible();
    await expect.element(screen.getByText("Page 2 sur 4")).toBeVisible();
  });

  it("choisit une page par son point de pagination", async () => {
    const screen = await renderMovies(catalogueOfFourPages);
    await expect.element(screen.getByText("Page 1 sur 4")).toBeVisible();

    await screen.getByRole("button", { name: "Page 3" }).click();

    await expect.element(screen.getByRole("heading", { name: "Film de la page 3" })).toBeVisible();
    await expect.element(screen.getByText("Page 3 sur 4")).toBeVisible();
  });

  it("signale la page courante parmi les points de pagination", async () => {
    const screen = await renderMovies(catalogueOfFourPages, "/?page=2");

    const pagination = screen.getByRole("navigation", { name: "Pagination" });

    await expect
      .element(pagination.getByRole("button", { name: "Page 2" }))
      .toHaveAttribute("aria-current", "page");
    expect(pagination.getByRole("button").elements()).toHaveLength(4);
  });

  it("n'affiche ni points ni liens quand tout tient sur une page", async () => {
    const screen = await renderMovies(listing());

    await expect.element(screen.getByText("Page 1 sur 1")).toBeVisible();
    await expect.element(screen.getByRole("button", { name: "Page 1" })).not.toBeInTheDocument();
    await expect.element(screen.getByRole("link")).not.toBeInTheDocument();
  });

  it("n'offre pas de page précédente sur la première page", async () => {
    const screen = await renderMovies(catalogueOfFourPages);

    await expect.element(screen.getByText("Page 1 sur 4")).toBeVisible();
    await expect.element(screen.getByRole("link", { name: "Précédent" })).not.toBeInTheDocument();
    await expect.element(screen.getByRole("link", { name: "Suivant" })).toBeVisible();
  });

  it("n'offre pas de page suivante sur la dernière page", async () => {
    const screen = await renderMovies(catalogueOfFourPages, "/?page=4");

    await expect.element(screen.getByText("Page 4 sur 4")).toBeVisible();
    await expect.element(screen.getByRole("link", { name: "Suivant" })).not.toBeInTheDocument();
    await expect.element(screen.getByRole("link", { name: "Précédent" })).toBeVisible();
  });

  it("indique le chargement tant que le catalogue n'a pas répondu", async () => {
    const screen = await renderMovies(() => new Promise(() => {}));

    await expect.element(screen.getByText("Chargement des films…")).toBeVisible();
    await expect
      .element(screen.getByRole("progressbar", { name: "Chargement des films" }))
      .toBeVisible();
  });

  it("indique le chargement pendant le passage à une autre page", async () => {
    const screen = await renderMovies(({ page }) =>
      page === 1 ? catalogueOfFourPages({ page }) : new Promise(() => {}),
    );
    await expect.element(screen.getByText("Page 1 sur 4")).toBeVisible();

    await screen.getByRole("link", { name: "Suivant" }).click();

    await expect.element(screen.getByText("Chargement des films…")).toBeVisible();
    await expect
      .element(screen.getByRole("heading", { name: "Film de la page 1" }))
      .not.toBeInTheDocument();
  });

  it("indique un catalogue vide, sans pagination", async () => {
    const screen = await renderMovies(listing({ movies: [], total: 0, lastPage: 1 }));

    await expect.element(screen.getByText("Aucun film pour le moment.")).toBeVisible();
    await expect.element(screen.getByText(/^Page /)).not.toBeInTheDocument();
  });

  it.each<CatalogueFailure>(["unavailable", "invalid_response"])(
    "signale l'échec (%s) et permet de réessayer",
    async (failure) => {
      const answers: Result<MoviePage, CatalogueFailure>[] = [
        err(failure),
        ok({ movies: [makeMovie({ title: "Heat" })], total: 1, lastPage: 1 }),
      ];
      const screen = await renderMovies(() => Promise.resolve(answers.shift() ?? err(failure)));

      await expect
        .element(screen.getByRole("alert"))
        .toMatchTextContent("Impossible de charger les films.");

      await screen.getByRole("button", { name: "Réessayer" }).click();

      await expect.element(screen.getByRole("heading", { name: "Heat" })).toBeVisible();
      await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
    },
  );
});
