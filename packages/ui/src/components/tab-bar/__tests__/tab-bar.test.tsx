import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { page, userEvent } from "vitest/browser";

import { TabBar, type TabBarProps } from "../tab-bar.tsx";

const HOME = <svg data-testid="maison" />;

const SEARCH = <svg data-testid="loupe" />;

const TABS: TabBarProps["tabs"] = [
  { label: "Accueil", symbol: HOME, current: true, href: "/" },
  { label: "Catalogue", symbol: SEARCH, current: false, href: "/catalogue" },
];

const renderTabBar = (overrides: Partial<TabBarProps> = {}) =>
  render(<TabBar label="Navigation principale" tabs={TABS} {...overrides} />);

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

  it("met l'onglet courant en avant, les autres sans fond hors survol", async () => {
    const screen = await renderTabBar();
    const catalogue = screen.getByRole("link", { name: "Catalogue" });

    await expect
      .element(screen.getByRole("link", { name: "Accueil" }))
      .toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.26)" });
    await expect.element(catalogue).toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0)" });
    await userEvent.hover(catalogue);
    await expect.element(catalogue).toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.18)" });
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
});
