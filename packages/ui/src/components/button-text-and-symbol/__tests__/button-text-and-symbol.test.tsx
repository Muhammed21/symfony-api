import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { ButtonTextAndSymbol, type ButtonTextAndSymbolProps } from "../button-text-and-symbol.tsx";

const renderButton = (overrides: Partial<ButtonTextAndSymbolProps> = {}) =>
  render(
    <ButtonTextAndSymbol label="Lecture" symbol={<svg data-testid="symbole" />} {...overrides} />,
  );

describe("ButtonTextAndSymbol", () => {
  it("est un bouton nommé par son texte visible, le symbole étant décoratif", async () => {
    const screen = await renderButton();

    const button = screen.getByRole("button", { name: "Lecture" });

    await expect.element(button).toHaveTextContent("Lecture");
    await expect.element(button).toHaveAttribute("type", "button");
    await expect.element(screen.getByTestId("symbole")).toBeInTheDocument();
  });

  it("déclenche son action au clic", async () => {
    const onClick = vi.fn<() => void>();
    const screen = await renderButton({ onClick });

    await screen.getByRole("button").click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("désactivé, il ne déclenche plus son action", async () => {
    const onClick = vi.fn<() => void>();
    const screen = await renderButton({ onClick, disabled: true });

    const button = screen.getByRole("button");
    await button.click({ force: true });

    await expect.element(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each([
    ["regular", "44px", "20px", "20px"],
    ["large", "52px", "24px", "24px"],
  ] as const)(
    "taille %s : %s de haut, marges de %s, symbole de %s",
    async (size, height, padding, symbol) => {
      const screen = await renderButton({ size });

      await expect.element(screen.getByRole("button")).toHaveStyle({
        height,
        paddingLeft: padding,
        paddingRight: padding,
        borderRadius: "9999px",
        columnGap: "6px",
      });
      await expect.element(screen.getByTestId("symbole")).toHaveStyle({ width: symbol });
    },
  );

  it("taille regular par défaut, texte en Headline", async () => {
    const screen = await renderButton();

    await expect
      .element(screen.getByRole("button"))
      .toHaveStyle({ height: "44px", fontSize: "17px", fontWeight: "700", lineHeight: "22px" });
  });

  it("mis en avant : fond blanc et texte noir", async () => {
    const screen = await renderButton({ appearance: "prominent" });

    await expect
      .element(screen.getByRole("button"))
      .toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.96)", color: "rgb(0, 0, 0)" });
  });

  it("sans fond hors survol", async () => {
    const screen = await renderButton({ appearance: "plain" });

    await expect
      .element(screen.getByRole("button"))
      .toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0)" });
  });
});
