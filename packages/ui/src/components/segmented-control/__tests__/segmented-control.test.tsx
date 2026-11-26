import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { SegmentedControl, type SegmentedControlProps } from "../segmented-control.tsx";

const renderSegmentedControl = (overrides: Partial<SegmentedControlProps> = {}) =>
  render(
    <SegmentedControl
      label="Mode du compte"
      segments={[
        { label: "Se connecter", current: true, href: "/compte" },
        { label: "Créer un compte", current: false, href: "/compte?mode=inscription" },
      ]}
      {...overrides}
    />,
  );

describe("SegmentedControl", () => {
  it("est une navigation nommée, avec un lien par segment", async () => {
    const screen = await renderSegmentedControl();
    const navigation = screen.getByRole("navigation", { name: "Mode du compte" });

    await expect
      .element(navigation.getByRole("link", { name: "Se connecter" }))
      .toHaveAttribute("href", "/compte");
    await expect
      .element(navigation.getByRole("link", { name: "Créer un compte" }))
      .toHaveAttribute("href", "/compte?mode=inscription");
  });

  it("signale le segment courant, et lui seul", async () => {
    const screen = await renderSegmentedControl();

    await expect
      .element(screen.getByRole("link", { name: "Se connecter" }))
      .toHaveAttribute("aria-current", "page");
    await expect
      .element(screen.getByRole("link", { name: "Créer un compte" }))
      .not.toHaveAttribute("aria-current");
  });

  it("confie le rendu des liens à l'application", async () => {
    const screen = await renderSegmentedControl({
      segments: [
        {
          label: "Se connecter",
          current: true,
          render: (anchor) => <a {...anchor} href="/routeur" data-routeur="oui" />,
        },
      ],
    });

    const link = screen.getByRole("link", { name: "Se connecter" });

    await expect.element(link).toHaveAttribute("data-routeur", "oui");
    await expect.element(link).toHaveAttribute("aria-current", "page");
  });

  it("en creux, en pilule de 44px, avec des segments de même largeur", async () => {
    const screen = await renderSegmentedControl();
    const bar = screen.getByRole("navigation").element().firstElementChild;
    const [first, second] = screen.getByRole("link").elements();

    expect(bar === null ? {} : getComputedStyle(bar)).toMatchObject({
      height: "44px",
      borderTopLeftRadius: "9999px",
      backgroundColor: "rgba(0, 0, 0, 0.2)",
    });
    expect(first?.getBoundingClientRect().width).toBe(second?.getBoundingClientRect().width);
  });

  it("met le segment courant en avant, les autres en texte secondaire", async () => {
    const screen = await renderSegmentedControl();

    await expect.element(screen.getByRole("link", { name: "Se connecter" })).toHaveStyle({
      height: "36px",
      backgroundColor: "rgba(255, 255, 255, 0.26)",
      color: "rgba(255, 255, 255, 0.96)",
      fontSize: "15px",
      textDecorationLine: "none",
    });
    await expect.element(screen.getByRole("link", { name: "Créer un compte" })).toHaveStyle({
      backgroundColor: "rgba(0, 0, 0, 0)",
      color: "rgba(255, 255, 255, 0.56)",
    });
  });
});
