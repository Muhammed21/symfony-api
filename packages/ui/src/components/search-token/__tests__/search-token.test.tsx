import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";
import { userEvent } from "vitest/browser";

import { SearchToken, type SearchTokenProps } from "../search-token.tsx";

const renderSearchToken = (overrides: Partial<SearchTokenProps> = {}) =>
  render(<SearchToken label="Drame" selected={false} onClick={() => undefined} {...overrides} />);

describe("SearchToken", () => {
  it("est un bouton à bascule nommé par son libellé, non pressé", async () => {
    const screen = await renderSearchToken();

    await expect
      .element(screen.getByRole("button", { name: "Drame" }))
      .toHaveAttribute("aria-pressed", "false");
  });

  it("sélectionné, il est pressé, en blanc avec un texte noir", async () => {
    const screen = await renderSearchToken({ selected: true });

    const token = screen.getByRole("button", { name: "Drame" });

    await expect.element(token).toHaveAttribute("aria-pressed", "true");
    await expect
      .element(token)
      .toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.96)", color: "rgb(0, 0, 0)" });
  });

  it("déclenche son action au clic", async () => {
    const onClick = vi.fn<() => void>();
    const screen = await renderSearchToken({ onClick });

    await screen.getByRole("button").click();

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("non sélectionné, sans fond hors survol", async () => {
    const screen = await renderSearchToken();
    const token = screen.getByRole("button");

    await expect.element(token).toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0)" });
    await userEvent.hover(token);
    await expect.element(token).toHaveStyle({ backgroundColor: "rgba(255, 255, 255, 0.18)" });
  });

  it("pilule de 32px, texte en Callout", async () => {
    const screen = await renderSearchToken();

    await expect.element(screen.getByRole("button")).toHaveStyle({
      height: "32px",
      paddingLeft: "12px",
      paddingRight: "12px",
      borderRadius: "9999px",
      fontSize: "15px",
      lineHeight: "20px",
    });
  });
});
