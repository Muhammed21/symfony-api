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

import type { CatalogueFailure, Movie } from "../../domain/movie.ts";
import { trailerRoute } from "../trailer-route.tsx";
import type { GetMovie } from "../use-cases.ts";

const FIGHT_CLUB: Movie = {
  id: 550,
  title: "Fight Club",
  releaseYear: 1999,
  duration: 139,
  ageRating: "16+",
  posterUrl: undefined,
  backdropUrl: undefined,
  trailerKey: "SUXWAEX2jlg",
  genres: ["Drame"],
};

type Answer = Result<Movie, CatalogueFailure>;

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
      getMovie: answering(ok({ ...FIGHT_CLUB, trailerKey: undefined })).getMovie,
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

  it("passe d'un film à l'autre sans garder la bande-annonce du premier", async () => {
    const { asked, getMovie } = answering(
      ok(FIGHT_CLUB),
      ok({ ...FIGHT_CLUB, id: 680, title: "Pulp Fiction", trailerKey: "s7EdQ4FqbhY" }),
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
