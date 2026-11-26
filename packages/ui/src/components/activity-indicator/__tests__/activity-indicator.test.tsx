import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { ActivityIndicator, type ActivityIndicatorProps } from "../activity-indicator.tsx";

const renderIndicator = (overrides: Partial<ActivityIndicatorProps> = {}) =>
  render(<ActivityIndicator {...overrides} />);

describe("ActivityIndicator", () => {
  it("annonce un chargement en cours, sans valeur", async () => {
    const screen = await renderIndicator();

    const indicator = screen.getByRole("progressbar", { name: "Chargement" });

    await expect.element(indicator).toBeInTheDocument();
    await expect.element(indicator).not.toHaveAttribute("aria-valuenow");
  });

  it("accepte un libellé précis", async () => {
    const screen = await renderIndicator({ label: "Chargement des films" });

    await expect
      .element(screen.getByRole("progressbar", { name: "Chargement des films" }))
      .toBeInTheDocument();
  });

  it.each([
    ["small", "20px"],
    ["medium", "28px"],
    ["large", "44px"],
  ] as const)("taille %s : %s", async (size, length) => {
    const screen = await renderIndicator({ size });

    await expect
      .element(screen.getByRole("progressbar"))
      .toHaveStyle({ width: length, height: length });
  });

  it("taille medium par défaut, en couleur secondaire", async () => {
    const screen = await renderIndicator();

    await expect
      .element(screen.getByRole("progressbar"))
      .toHaveStyle({ width: "28px", color: "rgba(255, 255, 255, 0.56)" });
  });

  it("dessine 8 branches réparties sur le cercle, de plus en plus opaques", async () => {
    const screen = await renderIndicator();

    const spokes = [...screen.getByRole("progressbar").element().querySelectorAll("line")];

    expect(spokes.map((spoke) => spoke.getAttribute("transform"))).toEqual(
      [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => `rotate(${angle} 12 12)`),
    );
    expect(spokes.map((spoke) => Number(spoke.getAttribute("opacity")))).toEqual([
      0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1,
    ]);
  });

  it("tourne par crans, une branche après l'autre", async () => {
    const screen = await renderIndicator();

    const indicator = screen.getByRole("progressbar").element();

    expect(indicator.querySelectorAll("line")).toHaveLength(8);
    expect(getComputedStyle(indicator)).toMatchObject({
      animationDuration: "1s",
      animationTimingFunction: "steps(8)",
      animationIterationCount: "infinite",
    });
  });
});
