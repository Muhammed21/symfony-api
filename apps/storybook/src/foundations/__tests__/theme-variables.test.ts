import { describe, expect, it } from "vitest";

import { themeVariables } from "../theme-variables.ts";

const STYLESHEET = `:root {
  color-scheme: dark;
  --prime-color-system-red: #ff453a;
  --prime-color-text-primary: rgba(255, 255, 255, 0.96);
  --prime-space-s: 8px;
}
`;

describe("variables du thème", () => {
  it("liste les variables d'un groupe, dans l'ordre de la feuille", () => {
    expect(themeVariables(STYLESHEET, "color")).toEqual([
      { name: "--prime-color-system-red", value: "#ff453a" },
      { name: "--prime-color-text-primary", value: "rgba(255, 255, 255, 0.96)" },
    ]);
  });

  it("ne prend que le groupe demandé", () => {
    expect(themeVariables(STYLESHEET, "space")).toEqual([
      { name: "--prime-space-s", value: "8px" },
    ]);
  });

  it("ne confond pas un groupe avec le début d'un autre nom", () => {
    expect(themeVariables(STYLESHEET, "spa")).toEqual([]);
  });

  it("lit la vraie feuille de thème de @prime/ui", async () => {
    const { default: stylesheet } = await import("@prime/ui/theme.css?raw");

    expect(themeVariables(stylesheet, "text")).toContainEqual({
      name: "--prime-text-title3",
      value: "700 19px/24px var(--prime-font-family)",
    });
  });
});
