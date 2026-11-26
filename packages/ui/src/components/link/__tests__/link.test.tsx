import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import { Link, type LinkProps } from "../link.tsx";

const SYMBOL = <svg data-testid="symbole" />;

type LinkLook = Partial<Pick<LinkProps, "symbol" | "symbolPlacement" | "size" | "appearance">>;

const renderLink = (overrides: LinkLook = {}) =>
  render(<Link label="Suivant" href="/films?page=2" {...overrides} />);

describe("Link", () => {
  it("est un lien nommé par son texte, vers son adresse", async () => {
    const screen = await renderLink();

    await expect
      .element(screen.getByRole("link", { name: "Suivant" }))
      .toHaveAttribute("href", "/films?page=2");
  });

  it("confie le rendu à l'application, qui reçoit l'apparence et le contenu", async () => {
    const screen = await render(
      <Link
        label="Suivant"
        symbol={SYMBOL}
        render={(anchor) => <a {...anchor} href="/routeur" data-testid="lien-du-routeur" />}
      />,
    );

    const link = screen.getByRole("link", { name: "Suivant" });

    await expect.element(link).toHaveAttribute("data-testid", "lien-du-routeur");
    await expect.element(link).toHaveAttribute("href", "/routeur");
    await expect.element(link).toHaveStyle({ borderRadius: "8px", textDecorationLine: "none" });
    await expect.element(screen.getByTestId("symbole")).toBeInTheDocument();
  });

  it("place le symbole avant le texte par défaut", async () => {
    const screen = await renderLink({ symbol: SYMBOL });

    const [first] = screen.getByRole("link").element().childNodes;

    expect(first?.contains(screen.getByTestId("symbole").element())).toBe(true);
  });

  it("peut placer le symbole après le texte", async () => {
    const screen = await renderLink({ symbol: SYMBOL, symbolPlacement: "trailing" });

    const nodes = screen.getByRole("link").element().childNodes;

    expect(nodes[0]?.textContent).toBe("Suivant");
    expect(nodes[1]?.contains(screen.getByTestId("symbole").element())).toBe(true);
  });

  it("sans symbole, ne contient que son texte", async () => {
    const screen = await renderLink();

    expect(screen.getByRole("link").element().childNodes).toHaveLength(1);
  });

  it("petit par défaut : pilule de texte de 26px, Callout, coins de 8", async () => {
    const screen = await renderLink();

    await expect.element(screen.getByRole("link")).toHaveStyle({
      height: "26px",
      paddingLeft: "4px",
      paddingRight: "4px",
      borderRadius: "8px",
      fontSize: "15px",
      lineHeight: "20px",
      textDecorationLine: "none",
      color: "rgba(255, 255, 255, 0.96)",
    });
  });

  it("taille regular : celle d'un bouton texte et symbole", async () => {
    const screen = await renderLink({ size: "regular", symbol: SYMBOL });

    await expect.element(screen.getByRole("link")).toHaveStyle({
      height: "44px",
      paddingLeft: "20px",
      borderRadius: "9999px",
      columnGap: "6px",
      fontSize: "17px",
      fontWeight: "700",
    });
    await expect.element(screen.getByTestId("symbole")).toHaveStyle({ width: "20px" });
  });

  it("sur fond de verre par défaut, plus clair au survol", async () => {
    const screen = await renderLink();
    const link = screen.getByRole("link");

    await expect.element(link).toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.12)" });
    await userEvent.hover(link);
    await expect.element(link).toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.18)" });
  });

  it("sans fond hors survol, en pilule", async () => {
    const screen = await renderLink({ appearance: "plain" });

    await expect
      .element(screen.getByRole("link"))
      .toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0)", borderRadius: "9999px" });
  });
});
