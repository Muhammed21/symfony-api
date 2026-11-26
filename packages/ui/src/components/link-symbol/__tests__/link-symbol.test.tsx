import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { LinkSymbol, type LinkSymbolProps } from "../link-symbol.tsx";

const CHEVRON = <svg data-testid="chevron" />;

type LinkSymbolLook = Partial<Pick<LinkSymbolProps, "size" | "appearance">>;

const renderLinkSymbol = (overrides: LinkSymbolLook = {}) =>
  render(<LinkSymbol label="Tout voir" symbol={CHEVRON} href="/catalogue" {...overrides} />);

describe("LinkSymbol", () => {
  it("est un lien nommé par son libellé, vers son adresse", async () => {
    const screen = await renderLinkSymbol();

    await expect
      .element(screen.getByRole("link", { name: "Tout voir" }))
      .toHaveAttribute("href", "/catalogue");
  });

  it("ne montre que son symbole, décoratif", async () => {
    const screen = await renderLinkSymbol();

    await expect.element(screen.getByRole("link")).toHaveTextContent("");
    expect(screen.getByTestId("chevron").element().closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("confie le rendu à l'application", async () => {
    const screen = await render(
      <LinkSymbol
        label="Tout voir"
        symbol={CHEVRON}
        size="mini"
        render={(anchor) => <a {...anchor} href="/routeur" data-testid="lien-du-routeur" />}
      />,
    );

    const link = screen.getByRole("link", { name: "Tout voir" });

    await expect.element(link).toHaveAttribute("data-testid", "lien-du-routeur");
    await expect.element(link).toHaveStyle({ width: "28px", height: "28px" });
  });

  it("a l'allure d'un bouton symbole : rond, 44px par défaut, sur fond de verre", async () => {
    const screen = await renderLinkSymbol();

    await expect.element(screen.getByRole("link")).toHaveStyle({
      width: "44px",
      height: "44px",
      borderRadius: "9999px",
      backgroundColor: "rgba(255, 255, 255, 0.12)",
    });
    await expect.element(screen.getByTestId("chevron")).toHaveStyle({ width: "20px" });
  });

  it("mini : 28px, symbole de 14px", async () => {
    const screen = await renderLinkSymbol({ size: "mini" });

    await expect.element(screen.getByRole("link")).toHaveStyle({ width: "28px", height: "28px" });
    await expect.element(screen.getByTestId("chevron")).toHaveStyle({ width: "14px" });
  });

  it("peut se passer de fond", async () => {
    const screen = await renderLinkSymbol({ appearance: "plain" });

    await expect
      .element(screen.getByRole("link"))
      .toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0)" });
  });
});
