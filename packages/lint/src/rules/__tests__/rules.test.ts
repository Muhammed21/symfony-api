import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";

import { layerDependencies } from "../layer-dependencies.ts";
import { moduleBoundaries } from "../module-boundaries.ts";
import { noDisableArchitecture } from "../no-disable-architecture.ts";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

const MODULES = "/repo/apps/web/src/modules";

const inModule = (module: string, path: string) => `${MODULES}/${module}/${path}`;

tester.run("module-boundaries", moduleBoundaries, {
  valid: [
    {
      name: "import interne au module",
      filename: inModule("catalogue", "application/catalogue.ts"),
      code: 'import { Movie } from "../domain/movie.ts";',
    },
    {
      name: "import du dossier contracts d'un autre module",
      filename: inModule("review", "presentation/reviews.tsx"),
      code: 'import type { MovieId } from "../../catalogue/contracts/movie-id.ts";',
    },
    {
      name: "import d'un paquet",
      filename: inModule("catalogue", "infrastructure/http-catalogue-gateway.ts"),
      code: 'import { z } from "zod";',
    },
    {
      name: "export sans source",
      filename: inModule("catalogue", "domain/movie.ts"),
      code: "export const channel = 1;",
    },
    {
      name: "import dynamique non littéral",
      filename: inModule("catalogue", "infrastructure/loader.ts"),
      code: "const load = (path) => import(path);",
    },
    {
      name: "import dynamique d'un littéral qui n'est pas une chaîne",
      filename: inModule("catalogue", "infrastructure/loader.ts"),
      code: "const load = () => import(42);",
    },
    {
      name: "fichier hors des modules",
      filename: "/repo/apps/web/src/main.tsx",
      code: 'import { createCatalogue } from "./modules/catalogue/catalogue-module.ts";',
    },
  ],
  invalid: [
    {
      name: "import du domaine d'un autre module",
      filename: inModule("review", "application/reviews.ts"),
      code: 'import { Movie } from "../../catalogue/domain/movie.ts";',
      errors: [{ messageId: "crossModule", data: { from: "review", to: "catalogue" } }],
    },
    {
      name: "import de la racine d'un autre module",
      filename: inModule("review", "presentation/reviews.tsx"),
      code: 'import { createCatalogue } from "../../catalogue/catalogue-module.ts";',
      errors: [{ messageId: "crossModule", data: { from: "review", to: "catalogue" } }],
    },
    {
      name: "réexport depuis un autre module",
      filename: inModule("review", "domain/index.ts"),
      code: 'export * from "../../catalogue/domain/movie.ts";',
      errors: [{ messageId: "crossModule" }],
    },
    {
      name: "réexport nommé depuis un autre module",
      filename: inModule("review", "domain/index.ts"),
      code: 'export { Movie } from "../../catalogue/domain/movie.ts";',
      errors: [{ messageId: "crossModule" }],
    },
    {
      name: "import dynamique d'un autre module",
      filename: inModule("review", "infrastructure/loader.ts"),
      code: 'const load = () => import("../../catalogue/catalogue-module.ts");',
      errors: [{ messageId: "crossModule" }],
    },
  ],
});

tester.run("layer-dependencies", layerDependencies, {
  valid: [
    ...[
      ["domain", "domain"],
      ["application", "domain"],
      ["application", "application"],
      ["infrastructure", "application"],
      ["infrastructure", "domain"],
      ["infrastructure", "infrastructure"],
      ["presentation", "application"],
      ["presentation", "domain"],
      ["presentation", "presentation"],
      ["presentation", "contracts"],
      ["contracts", "domain"],
      ["contracts", "contracts"],
    ].map(([from, to]) => ({
      name: `${from} importe ${to}`,
      filename: inModule("catalogue", `${from}/file.ts`),
      code: `import { x } from "../${to}/other.ts";`,
    })),
    {
      name: "import vers un autre module, laissé à module-boundaries",
      filename: inModule("catalogue", "domain/file.ts"),
      code: 'import { x } from "../../review/application/other.ts";',
    },
    {
      name: "dossier du module qui n'est pas une couche",
      filename: inModule("catalogue", "testing/factories.ts"),
      code: 'import { x } from "../infrastructure/other.ts";',
    },
    {
      name: "la racine du module importe toutes les couches",
      filename: inModule("catalogue", "catalogue-module.ts"),
      code: 'import { createHttpCatalogueGateway } from "./infrastructure/http-catalogue-gateway.ts";',
    },
    {
      name: "import d'un paquet depuis le domaine",
      filename: inModule("catalogue", "domain/movie.ts"),
      code: 'import { z } from "zod";',
    },
    {
      name: "fichier hors des modules",
      filename: "/repo/apps/web/src/platform/http.ts",
      code: 'import { x } from "../modules/catalogue/infrastructure/x.ts";',
    },
  ],
  invalid: [
    ...[
      ["domain", "application"],
      ["domain", "infrastructure"],
      ["domain", "presentation"],
      ["domain", "contracts"],
      ["application", "infrastructure"],
      ["application", "presentation"],
      ["infrastructure", "presentation"],
      ["infrastructure", "contracts"],
      ["presentation", "infrastructure"],
      ["contracts", "application"],
    ].map(([from, to]) => ({
      name: `${from} n'importe pas ${to}`,
      filename: inModule("catalogue", `${from}/file.ts`),
      code: `import { x } from "../${to}/other.ts";`,
      errors: [{ messageId: "forbiddenLayer", data: { from, to } }],
    })),
    {
      name: "le domaine n'importe pas la racine du module",
      filename: inModule("catalogue", "domain/movie.ts"),
      code: 'import { createCatalogue } from "../catalogue-module.ts";',
      errors: [{ messageId: "forbiddenLayer", data: { from: "domain", to: "racine du module" } }],
    },
  ],
});

const ARCHITECTURE_DISABLES = [
  "// oxlint-disable",
  "/*eslint-disable*/",
  "// oxlint-disable-next-line prime/module-boundaries",
  "// eslint-disable-line prime/layer-dependencies",
  "/* oxlint-disable prime/module-boundaries */",
  "/* eslint-disable */",
  "// oxlint-disable-next-line no-console, prime/layer-dependencies",
];

tester.run("no-disable-architecture", noDisableArchitecture, {
  valid: [
    {
      name: "désactivation d'une règle ordinaire",
      code: "// oxlint-disable-next-line no-console\nconsole.log(1);",
    },
    {
      name: "directive citée au milieu d'un commentaire",
      code: "// voir oxlint-disable prime/module-boundaries plus haut\nconst a = 1;",
    },
    {
      name: "mot qui commence comme une directive",
      code: "// eslint-disabled par défaut\nconst a = 1;",
    },
    {
      name: "désactivation d'une règle au nom proche",
      code: "// oxlint-disable-next-line no-restricted-imports-extra, prime-like/rule\nconst a = 1;",
    },
    {
      name: "commentaire ordinaire",
      code: "// la règle prime/module-boundaries protège ceci\nconst a = 1;",
    },
  ],
  invalid: ARCHITECTURE_DISABLES.map((comment) => ({
    name: comment,
    code: `${comment}\nconst a = 1;`,
    errors: [{ messageId: "disabled" }],
  })),
});
