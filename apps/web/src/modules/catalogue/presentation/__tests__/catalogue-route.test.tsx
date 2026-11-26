import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import { err, ok, type Result } from "@prime/result";

import type {
  CatalogueFailure,
  Genre,
  Movie,
  MovieFilters,
  MoviePage,
} from "../../domain/movie.ts";
import { moviesRoute } from "../movies-route.tsx";

type MoviesQuery = { readonly page: number; readonly filters: MovieFilters };

type ListMovies = (query: MoviesQuery) => Promise<Result<MoviePage, CatalogueFailure>>;

type ListGenres = () => Promise<Result<readonly Genre[], CatalogueFailure>>;

const GENRES: readonly Genre[] = [
  { id: 1, name: "Action" },
  { id: 6, name: "Drame" },
];

const genres: ListGenres = () => Promise.resolve(ok(GENRES));

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

const renderCatalogue = async ({
  listMovies,
  listGenres = genres,
  url = "/",
}: {
  readonly listMovies: ListMovies;
  readonly listGenres?: ListGenres;
  readonly url?: string;
}) => {
  const root = createRootRoute();
  const router = createRouter({
    routeTree: root.addChildren([moviesRoute({ parent: root, listMovies, listGenres })]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { screen, router };
};

const renderMovies = async (listMovies: ListMovies, url = "/") =>
  (await renderCatalogue({ listMovies, url })).screen;

const recording = (answer: ListMovies = catalogueOfFourPages) => {
  const asked: MoviesQuery[] = [];
  const listMovies: ListMovies = (query) => {
    asked.push(query);
    return answer(query);
  };
  return { asked, listMovies };
};

const NO_FILTERS: MovieFilters = { title: undefined, year: undefined, genre: undefined };

type Screen = Awaited<ReturnType<typeof render>>;

const searchField = (screen: Screen) =>
  screen.getByRole("searchbox", { name: "Rechercher un titre" });

const yearField = (screen: Screen) => screen.getByRole("textbox", { name: "Année" });

const pause = (milliseconds: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });

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
    const { asked, listMovies } = recording();
    const screen = await renderMovies(listMovies, "/?page=3");

    await expect.element(screen.getByRole("heading", { name: "Film de la page 3" })).toBeVisible();
    await expect.element(screen.getByText("Page 3 sur 4")).toBeVisible();
    expect(asked).toEqual([{ page: 3, filters: NO_FILTERS }]);
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
    const screen = await renderMovies(({ page, filters }) =>
      page === 1 ? catalogueOfFourPages({ page, filters }) : new Promise(() => {}),
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

describe("filtres du catalogue (spec 09)", () => {
  it("cherche un titre pendant la frappe, une fois la pause faite, en revenant en page 1", async () => {
    const { asked, listMovies } = recording();
    const { screen, router } = await renderCatalogue({ listMovies, url: "/?page=3" });
    await expect.element(screen.getByText("Page 3 sur 4")).toBeVisible();

    await userEvent.type(searchField(screen), "par");

    await expect.poll(() => asked.at(-1)).toEqual({ page: 1, filters: { title: "par" } });
    expect(asked.map(({ filters }) => filters.title)).toEqual([undefined, "par"]);
    expect(router.state.location.search).toEqual({ page: 1, title: "par" });
    await expect.element(screen.getByText("Page 1 sur 4")).toBeVisible();
  });

  it("remplace l'adresse pendant la frappe, sans empiler l'historique", async () => {
    const { asked, listMovies } = recording();
    const { screen, router } = await renderCatalogue({ listMovies });

    await searchField(screen).fill("par");

    await expect.poll(() => asked.at(-1)?.filters.title).toBe("par");
    expect(router.history.length).toBe(1);
  });

  it("ignore les espaces autour du titre et retire le filtre d'un champ vidé", async () => {
    const { asked, listMovies } = recording();
    const { screen } = await renderCatalogue({ listMovies, url: "/?title=par" });
    await expect.element(searchField(screen)).toHaveValue("par");

    await searchField(screen).fill("  le parrain ");
    await expect.poll(() => asked.at(-1)?.filters.title).toBe("le parrain");

    await searchField(screen).fill("   ");
    await expect.poll(() => asked.at(-1)?.filters).toEqual(NO_FILTERS);
  });

  it("ne filtre l'année qu'une fois ses 4 chiffres saisis", async () => {
    const { asked, listMovies } = recording();
    const { screen } = await renderCatalogue({ listMovies });

    await yearField(screen).fill("197");
    await pause(500);
    expect(asked.map(({ filters }) => filters.year)).toEqual([undefined]);

    await yearField(screen).fill("1972");
    await expect.poll(() => asked.at(-1)).toEqual({ page: 1, filters: { year: 1972 } });
  });

  it("retire le filtre d'année quand elle n'a plus 4 chiffres", async () => {
    const { asked, listMovies } = recording();
    const { screen } = await renderCatalogue({ listMovies, url: "/?year=1972" });
    await expect.element(yearField(screen)).toHaveValue("1972");

    await yearField(screen).fill("197");

    await expect.poll(() => asked.at(-1)?.filters).toEqual(NO_FILTERS);
    await expect.element(yearField(screen)).toHaveValue("197");
  });

  it("propose un clavier numérique de 4 chiffres pour l'année", async () => {
    const { screen } = await renderCatalogue({ listMovies: catalogueOfFourPages });

    await expect.element(yearField(screen)).toHaveAttribute("inputmode", "numeric");
    await expect.element(yearField(screen)).toHaveAttribute("maxlength", "4");
  });

  it("filtre par genre au clic, en page 1, et « Tous » retire le filtre", async () => {
    const { asked, listMovies } = recording();
    const { screen, router } = await renderCatalogue({ listMovies, url: "/?page=3" });
    const all = screen.getByRole("button", { name: "Tous" });
    const drame = screen.getByRole("button", { name: "Drame" });
    await expect.element(all).toHaveAttribute("aria-pressed", "true");
    await expect.element(drame).toHaveAttribute("aria-pressed", "false");

    await drame.click();

    await expect.element(drame).toHaveAttribute("aria-pressed", "true");
    await expect.element(all).toHaveAttribute("aria-pressed", "false");
    expect(asked.at(-1)).toEqual({ page: 1, filters: { genre: 6 } });
    expect(router.history.length).toBe(2);

    await all.click();

    await expect.element(all).toHaveAttribute("aria-pressed", "true");
    expect(asked.at(-1)?.filters).toEqual(NO_FILTERS);
  });

  it("revient au genre précédent avec le bouton Retour", async () => {
    const { screen, router } = await renderCatalogue({ listMovies: catalogueOfFourPages });
    await screen.getByRole("button", { name: "Drame" }).click();
    await expect
      .element(screen.getByRole("button", { name: "Drame" }))
      .toHaveAttribute("aria-pressed", "true");

    router.history.back();

    await expect
      .element(screen.getByRole("button", { name: "Tous" }))
      .toHaveAttribute("aria-pressed", "true");
  });

  it("ouvre la page et les filtres de l'adresse, champs et genre déjà remplis", async () => {
    const { asked, listMovies } = recording();
    const { screen } = await renderCatalogue({
      listMovies,
      url: "/?title=par&year=1972&genre=6&page=2",
    });

    await expect.element(screen.getByText("Page 2 sur 4")).toBeVisible();
    await expect.element(searchField(screen)).toHaveValue("par");
    await expect.element(yearField(screen)).toHaveValue("1972");
    await expect
      .element(screen.getByRole("button", { name: "Drame" }))
      .toHaveAttribute("aria-pressed", "true");
    expect(asked).toEqual([{ page: 2, filters: { title: "par", year: 1972, genre: 6 } }]);
  });

  it.each(["/?title=", "/?title=%20%20", "/?year=abc", "/?year=0", "/?genre=-1", "/?genre=1.5"])(
    "ignore un filtre invalide dans l'adresse (%s)",
    async (url) => {
      const { asked, listMovies } = recording();
      const { screen } = await renderCatalogue({ listMovies, url });

      await expect.element(screen.getByText("Page 1 sur 4")).toBeVisible();
      expect(asked).toEqual([{ page: 1, filters: NO_FILTERS }]);
    },
  );

  it("garde les filtres en changeant de page", async () => {
    const { asked, listMovies } = recording();
    const { screen } = await renderCatalogue({ listMovies, url: "/?title=par&genre=6" });

    await screen.getByRole("link", { name: "Suivant" }).click();
    await expect.element(screen.getByText("Page 2 sur 4")).toBeVisible();
    expect(asked.at(-1)).toEqual({ page: 2, filters: { title: "par", genre: 6 } });

    await screen.getByRole("link", { name: "Précédent" }).click();
    await expect.element(screen.getByText("Page 1 sur 4")).toBeVisible();

    await screen.getByRole("button", { name: "Page 4" }).click();
    await expect.element(screen.getByText("Page 4 sur 4")).toBeVisible();
    expect(asked.at(-1)).toEqual({ page: 4, filters: { title: "par", genre: 6 } });
  });

  it("signale l'absence de résultat et permet d'effacer les filtres", async () => {
    const { asked, listMovies } = recording(({ page, filters }) =>
      filters.title === undefined
        ? catalogueOfFourPages({ page, filters })
        : Promise.resolve(ok({ movies: [], total: 0, lastPage: 1 })),
    );
    const { screen } = await renderCatalogue({ listMovies, url: "/?title=zzz&genre=6" });

    await expect.element(screen.getByText("Aucun film ne correspond à ces filtres.")).toBeVisible();
    await expect.element(screen.getByText("Aucun film pour le moment.")).not.toBeInTheDocument();

    await screen.getByRole("link", { name: "Effacer les filtres" }).click();

    await expect.element(screen.getByText("Page 1 sur 4")).toBeVisible();
    await expect.element(searchField(screen)).toHaveValue("");
    await expect
      .element(screen.getByRole("button", { name: "Tous" }))
      .toHaveAttribute("aria-pressed", "true");
    expect(asked.at(-1)?.filters).toEqual(NO_FILTERS);
  });

  it("sans genres, n'affiche pas de pilules et garde la recherche", async () => {
    const { asked, listMovies } = recording();
    const { screen } = await renderCatalogue({
      listMovies,
      listGenres: () => Promise.resolve(err("unavailable")),
    });
    await expect.element(screen.getByText("Page 1 sur 4")).toBeVisible();

    await expect.element(screen.getByRole("button", { name: "Tous" })).not.toBeInTheDocument();
    await searchField(screen).fill("par");
    await expect.poll(() => asked.at(-1)?.filters.title).toBe("par");
  });

  it("regroupe les filtres dans une zone de recherche nommée", async () => {
    const { screen } = await renderCatalogue({ listMovies: catalogueOfFourPages });

    const filters = screen.getByRole("search", { name: "Filtres" });

    await expect.element(filters.getByRole("searchbox")).toBeVisible();
    await expect.element(filters.getByRole("group", { name: "Genre" })).toBeVisible();
  });
});
