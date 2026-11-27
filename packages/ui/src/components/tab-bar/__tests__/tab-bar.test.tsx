import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { commands, page, userEvent } from "vitest/browser";

import { TabBar, type TabBarProps } from "../tab-bar.tsx";

const HOME = <svg data-testid="maison" />;

const SEARCH = <svg data-testid="loupe" />;

const TABS: TabBarProps["tabs"] = [
  { label: "Accueil", symbol: HOME, current: true, href: "/" },
  { label: "Catalogue", symbol: SEARCH, current: false, href: "/catalogue" },
];

const ON_CATALOGUE: TabBarProps["tabs"] = TABS.map((tab) => ({
  ...tab,
  current: tab.label === "Catalogue",
}));

const NOWHERE: TabBarProps["tabs"] = TABS.map((tab) => ({ ...tab, current: false }));

const renderTabBar = (overrides: Partial<TabBarProps> = {}) =>
  render(<TabBar label="Navigation principale" tabs={TABS} {...overrides} />);

type Screen = Awaited<ReturnType<typeof renderTabBar>>;

const indicatorOf = (screen: Screen) =>
  screen.getByRole("navigation").element().querySelector<HTMLElement>("li[aria-hidden='true']");

const boxOf = (element: Element | null | undefined) => {
  const box = element?.getBoundingClientRect();
  return [box?.left, box?.top, box?.width, box?.height].map((value) => Math.round(value ?? -1));
};

const coversTab = (screen: Screen, name: string) =>
  boxOf(indicatorOf(screen)).join() === boxOf(screen.getByRole("link", { name }).element()).join();

const LIQUID_GLASS = {
  backgroundColor: "rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(16px) saturate(1.8)",
};

describe("TabBar", () => {
  it("est une navigation nommée, avec un lien par onglet", async () => {
    const screen = await renderTabBar();

    const navigation = screen.getByRole("navigation", { name: "Navigation principale" });

    await expect
      .element(navigation.getByRole("link", { name: "Accueil" }))
      .toHaveAttribute("href", "/");
    await expect
      .element(navigation.getByRole("link", { name: "Catalogue" }))
      .toHaveAttribute("href", "/catalogue");
  });

  it("signale l'onglet de la page courante, et lui seul", async () => {
    const screen = await renderTabBar();

    await expect
      .element(screen.getByRole("link", { name: "Accueil" }))
      .toHaveAttribute("aria-current", "page");
    await expect
      .element(screen.getByRole("link", { name: "Catalogue" }))
      .not.toHaveAttribute("aria-current");
  });

  it("confie le rendu des liens à l'application", async () => {
    const screen = await renderTabBar({
      tabs: [
        {
          label: "Catalogue",
          symbol: SEARCH,
          current: true,
          render: (anchor) => <a {...anchor} href="/routeur" data-testid="lien-du-routeur" />,
        },
      ],
    });

    const link = screen.getByRole("link", { name: "Catalogue" });

    await expect.element(link).toHaveAttribute("data-testid", "lien-du-routeur");
    await expect.element(link).toHaveAttribute("aria-current", "page");
    await expect.element(link).toHaveStyle({ width: "44px", height: "44px" });
  });

  it("barre verticale en verre, en pilule, avec des onglets ronds de 44px", async () => {
    const screen = await renderTabBar();

    const bar = screen.getByRole("navigation").element().firstElementChild;
    const [home, catalogue] = screen.getByRole("link").elements();

    expect(bar === null ? "" : getComputedStyle(bar).flexDirection).toBe("column");
    expect(bar === null ? "" : getComputedStyle(bar).borderRadius).toBe("9999px");
    expect(bar === null ? "" : getComputedStyle(bar).padding).toBe("12px");
    expect(
      (catalogue?.getBoundingClientRect().top ?? 0) - (home?.getBoundingClientRect().bottom ?? 0),
    ).toBe(8);
    await expect
      .element(screen.getByRole("link", { name: "Catalogue" }))
      .toHaveStyle({ width: "44px", height: "44px", borderRadius: "9999px" });
    await expect.element(screen.getByTestId("loupe")).toHaveStyle({ width: "24px" });
  });

  it("barre en verre liquide : verre clair et saturé, reflet sur le bord haut", async () => {
    const screen = await renderTabBar();
    const bar = screen.getByRole("navigation").element().firstElementChild;
    const style = bar === null ? undefined : getComputedStyle(bar);

    expect({
      backgroundColor: style?.backgroundColor,
      backdropFilter: style?.backdropFilter,
    }).toEqual(LIQUID_GLASS);
    expect(style?.boxShadow).toContain("rgba(255, 255, 255, 0.4) 0px 1px 0px 0px inset");
    expect(style?.boxShadow).toContain("rgba(0, 0, 0, 0.3) 0px 8px 32px 0px");
  });

  it("pose sous l'onglet courant une pastille de verre plus claire, les autres sans fond hors survol", async () => {
    const screen = await renderTabBar();
    const catalogue = screen.getByRole("link", { name: "Catalogue" });

    await expect.poll(() => coversTab(screen, "Accueil")).toBe(true);
    expect(getComputedStyle(indicatorOf(screen) ?? document.body).backgroundColor).toBe(
      "rgba(255, 255, 255, 0.2)",
    );
    await expect
      .element(screen.getByRole("link", { name: "Accueil" }))
      .toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0)" });
    await expect.element(catalogue).toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0)" });
    await userEvent.hover(catalogue);
    await expect.element(catalogue).toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.18)" });
  });

  it("garde la pastille derrière le symbole et le libellé de l'onglet", async () => {
    await page.viewport(1280, 800);
    const screen = await renderTabBar({ orientation: "horizontal", size: "small" });
    await expect.poll(() => coversTab(screen, "Accueil")).toBe(true);
    const label = screen.getByText("Accueil").element().getBoundingClientRect();

    expect(
      document
        .elementFromPoint(label.left + label.width / 2, label.top + label.height / 2)
        ?.closest("a"),
    ).toBe(screen.getByRole("link", { name: "Accueil" }).element());
  });

  it("place la pastille d'emblée à l'affichage, sans la faire glisser", async () => {
    await page.viewport(1280, 800);
    const screen = await renderTabBar({ orientation: "horizontal", size: "small" });

    await expect.poll(() => coversTab(screen, "Accueil")).toBe(true);
    expect(indicatorOf(screen)?.getAnimations()).toEqual([]);
  });

  it("fait glisser la pastille, avec un rebond, vers le nouvel onglet courant", async () => {
    await page.viewport(1280, 800);
    const screen = await renderTabBar({ orientation: "horizontal", size: "small" });
    await expect.poll(() => coversTab(screen, "Accueil")).toBe(true);
    const indicator = indicatorOf(screen);

    await screen.rerender(
      <TabBar
        label="Navigation principale"
        tabs={ON_CATALOGUE}
        orientation="horizontal"
        size="small"
      />,
    );

    await expect.poll(() => indicator?.getAnimations().length ?? 0).toBeGreaterThan(0);
    expect(indicatorOf(screen)).toBe(indicator);
    const style = getComputedStyle(indicator ?? document.body);
    expect(style.transitionDuration.split(", ")).toContain("0.45s");
    expect(style.transitionTimingFunction).toContain("cubic-bezier(0.34, 1.3, 0.64, 1)");
    await expect.poll(() => coversTab(screen, "Catalogue")).toBe(true);
  });

  it("suit l'onglet courant quand sa taille change", async () => {
    await page.viewport(1280, 800);
    const screen = await renderTabBar({ orientation: "horizontal", size: "small" });
    await expect.poll(() => coversTab(screen, "Accueil")).toBe(true);

    await page.viewport(390, 800);

    await expect.poll(() => coversTab(screen, "Accueil")).toBe(true);
    expect(boxOf(indicatorOf(screen))[2]).toBe(32);
  });

  it("n'a pas de pastille quand aucun onglet n'est courant", async () => {
    const screen = await renderTabBar({ tabs: NOWHERE });

    await expect.element(screen.getByRole("link", { name: "Accueil" })).toBeVisible();
    expect(indicatorOf(screen)).toBeNull();
  });

  it("retire la pastille en quittant les pages des onglets", async () => {
    const screen = await renderTabBar();
    await expect.poll(() => coversTab(screen, "Accueil")).toBe(true);

    await screen.rerender(<TabBar label="Navigation principale" tabs={NOWHERE} />);

    await expect.poll(() => indicatorOf(screen)).toBeNull();
  });

  it("déplace la pastille sans glisser pour qui préfère réduire les animations", async () => {
    await commands.reduceMotion(true);
    await page.viewport(1280, 800);
    const screen = await renderTabBar({ orientation: "horizontal", size: "small" });
    await expect.poll(() => coversTab(screen, "Accueil")).toBe(true);

    await screen.rerender(
      <TabBar
        label="Navigation principale"
        tabs={ON_CATALOGUE}
        orientation="horizontal"
        size="small"
      />,
    );

    await expect.poll(() => coversTab(screen, "Catalogue")).toBe(true);
    expect(indicatorOf(screen)?.getAnimations()).toEqual([]);
    await commands.reduceMotion(false);
  });

  it("ne montre les libellés qu'au survol de la barre", async () => {
    const screen = await renderTabBar();
    const label = screen.getByText("Catalogue");
    await userEvent.unhover(screen.getByRole("link", { name: "Catalogue" }));

    await expect.element(label).not.toBeVisible();
    await userEvent.hover(screen.getByRole("link", { name: "Catalogue" }));
    await expect.element(label).toBeVisible();
  });

  it("à l'horizontale, aligne les onglets en ligne avec leur libellé visible", async () => {
    await page.viewport(1280, 800);
    const screen = await renderTabBar({ orientation: "horizontal" });

    const bar = screen.getByRole("navigation").element().firstElementChild;
    const [home, catalogue] = screen.getByRole("link").elements();

    expect(bar === null ? "" : getComputedStyle(bar).flexDirection).toBe("row");
    expect(
      (catalogue?.getBoundingClientRect().left ?? 0) - (home?.getBoundingClientRect().right ?? 0),
    ).toBe(8);
    await expect.element(screen.getByText("Catalogue")).toBeVisible();
    await expect.element(screen.getByRole("link", { name: "Catalogue" })).toHaveStyle({
      height: "44px",
      paddingLeft: "16px",
      paddingRight: "20px",
      columnGap: "8px",
      fontSize: "17px",
    });
  });

  it("à l'horizontale, garde les noms des onglets une seule fois", async () => {
    const screen = await renderTabBar({ orientation: "horizontal" });

    await expect
      .element(screen.getByRole("link", { name: "Accueil" }))
      .toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Catalogue" }).elements()).toHaveLength(1);
  });

  it("à l'horizontale sur un écran étroit, ne garde que les symboles", async () => {
    await page.viewport(390, 800);
    const screen = await renderTabBar({ orientation: "horizontal" });

    await expect.element(screen.getByText("Catalogue")).not.toBeVisible();
    await expect
      .element(screen.getByRole("link", { name: "Catalogue" }))
      .toHaveStyle({ width: "44px", height: "44px", paddingLeft: "0px" });
  });

  it("à l'horizontale sur un écran large, montre les libellés", async () => {
    await page.viewport(1280, 800);
    const screen = await renderTabBar({ orientation: "horizontal" });

    await expect.element(screen.getByText("Catalogue")).toBeVisible();
  });

  it("en petite taille, des onglets de 32 px au texte Callout, dans une barre resserrée", async () => {
    await page.viewport(1280, 800);
    const screen = await renderTabBar({ orientation: "horizontal", size: "small" });
    const bar = screen.getByRole("navigation").element().firstElementChild;
    const [home, catalogue] = screen.getByRole("link").elements();

    await expect.element(screen.getByRole("link", { name: "Catalogue" })).toHaveStyle({
      height: "32px",
      paddingLeft: "12px",
      paddingRight: "16px",
      columnGap: "6px",
      fontSize: "15px",
    });
    await expect.element(screen.getByTestId("loupe")).toHaveStyle({ width: "16px" });
    expect(bar === null ? "" : getComputedStyle(bar).padding).toBe("4px");
    expect(
      (catalogue?.getBoundingClientRect().left ?? 0) - (home?.getBoundingClientRect().right ?? 0),
    ).toBe(4);
  });

  it("en petite taille sur un écran étroit, des onglets ronds de 32 px", async () => {
    await page.viewport(390, 800);
    const screen = await renderTabBar({ orientation: "horizontal", size: "small" });

    await expect
      .element(screen.getByRole("link", { name: "Catalogue" }))
      .toHaveStyle({ width: "32px", height: "32px", paddingLeft: "0px" });
  });
});
