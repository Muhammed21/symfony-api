import { readdir, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { themeStylesheet } from "../../theme/theme-stylesheet.ts";
import { tokens } from "../../tokens/index.ts";

const COMPONENTS = new URL("../", import.meta.url);

const THEME_VARIABLE = /--prime-[a-z0-9-]+/g;

const componentStylesheets = async (): Promise<readonly string[]> => {
  const files = await readdir(COMPONENTS, { recursive: true });
  return Promise.all(
    files
      .filter((file) => file.endsWith(".module.css"))
      .map((file) => readFile(new URL(file, COMPONENTS), "utf8")),
  );
};

describe("variables du thème utilisées par les composants", () => {
  it("existent toutes dans le thème", async () => {
    const declared = new Set(themeStylesheet(tokens).match(THEME_VARIABLE));
    const stylesheets = await componentStylesheets();

    const used = stylesheets.flatMap((css) => css.match(THEME_VARIABLE) ?? []);

    expect(stylesheets.length).toBeGreaterThan(0);
    expect(used.filter((name) => !declared.has(name))).toEqual([]);
  });
});
