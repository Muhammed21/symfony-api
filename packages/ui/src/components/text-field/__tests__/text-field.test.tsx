import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { TextField, type TextFieldProps } from "../text-field.tsx";

const frameOf = (screen: Awaited<ReturnType<typeof render>>) => {
  const frame = screen.container.firstElementChild;
  if (!(frame instanceof HTMLElement)) {
    throw new Error("Le champ n'a pas de cadre");
  }
  return frame;
};

const renderTextField = (overrides: Partial<TextFieldProps> = {}) =>
  render(<TextField label="Année" value="" onChange={() => undefined} {...overrides} />);

describe("TextField", () => {
  it("est un champ de texte nommé par son libellé, avec son texte d'aide", async () => {
    const screen = await renderTextField({ placeholder: "1994" });

    await expect
      .element(screen.getByRole("textbox", { name: "Année" }))
      .toHaveAttribute("placeholder", "1994");
  });

  it("affiche sa valeur", async () => {
    const screen = await renderTextField({ value: "1972" });

    await expect.element(screen.getByRole("textbox")).toHaveValue("1972");
  });

  it("transmet chaque saisie", async () => {
    const onChange = vi.fn<(value: string) => void>();
    const screen = await renderTextField({ onChange });

    await screen.getByRole("textbox").fill("1972");

    expect(onChange).toHaveBeenLastCalledWith("1972");
  });

  it("en variante recherche, est un champ de recherche", async () => {
    const screen = await renderTextField({ type: "search", label: "Rechercher un titre" });

    await expect
      .element(screen.getByRole("searchbox", { name: "Rechercher un titre" }))
      .toBeInTheDocument();
  });

  it("peut annoncer un clavier numérique et limiter la longueur", async () => {
    const screen = await renderTextField({ inputMode: "numeric", maxLength: 4 });

    const field = screen.getByRole("textbox");

    await expect.element(field).toHaveAttribute("inputmode", "numeric");
    await expect.element(field).toHaveAttribute("maxlength", "4");
  });

  it("en creux, en pilule de 44px, texte en Body", async () => {
    const screen = await renderTextField();

    await expect.element(frameOf(screen)).toHaveStyle({
      height: "44px",
      borderRadius: "9999px",
      paddingLeft: "20px",
      backgroundColor: "rgba(0, 0, 0, 0.2)",
    });
    await expect
      .element(screen.getByRole("textbox"))
      .toHaveStyle({ fontSize: "17px", color: "rgba(255, 255, 255, 0.96)" });
  });

  it("avec un symbole décoratif, le place avant le texte avec une marge réduite", async () => {
    const screen = await renderTextField({ symbol: <svg data-testid="loupe" /> });

    await expect.element(frameOf(screen)).toHaveStyle({ paddingLeft: "12px" });
    await expect.element(screen.getByTestId("loupe")).toHaveStyle({ width: "20px" });
    expect(screen.getByTestId("loupe").element().closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("sans symbole, le cadre ne contient que le champ", async () => {
    const screen = await renderTextField();

    expect(frameOf(screen).children).toHaveLength(1);
  });

  it("entoure le champ quand il a le focus", async () => {
    const screen = await renderTextField();

    await screen.getByRole("textbox").click();

    await expect
      .element(frameOf(screen))
      .toHaveStyle({ outlineStyle: "solid", outlineColor: "rgba(255, 255, 255, 0.96)" });
  });
});
