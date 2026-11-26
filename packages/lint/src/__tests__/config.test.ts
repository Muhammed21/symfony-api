import { execFile } from "node:child_process";
import { globSync, readFileSync } from "node:fs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const ROOT = new URL("../../../../", import.meta.url).pathname;
const OXLINT = join(ROOT, "node_modules/.bin/oxlint");

type Override = { files: string[]; rules: Record<string, unknown> };
type OxlintConfig = {
  jsPlugins?: string[];
  rules: Record<string, unknown>;
  overrides: Override[];
};

const readConfig = (): OxlintConfig =>
  JSON.parse(readFileSync(join(ROOT, ".oxlintrc.json"), "utf8"));

const matches = (pattern: string) =>
  globSync(pattern, { cwd: ROOT, exclude: (path) => path.includes("node_modules") });

describe("le linter est linté (ADR 0003)", () => {
  it.each(readConfig().overrides.flatMap(({ files }) => files))(
    "le motif %s correspond à au moins un fichier",
    (pattern) => {
      expect(matches(pattern).length).toBeGreaterThan(0);
    },
  );

  it.each(readConfig().jsPlugins ?? [])("le plugin %s existe", (plugin) => {
    expect(matches(plugin)).toHaveLength(1);
  });

  it.each([
    "module-boundaries",
    "layer-dependencies",
    "no-disable-architecture",
    "pure-domain",
    "ui-in-presentation",
  ])("la règle prime/%s est active en erreur", (rule) => {
    expect(readConfig().rules[`prime/${rule}`]).toBe("error");
  });
});

const lintTree = async (files: Record<string, string>) => {
  const directory = await mkdtemp(join(tmpdir(), "architecture-"));
  const config = readConfig();
  await writeFile(
    join(directory, ".oxlintrc.json"),
    JSON.stringify({
      ...config,
      $schema: undefined,
      jsPlugins: (config.jsPlugins ?? []).map((plugin) => join(ROOT, plugin)),
    }),
  );
  await Promise.all(
    Object.entries(files).map(async ([path, code]) => {
      await mkdir(dirname(join(directory, path)), { recursive: true });
      await writeFile(join(directory, path), code);
    }),
  );
  return promisify(execFile)(OXLINT, ["-c", join(directory, ".oxlintrc.json"), directory]).then(
    ({ stdout }) => ({ code: 0, output: stdout }),
    (error: { code?: number; stdout?: string }) => ({
      code: error.code,
      output: error.stdout ?? "",
    }),
  );
};

const CATALOGUE = "apps/web/src/modules/catalogue";

describe("règles d'architecture, avec la vraie configuration", () => {
  it.each([
    [
      "un module qui importe l'intérieur d'un autre",
      "apps/web/src/modules/review/application/bad.ts",
      'import { a } from "../../catalogue/application/catalogue.ts";\nexport const b = a;\n',
      "prime(module-boundaries)",
    ],
    [
      "un domaine qui importe l'infrastructure de son module",
      `${CATALOGUE}/domain/bad.ts`,
      'import { a } from "../infrastructure/http-catalogue-gateway.ts";\nexport const b = a;\n',
      "prime(layer-dependencies)",
    ],
    [
      "un domaine qui importe un paquet",
      `${CATALOGUE}/domain/bad.ts`,
      'import { z } from "zod";\nexport const a = z;\n',
      "prime(pure-domain)",
    ],
    [
      "un domaine qui sort des modules",
      `${CATALOGUE}/domain/bad.ts`,
      'import { a } from "../../../platform/http.ts";\nexport const b = a;\n',
      "prime(pure-domain)",
    ],
    [
      "une application qui importe React",
      `${CATALOGUE}/application/bad.ts`,
      'import { useState } from "react";\nexport const a = useState;\n',
      "prime(ui-in-presentation)",
    ],
    [
      "un commentaire de désactivation",
      `${CATALOGUE}/domain/bad.ts`,
      "// oxlint-disable-next-line prime/layer-dependencies\nexport const a = 1;\n",
      "prime(no-disable-architecture)",
    ],
  ])("refuse %s", async (_name, path, code, rule) => {
    const { code: exitCode, output } = await lintTree({ [path]: code });

    expect(exitCode).toBe(1);
    expect(output).toContain(rule);
  });

  it("accepte un module conforme, et un import du contracts d'un autre module", async () => {
    const { code, output } = await lintTree({
      [`${CATALOGUE}/domain/movie.ts`]: "export const a = 1;\n",
      [`${CATALOGUE}/contracts/movie-id.ts`]:
        'import { z } from "zod";\nimport { a } from "../domain/movie.ts";\nexport const b = [z, a];\n',
      [`${CATALOGUE}/application/catalogue.ts`]:
        'import { a } from "../domain/movie.ts";\nexport const b = a;\n',
      [`${CATALOGUE}/presentation/movies-route.tsx`]:
        'import { useQuery } from "@tanstack/react-query";\nimport { b } from "../application/catalogue.ts";\nexport const c = [useQuery, b];\n',
      ["apps/web/src/modules/review/application/reviews.ts"]:
        'import { b } from "../../catalogue/contracts/movie-id.ts";\nexport const c = b;\n',
    });

    expect(output).not.toMatch(/prime\(/);
    expect(code).toBe(0);
  });
});
