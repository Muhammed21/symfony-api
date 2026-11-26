import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { TextField, type TextFieldProps } from "../text-field.tsx";

const frameOf = (screen: Awaited<ReturnType<typeof render>>) => {
  const frame = screen.container.querySelector("input")?.parentElement;
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

  it("en variante e-mail, est un champ de texte d'e-mail, avec l'autocomplétion voulue", async () => {
    const screen = await renderTextField({ type: "email", label: "E-mail", autoComplete: "email" });

    const field = screen.getByRole("textbox", { name: "E-mail" });

    await expect.element(field).toHaveAttribute("type", "email");
    await expect.element(field).toHaveAttribute("autocomplete", "email");
  });

  it("en variante mot de passe, masque la saisie", async () => {
    const screen = await renderTextField({ type: "password", label: "Mot de passe" });

    await expect.element(screen.getByLabelText("Mot de passe")).toHaveAttribute("type", "password");
  });

  it("peut afficher son libellé au-dessus du champ, en Callout secondaire", async () => {
    const screen = await renderTextField({ label: "E-mail", labelVisible: true });

    const label = screen.getByText("E-mail");

    await expect.element(label).toBeVisible();
    await expect.element(label).toHaveStyle({
      fontSize: "15px",
      color: "rgba(255, 255, 255, 0.56)",
    });
    await expect.element(screen.getByRole("textbox", { name: "E-mail" })).toBeVisible();
    expect(label.element().getBoundingClientRect().bottom).toBeLessThanOrEqual(
      frameOf(screen).getBoundingClientRect().top,
    );
  });

  it("sans libellé visible, aide ni erreur : le cadre seul, sans description", async () => {
    const screen = await renderTextField();
    const field = screen.getByRole("textbox", { name: "Année" });

    await expect.element(field).not.toHaveAttribute("aria-describedby");
    await expect.element(field).not.toHaveAttribute("aria-invalid");
    expect(screen.container.querySelectorAll("label, p")).toHaveLength(0);
    await expect
      .element(frameOf(screen))
      .not.toHaveStyle({ boxShadow: "rgb(255, 69, 58) 0px 0px 0px 1px inset" });
  });

  it("avec une erreur seule, n'est décrit que par elle", async () => {
    const screen = await renderTextField({ error: "Saisissez une année." });
    const field = screen.getByRole("textbox", { name: "Année" });
    const describedBy = field.element().getAttribute("aria-describedby") ?? "";

    expect(describedBy.split(" ")).toHaveLength(1);
    expect(document.getElementById(describedBy)?.textContent).toBe("Saisissez une année.");
  });

  it("décrit le champ par son aide", async () => {
    const screen = await renderTextField({ label: "Mot de passe", hint: "8 caractères minimum" });

    await expect.element(screen.getByText("8 caractères minimum")).toBeVisible();
    await expect
      .element(screen.getByRole("textbox", { name: "Mot de passe" }))
      .toHaveAccessibleDescription("8 caractères minimum");
    await expect.element(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
  });

  it("signale une erreur, en rouge, et la lie au champ", async () => {
    const screen = await renderTextField({
      label: "Mot de passe",
      hint: "8 caractères minimum",
      error: "Saisissez votre mot de passe.",
    });

    const field = screen.getByRole("textbox", { name: "Mot de passe" });

    await expect.element(field).toHaveAttribute("aria-invalid", "true");
    await expect
      .element(field)
      .toHaveAccessibleDescription("Saisissez votre mot de passe. 8 caractères minimum");
    await expect
      .element(screen.getByText("Saisissez votre mot de passe."))
      .toHaveStyle({ color: "rgb(255, 69, 58)" });
    await expect
      .element(frameOf(screen))
      .toHaveStyle({ boxShadow: "rgb(255, 69, 58) 0px 0px 0px 1px inset" });
  });

  it("place un accessoire en fin de champ", async () => {
    const screen = await renderTextField({ accessory: <button type="button">Afficher</button> });

    const frame = frameOf(screen);

    expect(frame.lastElementChild?.textContent).toBe("Afficher");
    await expect.element(screen.getByRole("button", { name: "Afficher" })).toBeVisible();
  });
});
