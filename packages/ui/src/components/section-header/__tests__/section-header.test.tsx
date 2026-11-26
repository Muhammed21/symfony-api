import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import { SectionHeader, type SectionHeaderProps } from "../section-header.tsx";

const renderSectionHeader = (overrides: Partial<SectionHeaderProps> = {}) =>
  render(<SectionHeader title="Ma liste" {...overrides} />);

describe("SectionHeader", () => {
  it("titre la section par un titre de niveau 2", async () => {
    const screen = await renderSectionHeader();

    await expect
      .element(screen.getByRole("heading", { level: 2, name: "Ma liste" }))
      .toBeInTheDocument();
  });

  it("accepte un autre niveau de titre", async () => {
    const screen = await renderSectionHeader({ level: 3 });

    await expect
      .element(screen.getByRole("heading", { level: 3, name: "Ma liste" }))
      .toBeInTheDocument();
  });

  it("affiche le titre en Title3, en couleur primaire", async () => {
    const screen = await renderSectionHeader();

    await expect.element(screen.getByRole("heading")).toHaveStyle({
      fontSize: "19px",
      fontWeight: "700",
      lineHeight: "24px",
      color: "rgba(255, 255, 255, 0.96)",
      marginTop: "0px",
      marginBottom: "0px",
    });
  });

  it("place l'accessoire après le titre, à 16px", async () => {
    const screen = await renderSectionHeader({
      accessory: <button type="button">Tout voir</button>,
    });

    const heading = screen.getByRole("heading").element();
    const accessory = screen.getByRole("button", { name: "Tout voir" }).element();

    expect(accessory.getBoundingClientRect().left - heading.getBoundingClientRect().right).toBe(16);
  });
});
