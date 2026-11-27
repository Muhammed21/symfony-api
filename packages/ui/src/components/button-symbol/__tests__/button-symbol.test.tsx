import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import { ButtonSymbol, type ButtonSymbolProps } from "../button-symbol.tsx";

const renderButtonSymbol = (overrides: Partial<ButtonSymbolProps> = {}) =>
  render(<ButtonSymbol label="Lecture" symbol={<svg data-testid="symbole" />} {...overrides} />);

describe("ButtonSymbol", () => {
  it("est un bouton nommé par son libellé, le symbole étant décoratif", async () => {
    const screen = await renderButtonSymbol();

    const button = screen.getByRole("button", { name: "Lecture" });

    await expect.element(button).toHaveAttribute("type", "button");
    await expect.element(screen.getByTestId("symbole")).toBeInTheDocument();
    await expect.element(button).toHaveAccessibleName("Lecture");
  });

  it("déclenche son action au clic", async () => {
    const onClick = vi.fn<() => void>();
    const screen = await renderButtonSymbol({ onClick });

    await screen.getByRole("button").click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("désactivé, il ne déclenche plus son action", async () => {
    const onClick = vi.fn<() => void>();
    const screen = await renderButtonSymbol({ onClick, disabled: true });

    const button = screen.getByRole("button");
    await button.click({ force: true });

    await expect.element(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it.each([
    ["mini", "28px"],
    ["small", "32px"],
    ["medium", "40px"],
    ["regular", "44px"],
    ["large", "52px"],
    ["extra-large", "64px"],
  ] as const)("taille %s : un rond de %s", async (size, length) => {
    const screen = await renderButtonSymbol({ size });

    await expect
      .element(screen.getByRole("button"))
      .toHaveStyle({ width: length, height: length, borderRadius: "9999px" });
  });

  it("taille regular par défaut", async () => {
    const screen = await renderButtonSymbol();

    await expect.element(screen.getByRole("button")).toHaveStyle({ width: "44px" });
  });

  it("taille du symbole selon celle du bouton", async () => {
    const screen = await renderButtonSymbol({ size: "large" });

    await expect
      .element(screen.getByTestId("symbole"))
      .toHaveStyle({ width: "24px", height: "24px" });
  });

  it("taille medium : un symbole de 16 px, comme les onglets de la petite barre", async () => {
    const screen = await renderButtonSymbol({ size: "medium" });

    await expect
      .element(screen.getByTestId("symbole"))
      .toHaveStyle({ width: "16px", height: "16px" });
  });

  it("sur fond de verre par défaut, plus clair au survol", async () => {
    const screen = await renderButtonSymbol();
    const button = screen.getByRole("button");

    await expect.element(button).toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.12)" });
    await userEvent.hover(button);
    await expect.element(button).toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.18)" });
  });

  it("sans fond, il ne montre son fond qu'au survol", async () => {
    const screen = await renderButtonSymbol({ appearance: "plain" });
    const button = screen.getByRole("button");
    await userEvent.unhover(button);

    await expect.element(button).toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0)" });
    await userEvent.hover(button);
    await expect.element(button).toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.18)" });
  });

  it("en verre liquide : verre clair et saturé, reflet sur le bord haut, plus clair au survol", async () => {
    const screen = await renderButtonSymbol({ appearance: "glass" });
    const button = screen.getByRole("button");
    await userEvent.unhover(button);

    await expect.element(button).toHaveStyle({
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      backdropFilter: "blur(16px) saturate(1.8)",
    });
    expect(getComputedStyle(button.element()).boxShadow).toContain(
      "rgba(255, 255, 255, 0.4) 0px 1px 0px 0px inset",
    );
    await userEvent.hover(button);
    await expect.element(button).toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.18)" });
  });

  it("mis en avant : fond blanc et symbole noir", async () => {
    const screen = await renderButtonSymbol({ appearance: "prominent" });
    await userEvent.unhover(screen.getByRole("button"));

    await expect
      .element(screen.getByRole("button"))
      .toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.96)", color: "rgb(0, 0, 0)" });
  });

  it("désactivé : fond et symbole estompés", async () => {
    const screen = await renderButtonSymbol({ disabled: true });

    await expect.element(screen.getByRole("button")).toHaveStyle({
      backgroundColor: "rgba(255, 255, 255, 0.06)",
      color: "rgba(255, 255, 255, 0.32)",
    });
  });
});
