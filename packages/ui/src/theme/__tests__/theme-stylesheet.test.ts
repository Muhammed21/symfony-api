import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { type DesignTokens, tokens } from "../../tokens/index.ts";
import { themeStylesheet } from "../theme-stylesheet.ts";

const aDesignTokens = (overrides: Partial<DesignTokens> = {}): DesignTokens => ({
  color: {},
  fontFamily: ["Sans"],
  text: {},
  space: {},
  radius: {},
  size: {},
  scale: {},
  duration: {},
  shadow: {},
  blur: {},
  ...overrides,
});

const declarationsOf = (stylesheet: string): readonly string[] =>
  stylesheet
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("--prime-"));

const declarationsFor = (overrides: Partial<DesignTokens>): readonly string[] =>
  declarationsOf(themeStylesheet(aDesignTokens(overrides)));

describe("feuille de thème", () => {
  it("déclare les variables sur :root, en thème sombre", () => {
    expect(themeStylesheet(aDesignTokens({ space: { s: 8 } }))).toBe(
      ":root {\n  color-scheme: dark;\n  --prime-font-family: Sans;\n  --prime-space-s: 8px;\n}\n",
    );
  });

  it("nomme les couleurs par groupe, en kebab-case", () => {
    expect(
      declarationsFor({
        color: {
          system: { red: "#ff453a" },
          text: { primary: "rgba(255, 255, 255, 0.96)", onProminent: "#000000" },
        },
      }),
    ).toEqual([
      "--prime-color-system-red: #ff453a;",
      "--prime-color-text-primary: rgba(255, 255, 255, 0.96);",
      "--prime-color-text-on-prominent: #000000;",
      "--prime-font-family: Sans;",
    ]);
  });

  it("met entre guillemets les familles de police qui contiennent une espace", () => {
    expect(
      declarationsFor({ fontFamily: ["SF Pro", "-apple-system", "system-ui", "sans-serif"] }),
    ).toEqual(['--prime-font-family: "SF Pro", -apple-system, system-ui, sans-serif;']);
  });

  it("écrit chaque style de texte en raccourci font, sur la famille du thème", () => {
    expect(
      declarationsFor({
        text: {
          xlTitle1: { weight: 700, size: 48, lineHeight: 56 },
          subheadline: { weight: 400, size: 15, lineHeight: 20 },
        },
      }),
    ).toEqual([
      "--prime-font-family: Sans;",
      "--prime-text-xl-title1: 700 48px/56px var(--prime-font-family);",
      "--prime-text-subheadline: 400 15px/20px var(--prime-font-family);",
    ]);
  });

  it("exprime espacements, rayons, tailles et flous en pixels", () => {
    expect(
      declarationsFor({
        space: { "3xl": 40 },
        radius: { pill: 9999 },
        size: { control: { extraLarge: 64 } },
        blur: { glass: 50 },
      }),
    ).toEqual([
      "--prime-font-family: Sans;",
      "--prime-space-3xl: 40px;",
      "--prime-radius-pill: 9999px;",
      "--prime-size-control-extra-large: 64px;",
      "--prime-blur-glass: 50px;",
    ]);
  });

  it("laisse les échelles sans unité et exprime les durées en millisecondes", () => {
    expect(declarationsFor({ scale: { thumbHover: 1.18 }, duration: { fast: 150 } })).toEqual([
      "--prime-font-family: Sans;",
      "--prime-scale-thumb-hover: 1.18;",
      "--prime-duration-fast: 150ms;",
    ]);
  });

  it("écrit les ombres en liste, internes comprises", () => {
    expect(
      declarationsFor({
        shadow: {
          floating: [
            { x: 0, y: 16, blur: 52, spread: 0, color: "rgba(0, 0, 0, 0.6)", inset: false },
          ],
          recessed: [
            { x: 0, y: 1.5, blur: 4, spread: 0, color: "rgba(0, 0, 0, 0.1)", inset: true },
            { x: 0, y: -0.5, blur: 1, spread: 0, color: "rgba(255, 255, 255, 0.3)", inset: true },
          ],
        },
      }),
    ).toEqual([
      "--prime-font-family: Sans;",
      "--prime-shadow-floating: 0px 16px 52px 0px rgba(0, 0, 0, 0.6);",
      "--prime-shadow-recessed: inset 0px 1.5px 4px 0px rgba(0, 0, 0, 0.1), inset 0px -0.5px 1px 0px rgba(255, 255, 255, 0.3);",
    ]);
  });

  it("theme.css correspond aux jetons du design system (pnpm generate:theme)", async () => {
    const generated = await readFile(new URL("../theme.css", import.meta.url), "utf8");

    expect(generated).toBe(themeStylesheet(tokens));
  });
});
