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

import { AppShell } from "../app-shell.tsx";

const renderShell = async (url: string) => {
  const root = createRootRoute({ component: AppShell });
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

  it("place la navigation à l'horizontale, en haut à droite, dans la barre du logo", async () => {
    await page.viewport(1280, 800);
    const { screen } = await renderShell("/");
    const banner = screen.getByRole("banner");
    const tabs = banner.getByRole("navigation", { name: "Navigation principale" });

    await expect.element(tabs).toBeVisible();
    const bar = tabs.element().firstElementChild;
    expect(bar === null ? "" : getComputedStyle(bar).flexDirection).toBe("row");
    expect(
      banner.element().getBoundingClientRect().right - tabs.element().getBoundingClientRect().right,
    ).toBe(40);
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
      .toHaveStyle({ position: "absolute", height: "92px" });
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
});
