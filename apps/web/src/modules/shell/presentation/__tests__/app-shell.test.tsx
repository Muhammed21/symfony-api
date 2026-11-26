import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { commands, page } from "vitest/browser";

import { AppShell } from "../app-shell.tsx";

const renderShell = async (url: string) => {
  const root = createRootRoute({
    component: () => <AppShell account={<button type="button">Compte factice</button>} />,
  });
  const page = (path: string, text: string) =>
    createRoute({ getParentRoute: () => root, path, component: () => <p>{text}</p> });
  const router = createRouter({
    routeTree: root.addChildren([
      page("/", "Page d'accueil"),
      page("/catalogue", "Page du catalogue"),
    ]),
    history: createMemoryHistory({ initialEntries: [url] }),
  });
  const screen = await render(<RouterProvider router={router} />);
  return { screen, router };
};

type Screen = Awaited<ReturnType<typeof renderShell>>["screen"];

const pageContent = (screen: Screen) => screen.getByRole("main").element().firstElementChild;

const animationOf = (element: Element | null) =>
  element === null
    ? { name: "", duration: "" }
    : {
        name: getComputedStyle(element).animationName,
        duration: getComputedStyle(element).animationDuration,
      };

describe("coque de l'application (spec 11)", () => {
  it("place la page dans le contenu principal de la fenêtre", async () => {
    const { screen } = await renderShell("/");

    await expect.element(screen.getByRole("main")).toMatchTextContent("Page d'accueil");
  });

  it("montre le logo, qui ramène à l'accueil", async () => {
    const { screen } = await renderShell("/catalogue");

    await screen.getByRole("banner").getByRole("link", { name: "Prime Video" }).click();

    await expect.element(screen.getByText("Page d'accueil")).toBeVisible();
  });

  it("dessine le logo Prime Video en 117 × 36, d'une seule couleur, celle du texte", async () => {
    const { screen } = await renderShell("/");
    const logo = screen.getByRole("link", { name: "Prime Video" }).element().querySelector("svg");
    const fills = [...(logo?.querySelectorAll("path") ?? [])].map(
      (path) => getComputedStyle(path).fill,
    );

    expect(logo?.getBoundingClientRect().height).toBe(36);
    expect(Math.round(logo?.getBoundingClientRect().width ?? 0)).toBe(117);
    expect(fills.length).toBeGreaterThan(10);
    expect(new Set(fills)).toEqual(new Set(["rgba(255, 255, 255, 0.96)"]));
  });

  it("affiche le logo sans soulignement de lien", async () => {
    const { screen } = await renderShell("/");

    await expect
      .element(screen.getByRole("link", { name: "Prime Video" }))
      .toHaveStyle({ textDecorationLine: "none" });
  });

  it("place une navigation compacte à gauche, juste après le logo", async () => {
    await page.viewport(1280, 800);
    const { screen } = await renderShell("/");
    const banner = screen.getByRole("banner");
    const tabs = banner.getByRole("navigation", { name: "Navigation principale" });
    const logo = banner.getByRole("link", { name: "Prime Video" }).element();

    await expect.element(tabs).toBeVisible();
    const bar = tabs.element().firstElementChild;
    expect(bar === null ? "" : getComputedStyle(bar).flexDirection).toBe("row");
    expect(tabs.element().getBoundingClientRect().left - logo.getBoundingClientRect().right).toBe(
      40,
    );
    await expect
      .element(tabs.getByRole("link", { name: "Catalogue" }))
      .toHaveStyle({ height: "32px", fontSize: "15px" });
    expect(
      screen.getByRole("navigation", { name: "Navigation principale" }).elements(),
    ).toHaveLength(1);
  });

  it("signale l'onglet Accueil sur l'accueil", async () => {
    const { screen } = await renderShell("/");
    const tabs = screen.getByRole("navigation", { name: "Navigation principale" });

    await expect
      .element(tabs.getByRole("link", { name: "Accueil" }))
      .toHaveAttribute("aria-current", "page");
    await expect
      .element(tabs.getByRole("link", { name: "Catalogue" }))
      .not.toHaveAttribute("aria-current");
  });

  it("ouvre le catalogue par son onglet, qui devient l'onglet courant", async () => {
    const { screen, router } = await renderShell("/");
    const tabs = screen.getByRole("navigation", { name: "Navigation principale" });

    await tabs.getByRole("link", { name: "Catalogue" }).click();

    await expect.element(screen.getByText("Page du catalogue")).toBeVisible();
    expect(router.state.location.pathname).toBe("/catalogue");
    await expect
      .element(tabs.getByRole("link", { name: "Catalogue" }))
      .toHaveAttribute("aria-current", "page");
    await expect
      .element(tabs.getByRole("link", { name: "Accueil" }))
      .not.toHaveAttribute("aria-current");
  });

  it("garde l'onglet Catalogue courant quelle que soit la recherche", async () => {
    const { screen } = await renderShell("/catalogue?genre=6&page=2");

    await expect
      .element(screen.getByRole("link", { name: "Catalogue" }))
      .toHaveAttribute("aria-current", "page");
  });

  it("met la barre de navigation par-dessus la page, sur 92px de haut", async () => {
    const { screen } = await renderShell("/");

    await expect
      .element(screen.getByRole("banner"))
      .toHaveStyle({ position: "fixed", height: "92px" });
  });

  it("tient sur un téléphone sans défilement horizontal", async () => {
    await page.viewport(390, 844);
    const { screen } = await renderShell("/");

    await expect.element(screen.getByRole("banner")).toBeVisible();
    expect(document.documentElement.scrollWidth).toBe(390);
    expect(
      screen.getByRole("link", { name: "Prime Video" }).element().getBoundingClientRect().height,
    ).toBeLessThan(40);
  });

  it("couvre toute la largeur du navigateur, sans coins arrondis", async () => {
    const { screen } = await renderShell("/");
    const page = screen.getByRole("main").element().parentElement;

    expect(page === null ? "" : getComputedStyle(page).borderRadius).toBe("0px");
    expect(page?.getBoundingClientRect().left).toBe(0);
    expect(page?.getBoundingClientRect().width).toBe(document.documentElement.clientWidth);
  });

  it("fait entrer chaque page en fondu, en 320 ms", async () => {
    const { screen } = await renderShell("/");
    await expect.element(screen.getByText("Page d'accueil")).toBeVisible();

    expect(animationOf(pageContent(screen)).name).not.toBe("none");
    expect(animationOf(pageContent(screen)).duration).toBe("0.32s");
  });

  it("rejoue l'entrée en changeant de page, pas en changeant de recherche", async () => {
    const { screen, router } = await renderShell("/");
    await expect.element(screen.getByText("Page d'accueil")).toBeVisible();
    const home = pageContent(screen);

    await screen.getByRole("link", { name: "Catalogue" }).click();
    await expect.element(screen.getByText("Page du catalogue")).toBeVisible();
    const catalogue = pageContent(screen);
    await router.navigate({ to: "/catalogue", search: { page: 2 } });

    expect(catalogue).not.toBe(home);
    expect(pageContent(screen)).toBe(catalogue);
  });

  it("garde la barre du logo en haut de l'écran, sur fond de verre une fois la page défilée", async () => {
    await page.viewport(1280, 600);
    const { screen } = await renderShell("/");
    const banner = screen.getByRole("banner");
    document.body.style.minHeight = "3000px";

    await expect.element(banner).toHaveStyle({
      position: "fixed",
      backgroundColor: "rgba(0, 0, 0, 0)",
    });

    window.scrollTo(0, 400);

    await expect.element(banner).toHaveAttribute("data-scrolled", "true");
    await expect.poll(() => getComputedStyle(banner.element()).backdropFilter).toBe("blur(50px)");
    expect(getComputedStyle(banner.element()).backgroundColor).not.toBe("rgba(0, 0, 0, 0)");
    expect(banner.element().getBoundingClientRect().top).toBe(0);
    window.scrollTo(0, 0);
    await expect.element(banner).not.toHaveAttribute("data-scrolled");
    document.body.style.minHeight = "";
  });

  it("supprime les animations pour qui préfère réduire les animations", async () => {
    await commands.reduceMotion(true);
    const { screen } = await renderShell("/");
    await expect.element(screen.getByText("Page d'accueil")).toBeVisible();

    expect(animationOf(pageContent(screen)).name).toBe("none");
    await commands.reduceMotion(false);
  });

  it("place le compte seul tout à droite de la barre", async () => {
    await page.viewport(1280, 800);
    const { screen } = await renderShell("/");
    const banner = screen.getByRole("banner");
    const account = banner.getByRole("button", { name: "Compte factice" }).element();
    const bar = banner.element().getBoundingClientRect();

    expect(bar.right - account.getBoundingClientRect().right).toBe(40);
    expect(
      Math.abs(
        account.getBoundingClientRect().top +
          account.getBoundingClientRect().height / 2 -
          (bar.top + bar.height / 2),
      ),
    ).toBeLessThan(1);
  });

  it("crédite TMDB en pied de page, avec son logo plus discret que le nôtre", async () => {
    const { screen } = await renderShell("/");
    const footer = screen.getByRole("contentinfo");
    const tmdbLogo = footer.getByRole("img", { name: "TMDB" });
    const notice = footer.getByText(
      "This product uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.",
    );

    await expect.element(tmdbLogo).toHaveAttribute("src", "/tmdb-logo.svg");
    await expect.element(notice).toHaveAttribute("lang", "en");
    await expect.poll(() => tmdbLogo.element().getBoundingClientRect().height).toBeGreaterThan(0);
    expect(tmdbLogo.element().getBoundingClientRect().height).toBeLessThan(
      screen.getByRole("link", { name: "Prime Video" }).element().getBoundingClientRect().height,
    );
  });
});
