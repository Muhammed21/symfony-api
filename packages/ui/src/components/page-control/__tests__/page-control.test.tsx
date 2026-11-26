import { describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-react";

import { PageControl, type PageControlProps } from "../page-control.tsx";

const renderPageControl = (overrides: Partial<PageControlProps> = {}) =>
  render(
    <PageControl
      label="Pagination"
      count={4}
      current={2}
      onSelect={() => undefined}
      {...overrides}
    />,
  );

describe("PageControl", () => {
  it("est une navigation nommée, avec un point par page", async () => {
    const screen = await renderPageControl();

    const navigation = screen.getByRole("navigation", { name: "Pagination" });

    await expect.element(navigation).toBeInTheDocument();
    expect(
      navigation
        .getByRole("button")
        .elements()
        .map((dot) => dot.ariaLabel),
    ).toEqual(["Page 1", "Page 2", "Page 3", "Page 4"]);
  });

  it("signale la page courante, et elle seule", async () => {
    const screen = await renderPageControl({ current: 3 });

    await expect
      .element(screen.getByRole("button", { name: "Page 3" }))
      .toHaveAttribute("aria-current", "page");
    await expect
      .element(screen.getByRole("button", { name: "Page 2" }))
      .not.toHaveAttribute("aria-current");
  });

  it("choisit la page dont on clique le point", async () => {
    const onSelect = vi.fn<(page: number) => void>();
    const screen = await renderPageControl({ onSelect });

    await screen.getByRole("button", { name: "Page 4" }).click();

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(4);
  });

  it("points de 8px, la page courante en blanc, les autres estompées", async () => {
    const screen = await renderPageControl({ current: 1 });

    const dotOf = (page: number) =>
      getComputedStyle(screen.getByRole("button", { name: `Page ${page}` }).element(), "::before");

    expect(dotOf(1)).toMatchObject({
      width: "8px",
      height: "8px",
      backgroundColor: "rgba(255, 255, 255, 0.96)",
    });
    expect(dotOf(2).backgroundColor).toBe("rgba(255, 255, 255, 0.32)");
  });

  it("tient sur 28px de haut", async () => {
    const screen = await renderPageControl();

    await expect.element(screen.getByRole("button", { name: "Page 1" })).toHaveStyle({
      height: "28px",
    });
  });
});
