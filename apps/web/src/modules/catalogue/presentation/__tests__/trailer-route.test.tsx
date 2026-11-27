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
import { page } from "vitest/browser";

import { err, ok, type Result } from "@prime/result";

import type { CatalogueFailure, MovieDetail } from "../../domain/movie.ts";
import { trailerRoute } from "../trailer-route.tsx";
import type { GetMovie } from "../use-cases.ts";

const FIGHT_CLUB: MovieDetail = {
  id: 550,
  title: "Fight Club",
  synopsis: "Le narrateur, sans identité précise, vit seul, travaille seul, dort seul.",
  releaseYear: 1999,
  duration: 139,
  ageRating: "16+",
  posterUrl: undefined,
  backdropUrl: undefined,
  trailerKey: "SUXWAEX2jlg",
  genres: ["Drame", "Thriller"],
  averageRating: undefined,
  reviewCount: 0,
  similarMovies: [],
};

const makeMovie = (overrides: Partial<MovieDetail> = {}): MovieDetail => ({
  ...FIGHT_CLUB,
  ...overrides,
});

type Answer = Result<MovieDetail, CatalogueFailure>;

const NEVER_ANSWERED = new Promise<Answer>(() => {});

const answering = (...answers: readonly (Answer | Promise<Answer>)[]) => {
  const asked: number[] = [];
  const getMovie: GetMovie = (id) => {
    asked.push(id);
    return Promise.resolve(answers[Math.min(asked.length, answers.length) - 1] ?? NEVER_ANSWERED);
  };
  return { asked, getMovie };
};

const renderTrailer = async ({
  url = "/films/550/bande-annonce",
  getMovie = answering(ok(FIGHT_CLUB)).getMovie,
}: { readonly url?: string; readonly getMovie?: GetMovie } = {}) => {
  const root = createRootRoute();
  const home = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: () => <p>Page d'accueil</p>,
  });
  const router = createRouter({
    routeTree: root.addChildren([home, trailerRoute({ parent: root, getMovie })]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  const screen = await render(
    <QueryClientProvider client={new QueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return { screen, router };
};

type Screen = Awaited<ReturnType<typeof renderTrailer>>["screen"];

const player = (screen: Screen) => screen.getByTitle("Bande-annonce de Fight Club");

const details = (screen: Screen) => screen.getByRole("region", { name: "À propos du film" });

const similar = (screen: Screen) => screen.getByRole("region", { name: "Titres similaires" });

const top = (element: Element) => element.getBoundingClientRect().top;

const box = (element: Element) => element.getBoundingClientRect();

const answeringOnly = (movie: MovieDetail) => answering(ok(movie)).getMovie;

describe("bande-annonce d'un film (spec 14)", () => {
  it("lit la bande-annonce YouTube du film, sous son titre", async () => {
    const { asked, getMovie } = answering(ok(FIGHT_CLUB));
    const { screen } = await renderTrailer({ getMovie });

    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Fight Club" }))
      .toBeVisible();
    await expect
      .element(player(screen))
      .toHaveAttribute(
        "src",
        "https://www.youtube-nocookie.com/embed/SUXWAEX2jlg?autoplay=1&rel=0",
      );
    await expect.element(player(screen)).toHaveAttribute("allowfullscreen");
    expect(player(screen).element().getAttribute("allow")).toContain("autoplay");
    expect(asked).toEqual([550]);
  });

  it.each([
    [1280, 800],
    [1280, 1400],
    [390, 844],
  ])("montre le lecteur en 16:9, entier dans une fenêtre de %i × %i", async (width, height) => {
    await page.viewport(width, height);
    const { screen } = await renderTrailer();
    await expect.element(player(screen)).toBeVisible();
    const box = player(screen).element().getBoundingClientRect();

    expect(Math.round((box.width / box.height) * 9)).toBe(16);
    expect(box.bottom).toBeLessThanOrEqual(height);
    expect(box.right).toBeLessThanOrEqual(width);
    expect(Math.max(box.width, width - 80 - box.width)).toBe(box.width);
    expect(document.documentElement.scrollWidth).toBe(width);
  });

  it("présente l'année et les genres au-dessus du titre, comme la bannière de l'accueil", async () => {
    const { screen } = await renderTrailer();

    await expect.element(screen.getByText("1999 · Drame, Thriller")).toBeVisible();
  });

  it("décrit le film après le lecteur : classification, année, durée et synopsis", async () => {
    const { screen } = await renderTrailer();

    await expect.element(details(screen).getByText("16+", { exact: true })).toBeVisible();
    await expect.element(details(screen).getByText("2 h 19")).toBeVisible();
    await expect.element(details(screen).getByText(FIGHT_CLUB.synopsis ?? "")).toBeVisible();
    expect(top(details(screen).element())).toBeGreaterThan(top(player(screen).element()));
  });

  it.each([
    [1440, 900, "à côté du lecteur"],
    [390, 844, "sous le lecteur"],
  ])("en %i × %i, place la fiche du film %s", async (width, height, place) => {
    await page.viewport(width, height);
    const { screen } = await renderTrailer();
    await expect.element(player(screen)).toBeVisible();
    const playerBox = box(player(screen).element());
    const detailsBox = box(details(screen).element());

    expect(
      place === "à côté du lecteur"
        ? detailsBox.left >= playerBox.right && detailsBox.top === playerBox.top
        : detailsBox.top >= playerBox.bottom,
    ).toBe(true);
  });

  it("dit d'un film tous publics qu'il l'est", async () => {
    const { screen } = await renderTrailer({
      getMovie: answeringOnly(makeMovie({ ageRating: "ALL" })),
    });

    await expect.element(details(screen).getByText("Tous publics")).toBeVisible();
  });

  it("n'invente pas de synopsis quand le film n'en a pas", async () => {
    const { screen } = await renderTrailer({
      getMovie: answeringOnly(makeMovie({ synopsis: undefined })),
    });

    await expect.element(details(screen)).toBeVisible();
    expect(details(screen).element().querySelector("p[data-synopsis]")).toBeNull();
  });

  it.each([
    [4.5, 2, "4,5 / 5 · 2 avis"],
    [3, 1, "3 / 5 · 1 avis"],
  ])("donne la note moyenne %s et le nombre d'avis", async (averageRating, reviewCount, text) => {
    const { screen } = await renderTrailer({
      getMovie: answeringOnly(makeMovie({ averageRating, reviewCount })),
    });

    await expect.element(details(screen).getByText(text)).toBeVisible();
  });

  it("dit quand le film n'a pas encore d'avis", async () => {
    const { screen } = await renderTrailer();

    await expect.element(details(screen).getByText("Pas encore d'avis")).toBeVisible();
  });

  it("met la bannière du film en fond, fondue dans le noir", async () => {
    const { screen } = await renderTrailer({
      getMovie: answeringOnly(makeMovie({ backdropUrl: "https://images.exemple.fr/banniere.jpg" })),
    });
    await expect.element(player(screen)).toBeVisible();

    const backdrop = screen.container.querySelector<HTMLImageElement>('img[alt=""]');
    expect(backdrop?.getAttribute("src")).toBe("https://images.exemple.fr/banniere.jpg");
    expect(getComputedStyle(backdrop?.parentElement ?? document.body).maskImage).toContain(
      "linear-gradient",
    );
  });

  it("sans bannière, n'affiche aucune image de fond", async () => {
    const { screen } = await renderTrailer();
    await expect.element(player(screen)).toBeVisible();

    expect(screen.container.querySelector('img[alt=""]')).toBeNull();
  });

  it("propose les titres similaires, qui mènent à leur bande-annonce", async () => {
    const { screen, router } = await renderTrailer({
      getMovie: answering(
        ok(
          makeMovie({
            similarMovies: [
              {
                id: 680,
                title: "Pulp Fiction",
                posterUrl: "https://images.exemple.fr/affiche.jpg",
                backdropUrl: "https://images.exemple.fr/banniere.jpg",
              },
              { id: 807, title: "Seven", posterUrl: undefined, backdropUrl: undefined },
            ],
          }),
        ),
        ok(makeMovie({ id: 680, title: "Pulp Fiction" })),
      ).getMovie,
    });
    const pulpFiction = similar(screen).getByRole("link", { name: "Pulp Fiction" });

    await expect.element(pulpFiction).toHaveAttribute("href", "/films/680/bande-annonce");
    await expect
      .element(similar(screen).getByRole("link", { name: "Seven" }))
      .toHaveAttribute("href", "/films/807/bande-annonce");
    expect(pulpFiction.element().querySelector("img")?.getAttribute("src")).toBe(
      "https://images.exemple.fr/banniere.jpg",
    );

    await pulpFiction.click();

    await expect
      .element(screen.getByRole("heading", { level: 1, name: "Pulp Fiction" }))
      .toBeVisible();
    expect(router.state.location.pathname).toBe("/films/680/bande-annonce");
  });

  it("sans titre similaire, n'affiche pas la rangée", async () => {
    const { screen } = await renderTrailer();
    await expect.element(player(screen)).toBeVisible();

    await expect.element(similar(screen)).not.toBeInTheDocument();
  });

  it("garde la fiche du film quand il n'a pas de bande-annonce", async () => {
    const { screen } = await renderTrailer({
      getMovie: answeringOnly(makeMovie({ trailerKey: undefined })),
    });

    await expect
      .element(screen.getByText("Ce film n'a pas encore de bande-annonce."))
      .toBeVisible();
    await expect.element(details(screen).getByText("2 h 19")).toBeVisible();
  });

  it("ramène à l'accueil", async () => {
    const { screen, router } = await renderTrailer();

    await screen.getByRole("link", { name: "Retour" }).click();

    await expect.element(screen.getByText("Page d'accueil")).toBeVisible();
    expect(router.state.location.pathname).toBe("/");
  });

  it("annonce le chargement", async () => {
    const { screen } = await renderTrailer({ getMovie: answering(NEVER_ANSWERED).getMovie });

    await expect
      .element(screen.getByRole("progressbar", { name: "Chargement de la bande-annonce" }))
      .toBeVisible();
  });

  it("dit quand le film n'a pas de bande-annonce", async () => {
    const { screen } = await renderTrailer({
      getMovie: answering(ok(makeMovie({ trailerKey: undefined }))).getMovie,
    });

    await expect
      .element(screen.getByText("Ce film n'a pas encore de bande-annonce."))
      .toBeVisible();
    expect(screen.container.querySelector("iframe")).toBeNull();
  });

  it("dit quand le film n'existe pas", async () => {
    const { screen } = await renderTrailer({ getMovie: answering(err("not_found")).getMovie });

    await expect.element(screen.getByText("Ce film n'existe pas.")).toBeVisible();
  });

  it.each(["abc", "550abc", "x550"])(
    "dit que l'identifiant « %s » ne désigne aucun film, sans appel",
    async (movieId) => {
      const { asked, getMovie } = answering(ok(FIGHT_CLUB));
      const { screen } = await renderTrailer({ url: `/films/${movieId}/bande-annonce`, getMovie });

      await expect.element(screen.getByText("Ce film n'existe pas.")).toBeVisible();
      expect(asked).toEqual([]);
    },
  );

  it("en passant à un autre film, n'affiche jamais le précédent pendant le chargement", async () => {
    const { screen, router } = await renderTrailer({
      getMovie: answering(ok(FIGHT_CLUB), NEVER_ANSWERED).getMovie,
    });
    await expect.element(player(screen)).toBeVisible();

    await router.navigate({ to: "/films/$movieId/bande-annonce", params: { movieId: "680" } });

    await expect
      .element(screen.getByRole("progressbar", { name: "Chargement de la bande-annonce" }))
      .toBeVisible();
    await expect.element(screen.getByText("Fight Club")).not.toBeInTheDocument();
  });

  it("passe d'un film à l'autre sans garder la bande-annonce du premier", async () => {
    const { asked, getMovie } = answering(
      ok(FIGHT_CLUB),
      ok(makeMovie({ id: 680, title: "Pulp Fiction", trailerKey: "s7EdQ4FqbhY" })),
    );
    const { screen, router } = await renderTrailer({ getMovie });
    await expect.element(player(screen)).toBeVisible();

    await router.navigate({ to: "/films/$movieId/bande-annonce", params: { movieId: "680" } });

    await expect
      .element(screen.getByTitle("Bande-annonce de Pulp Fiction"))
      .toHaveAttribute(
        "src",
        "https://www.youtube-nocookie.com/embed/s7EdQ4FqbhY?autoplay=1&rel=0",
      );
    expect(asked).toEqual([550, 680]);
  });

  it.each(["unavailable", "invalid_response"] as const)(
    "propose de réessayer quand le film ne se charge pas : %s",
    async (failure) => {
      const { asked, getMovie } = answering(err(failure), ok(FIGHT_CLUB));
      const { screen } = await renderTrailer({ getMovie });

      await expect
        .element(screen.getByRole("alert"))
        .toMatchTextContent("Impossible de charger la bande-annonce.");
      await screen.getByRole("button", { name: "Réessayer" }).click();

      await expect.element(player(screen)).toBeVisible();
      expect(asked).toEqual([550, 550]);
    },
  );
});
