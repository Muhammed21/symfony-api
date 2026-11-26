import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { commands } from "vitest/browser";

import { err, ok, type Result } from "@prime/result";

import type {
  CatalogueFailure,
  Genre,
  Movie,
  MovieFilters,
  MoviePage,
  MovieSort,
} from "../../domain/movie.ts";
import { catalogueRoute } from "../catalogue-route.tsx";
import { homeRoute } from "../home-route.tsx";

type MoviesQuery = {
  readonly page: number;
  readonly filters: MovieFilters;
  readonly sort?: MovieSort;
};

type ListMovies = (query: MoviesQuery) => Promise<Result<MoviePage, CatalogueFailure>>;

type ListGenres = () => Promise<Result<readonly Genre[], CatalogueFailure>>;

const makeMovie = (overrides: Partial<Movie> = {}): Movie => ({
  id: 1,
  title: "Les Évadés",
  releaseYear: 1994,
  duration: 142,
  ageRating: "13+",
  posterUrl: "https://images.exemple.fr/affiche.jpg",
  backdropUrl: "https://images.exemple.fr/banniere.jpg",
  genres: ["Drame"],
  ...overrides,
});

const RECENT: readonly Movie[] = Array.from({ length: 6 }, (_, index) =>
  makeMovie({
    id: 100 + index,
    title: `Récent ${index + 1}`,
    releaseYear: 2024 - index,
    genres: ["Action", "Drame"],
    backdropUrl: `https://images.exemple.fr/banniere-${index + 1}.jpg`,
  }),
);

const ACTION: readonly Movie[] = [
  makeMovie({ id: 1, title: "Heat" }),
  makeMovie({ id: 2, title: "Ronin", backdropUrl: undefined }),
];

const GENRES: readonly Genre[] = [
  { id: 1, name: "Action" },
  { id: 6, name: "Drame" },
];

const pageOf = (movies: readonly Movie[]) =>
  Promise.resolve(ok({ movies, total: movies.length, lastPage: 1 }));

const catalogue: ListMovies = ({ filters, sort }) => {
  if (sort === "recent") {
    return pageOf(RECENT);
  }
  return pageOf(filters.genre === 1 ? ACTION : []);
};

const genres: ListGenres = () => Promise.resolve(ok(GENRES));

const recording = (answer: ListMovies = catalogue) => {
  const asked: MoviesQuery[] = [];
  const listMovies: ListMovies = (query) => {
    asked.push(query);
    return answer(query);
  };
  return { asked, listMovies };
};

const renderHome = async ({
  listMovies = catalogue,
  listGenres = genres,
}: {
  readonly listMovies?: ListMovies;
  readonly listGenres?: ListGenres;
} = {}) => {
  const root = createRootRoute();
  const catalogueStub = createRoute({
    getParentRoute: () => root,
    path: "/catalogue",
    component: () => <p>Page du catalogue</p>,
  });
  const router = createRouter({
    routeTree: root.addChildren([
      homeRoute({ parent: root, listMovies, listGenres }),
      catalogueStub,
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { screen, router };
};

const renderHomeAndCatalogue = async ({
  listMovies,
  listGenres,
}: {
  readonly listMovies: ListMovies;
  readonly listGenres: ListGenres;
}) => {
  const root = createRootRoute();
  const router = createRouter({
    routeTree: root.addChildren([
      homeRoute({ parent: root, listMovies, listGenres }),
      catalogueRoute({ parent: root, listMovies, listGenres }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { screen, router };
};

type Screen = Awaited<ReturnType<typeof render>>;

const featured = (screen: Screen) => screen.getByRole("region", { name: "À la une" });

const backdrop = (screen: Screen) => featured(screen).element().querySelector("img");

const animationOf = (element: Element | null | undefined) => {
  const style = element === null || element === undefined ? undefined : getComputedStyle(element);
  return {
    name: style?.animationName,
    duration: style?.animationDuration,
    delay: style?.animationDelay,
  };
};

describe("accueil (spec 11)", () => {
  it("met en avant le film le plus récent, sur sa bannière", async () => {
    const { screen } = await renderHome();

    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Accueil" }))
      .toBeInTheDocument();
    await expect
      .element(featured(screen).getByRole("heading", { level: 2, name: "Récent 1" }))
      .toBeVisible();
    await expect.element(featured(screen)).toMatchTextContent("2024 · Action, Drame");
    expect(featured(screen).element().querySelector("img")?.getAttribute("src")).toBe(
      "https://images.exemple.fr/banniere-1.jpg",
    );
  });

  it("passe d'un des 5 films les plus récents à l'autre par les points", async () => {
    const { screen } = await renderHome();
    const dots = featured(screen).getByRole("navigation", { name: "Films à la une" });
    await expect.element(dots.getByRole("button", { name: "Page 1" })).toBeVisible();
    expect(dots.getByRole("button").elements()).toHaveLength(5);

    await dots.getByRole("button", { name: "Page 3" }).click();

    await expect
      .element(featured(screen).getByRole("heading", { level: 2, name: "Récent 3" }))
      .toBeVisible();
    await expect
      .element(dots.getByRole("button", { name: "Page 3" }))
      .toHaveAttribute("aria-current", "page");
    expect(featured(screen).element().querySelector("img")?.getAttribute("src")).toBe(
      "https://images.exemple.fr/banniere-3.jpg",
    );
  });

  it("n'affiche pas de points pour un seul film à la une", async () => {
    const { screen } = await renderHome({
      listMovies: ({ sort }) => pageOf(sort === "recent" ? RECENT.slice(0, 1) : []),
    });

    await expect.element(featured(screen).getByRole("heading", { name: "Récent 1" })).toBeVisible();
    await expect
      .element(screen.getByRole("navigation", { name: "Films à la une" }))
      .not.toBeInTheDocument();
  });

  it("garde la bannière sans image quand le film n'en a pas", async () => {
    const { screen } = await renderHome({
      listMovies: ({ sort }) =>
        pageOf(
          sort === "recent" ? [makeMovie({ title: "Sans image", backdropUrl: undefined })] : [],
        ),
    });

    await expect
      .element(featured(screen).getByRole("heading", { name: "Sans image" }))
      .toBeVisible();
    expect(featured(screen).element().querySelector("img")).toBeNull();
  });

  it("présente lecture, liste et détails comme bientôt disponibles", async () => {
    const { screen } = await renderHome();

    for (const name of ["Lecture", "Ajouter à ma liste", "Plus d'infos"]) {
      await expect.element(featured(screen).getByRole("button", { name })).toBeDisabled();
    }
    await expect.element(featured(screen)).toMatchTextContent("Bientôt disponible");
  });

  it("aligne les nouveautés dans une rangée qui mène au catalogue", async () => {
    const { asked, listMovies } = recording();
    const { screen, router } = await renderHome({ listMovies });
    const row = screen.getByRole("region", { name: "Nouveautés" });

    await expect.element(row.getByText("Récent 6")).toBeVisible();
    expect(row.getByRole("listitem").elements()).toHaveLength(6);
    expect(asked).toContainEqual({ page: 1, filters: {}, sort: "recent" });

    await row.getByRole("link", { name: "Tout voir : Nouveautés" }).click();

    await expect.element(screen.getByText("Page du catalogue")).toBeVisible();
    expect(router.state.location.pathname).toBe("/catalogue");
  });

  it("ajoute une rangée par genre, qui mène au catalogue filtré sur ce genre", async () => {
    const { asked, listMovies } = recording();
    const { screen, router } = await renderHome({ listMovies });
    const row = screen.getByRole("region", { name: "Action" });

    await expect.element(row.getByText("Heat")).toBeVisible();
    await expect.element(row.getByText("Ronin")).toBeVisible();
    expect(asked).toContainEqual({ page: 1, filters: { genre: 1 } });

    await row.getByRole("link", { name: "Tout voir : Action" }).click();

    await expect.element(screen.getByText("Page du catalogue")).toBeVisible();
    expect(router.state.location.search).toMatchObject({ genre: 1 });
  });

  it("montre la bannière paysage de chaque vignette, sinon son affiche, avec le titre en légende", async () => {
    const { screen } = await renderHome();
    const row = screen.getByRole("region", { name: "Action" });

    await expect.element(row.getByText("Heat")).toBeVisible();
    expect(
      [...row.element().querySelectorAll("img")].map((image) => image.getAttribute("src")),
    ).toEqual(["https://images.exemple.fr/banniere.jpg", "https://images.exemple.fr/affiche.jpg"]);
  });

  it("n'affiche pas la rangée d'un genre sans film", async () => {
    const { screen } = await renderHome();

    await expect.element(screen.getByRole("region", { name: "Action" })).toBeVisible();
    await expect.element(screen.getByRole("region", { name: "Drame" })).not.toBeInTheDocument();
  });

  it("n'affiche pas la rangée d'un genre en échec, sans gêner les autres", async () => {
    const { screen } = await renderHome({
      listMovies: (query) =>
        query.filters.genre === 1 ? Promise.resolve(err("unavailable")) : catalogue(query),
    });

    await expect.element(screen.getByRole("region", { name: "Nouveautés" })).toBeVisible();
    await expect.element(screen.getByRole("region", { name: "Action" })).not.toBeInTheDocument();
  });

  it("indique le chargement tant que les nouveautés n'ont pas répondu", async () => {
    const { screen } = await renderHome({ listMovies: () => new Promise(() => {}) });

    await expect
      .element(screen.getByRole("progressbar", { name: "Chargement de l'accueil" }))
      .toBeVisible();
  });

  it("signale l'échec des nouveautés et permet de réessayer", async () => {
    const answers: Result<MoviePage, CatalogueFailure>[] = [err("unavailable")];
    const { screen } = await renderHome({
      listMovies: (query) =>
        query.sort === "recent"
          ? Promise.resolve(answers.shift() ?? ok({ movies: RECENT, total: 6, lastPage: 1 }))
          : catalogue(query),
    });

    await expect
      .element(screen.getByRole("alert"))
      .toMatchTextContent("Impossible de charger les nouveautés.");

    await screen.getByRole("button", { name: "Réessayer" }).click();

    await expect.element(featured(screen).getByRole("heading", { name: "Récent 1" })).toBeVisible();
    await expect.element(screen.getByRole("alert")).not.toBeInTheDocument();
  });

  it("garde les nouveautés quand les genres ne se chargent pas", async () => {
    const { screen } = await renderHome({
      listGenres: () => Promise.resolve(err("unavailable")),
    });

    await expect.element(screen.getByRole("region", { name: "Nouveautés" })).toBeVisible();
    await expect.element(screen.getByRole("region", { name: "Action" })).not.toBeInTheDocument();
  });

  it("n'écrit que l'année au-dessus d'un film sans genre", async () => {
    const { screen } = await renderHome({
      listMovies: ({ sort }) =>
        pageOf(sort === "recent" ? [makeMovie({ releaseYear: 2023, genres: [] })] : []),
    });

    await expect.element(featured(screen).getByText("2023", { exact: true })).toBeVisible();
  });

  it("n'affiche pas de film à la une quand il n'y a aucun film", async () => {
    const { screen } = await renderHome({ listMovies: () => pageOf([]) });

    await expect.element(screen.getByRole("region", { name: "Nouveautés" })).toBeInTheDocument();
    await expect.element(featured(screen)).not.toBeInTheDocument();
  });

  it("ouvre le catalogue complet, page 1, depuis les nouveautés", async () => {
    const { screen, router } = await renderHome();
    const row = screen.getByRole("region", { name: "Nouveautés" });

    await expect
      .element(row.getByRole("link", { name: "Tout voir : Nouveautés" }))
      .toHaveAttribute("href", "/catalogue?page=1");
    await row.getByRole("link", { name: "Tout voir : Nouveautés" }).click();

    await expect.element(screen.getByText("Page du catalogue")).toBeVisible();
    expect(router.state.location.search).toEqual({ page: 1 });
  });

  it("garde les nouveautés pendant que les genres se chargent", async () => {
    const { screen } = await renderHome({ listGenres: () => new Promise(() => {}) });

    await expect.element(screen.getByRole("region", { name: "Nouveautés" })).toBeVisible();
  });

  it("ouvre le catalogue d'un genre sans attendre, ses films et les genres déjà chargés", async () => {
    const answered = new Set<string>();
    const listMovies: ListMovies = (query) => {
      const key = JSON.stringify(query);
      if (answered.has(key)) {
        return new Promise(() => {});
      }
      answered.add(key);
      return catalogue(query);
    };
    const listGenres: ListGenres = () => {
      if (answered.has("genres")) {
        return new Promise(() => {});
      }
      answered.add("genres");
      return genres();
    };
    const { screen } = await renderHomeAndCatalogue({ listMovies, listGenres });
    const row = screen.getByRole("region", { name: "Action" });
    await expect.element(row.getByText("Heat")).toBeVisible();

    await row.getByRole("link", { name: "Tout voir : Action" }).click();
    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Catalogue" }))
      .toBeVisible();

    expect(screen.getByRole("progressbar").query()).toBeNull();
    expect(screen.getByText("Ronin").query()).not.toBeNull();
    expect(screen.getByRole("button", { name: "Drame" }).query()).not.toBeNull();
  });

  it("fait entrer chaque film à la une en fondu, image et texte", async () => {
    const { screen } = await renderHome();
    await expect.element(featured(screen).getByRole("heading", { name: "Récent 1" })).toBeVisible();
    const first = backdrop(screen);
    const firstText = featured(screen)
      .getByRole("heading", { name: "Récent 1" })
      .element().parentElement;

    await featured(screen).getByRole("button", { name: "Page 2" }).click();
    await expect.element(featured(screen).getByRole("heading", { name: "Récent 2" })).toBeVisible();

    expect(backdrop(screen)).not.toBe(first);
    expect(animationOf(backdrop(screen))).toMatchObject({ duration: "0.6s" });
    expect(animationOf(backdrop(screen)).name).not.toBe("none");
    const text = featured(screen)
      .getByRole("heading", { name: "Récent 2" })
      .element().parentElement;
    expect(text).not.toBe(firstText);
    expect(animationOf(text).name).not.toBe("none");
    expect(animationOf(text).duration).toBe("0.6s");
  });

  it("fait entrer les vignettes d'une rangée l'une après l'autre", async () => {
    const { screen } = await renderHome();
    const row = screen.getByRole("region", { name: "Nouveautés" });
    await expect.element(row.getByText("Récent 6")).toBeVisible();

    const thumbs = row.getByRole("listitem").elements();

    expect(thumbs.map((thumb) => animationOf(thumb).delay)).toEqual([
      "0s",
      "0.04s",
      "0.08s",
      "0.12s",
      "0.16s",
      "0.2s",
    ]);
    expect(animationOf(thumbs[0]).name).not.toBe("none");
  });

  it("garde l'accueil immobile pour qui préfère réduire les animations", async () => {
    await commands.reduceMotion(true);
    const { screen } = await renderHome();
    const row = screen.getByRole("region", { name: "Nouveautés" });
    await expect.element(row.getByText("Récent 6")).toBeVisible();

    expect(animationOf(backdrop(screen)).name).toBe("none");
    expect(animationOf(row.getByRole("listitem").elements()[1]).name).toBe("none");
    await commands.reduceMotion(false);
  });
});
