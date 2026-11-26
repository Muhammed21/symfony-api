import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, it } from "vitest";

import plugin from "../../index.ts";
import { layerDependencies } from "../layer-dependencies.ts";
import { moduleBoundaries } from "../module-boundaries.ts";
import { noDisableArchitecture } from "../no-disable-architecture.ts";
import { pureDomain } from "../pure-domain.ts";
import { uiInPresentation } from "../ui-in-presentation.ts";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();
const MODULES = "/repo/apps/web/src/modules";

describe("plugin prime", () => {
  it("expose ses cinq règles sous le nom prime", () => {
    expect(plugin.meta?.name).toBe("prime");
    expect(Object.keys(plugin.rules).toSorted()).toEqual([
      "layer-dependencies",
      "module-boundaries",
      "no-disable-architecture",
      "pure-domain",
      "ui-in-presentation",
    ]);
  });

  it.each([
    ["module-boundaries", moduleBoundaries],
    ["layer-dependencies", layerDependencies],
    ["no-disable-architecture", noDisableArchitecture],
    ["pure-domain", pureDomain],
    ["ui-in-presentation", uiInPresentation],
  ])("%s est un problème documenté qui cite l'ADR 0003", (_name, rule) => {
    expect(rule.meta?.type).toBe("problem");
    expect(rule.meta?.docs?.description).toContain("ADR 0003");
  });
});

tester.run("module-boundaries (message)", moduleBoundaries, {
  valid: [],
  invalid: [
    {
      filename: `${MODULES}/review/domain/x.ts`,
      code: 'import { a } from "../../catalogue/domain/movie.ts";',
      errors: [
        {
          message:
            "Le module review importe l'intérieur du module catalogue : passer par catalogue/contracts/ (ADR 0003).",
        },
      ],
    },
  ],
});

tester.run("layer-dependencies (message)", layerDependencies, {
  valid: [],
  invalid: [
    {
      filename: `${MODULES}/catalogue/domain/x.ts`,
      code: 'import { a } from "../application/y.ts";',
      errors: [
        {
          message:
            "La couche domain n'importe pas application : presentation et infrastructure → application → domain, presentation → contracts → domain (ADR 0003).",
        },
      ],
    },
  ],
});

tester.run("no-disable-architecture (message)", noDisableArchitecture, {
  valid: [],
  invalid: [
    {
      code: "// oxlint-disable-next-line prime/module-boundaries\nconst a = 1;",
      errors: [
        {
          message:
            "Une règle d'architecture ne se désactive pas par commentaire : changer la règle dans packages/lint (ADR 0003).",
        },
      ],
    },
  ],
});

tester.run("pure-domain (messages)", pureDomain, {
  valid: [],
  invalid: [
    {
      filename: `${MODULES}/catalogue/domain/movie.ts`,
      code: 'import { z } from "zod";',
      errors: [
        {
          message:
            "La couche domain n'importe pas le paquet zod : le domaine est pur, et contracts/ n'importe que zod (ADR 0003).",
        },
      ],
    },
    {
      filename: `${MODULES}/catalogue/domain/movie.ts`,
      code: 'import { a } from "../../../platform/http.ts";',
      errors: [
        {
          message:
            "La couche domain n'importe pas ../../../platform/http.ts, hors des modules : le domaine est pur, et contracts/ n'importe que zod (ADR 0003).",
        },
      ],
    },
  ],
});

tester.run("ui-in-presentation (message)", uiInPresentation, {
  valid: [],
  invalid: [
    {
      filename: `${MODULES}/catalogue/domain/x.ts`,
      code: 'import { useState } from "react";',
      errors: [
        {
          message:
            "react ne s'importe que dans la couche presentation d'un module ou dans main.tsx, la racine de composition (ADR 0003).",
        },
      ],
    },
  ],
});

tester.run("ui-in-presentation, JSX (message)", uiInPresentation, {
  valid: [],
  invalid: [
    {
      filename: `${MODULES}/catalogue/domain/x.tsx`,
      code: "export const a = <div />;",
      errors: [
        {
          message:
            "Le JSX ne s'écrit que dans la couche presentation d'un module ou dans main.tsx, la racine de composition (ADR 0003).",
        },
      ],
    },
  ],
});
