import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";

import { pureDomain } from "../pure-domain.ts";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

const MODULES = "/repo/apps/web/src/modules";

const inModule = (module: string, path: string) => `${MODULES}/${module}/${path}`;

tester.run("pure-domain", pureDomain, {
  valid: [
    {
      name: "le domaine importe son propre domaine",
      filename: inModule("catalogue", "domain/movie.ts"),
      code: 'import { AgeRating } from "./age-rating.ts";',
    },
    {
      name: "le contrat importe zod",
      filename: inModule("catalogue", "contracts/movie-id.ts"),
      code: 'import { z } from "zod";',
    },
    {
      name: "le contrat importe un sous-chemin de zod",
      filename: inModule("catalogue", "contracts/movie-id.ts"),
      code: 'import { z } from "zod/v4";',
    },
    {
      name: "le contrat importe le domaine de son module",
      filename: inModule("catalogue", "contracts/movie-id.ts"),
      code: 'import type { Movie } from "../domain/movie.ts";',
    },
    {
      name: "l'application importe @prime/result",
      filename: inModule("catalogue", "application/catalogue.ts"),
      code: 'import type { Result } from "@prime/result";',
    },
    {
      name: "l'infrastructure importe un paquet",
      filename: inModule("catalogue", "infrastructure/http-catalogue-gateway.ts"),
      code: 'import { z } from "zod";',
    },
    {
      name: "la présentation importe TanStack",
      filename: inModule("catalogue", "presentation/movies-route.tsx"),
      code: 'import { useQuery } from "@tanstack/react-query";',
    },
    {
      name: "fichier hors des modules",
      filename: "/repo/apps/web/src/platform/http.ts",
      code: 'import { z } from "zod";',
    },
    {
      name: "un test du domaine importe vitest",
      filename: inModule("catalogue", "domain/movie.test.ts"),
      code: 'import { describe, expect, it } from "vitest";',
    },
    {
      name: "un test du contrat importe vitest",
      filename: inModule("catalogue", "contracts/movie-id.test.ts"),
      code: 'import { describe } from "vitest";',
    },
    {
      name: "export sans source",
      filename: inModule("catalogue", "domain/movie.ts"),
      code: "export const movie = 1;",
    },
  ],
  invalid: [
    ...["zod", "react", "@tanstack/react-query", "@prime/result", "node:crypto"].map((source) => ({
      name: `le domaine importe ${source}`,
      filename: inModule("catalogue", "domain/movie.ts"),
      code: `import { x } from "${source}";`,
      errors: [{ messageId: "package", data: { layer: "domain", source } }],
    })),
    {
      name: "le domaine hors test importe vitest",
      filename: inModule("catalogue", "domain/movie.ts"),
      code: 'import { describe } from "vitest";',
      errors: [{ messageId: "package", data: { layer: "domain", source: "vitest" } }],
    },
    {
      name: "un test du domaine importe un autre paquet que vitest",
      filename: inModule("catalogue", "domain/movie.test.ts"),
      code: 'import { z } from "zod";',
      errors: [{ messageId: "package", data: { layer: "domain", source: "zod" } }],
    },
    {
      name: "le contrat importe React",
      filename: inModule("catalogue", "contracts/movie-id.ts"),
      code: 'import { useState } from "react";',
      errors: [{ messageId: "package", data: { layer: "contracts", source: "react" } }],
    },
    {
      name: "le contrat importe un paquet au nom proche de zod",
      filename: inModule("catalogue", "contracts/movie-id.ts"),
      code: 'import { x } from "zod-to-json-schema";',
      errors: [
        { messageId: "package", data: { layer: "contracts", source: "zod-to-json-schema" } },
      ],
    },
    {
      name: "le domaine importe un type d'un paquet",
      filename: inModule("catalogue", "domain/movie.ts"),
      code: 'import type { Result } from "@prime/result";',
      errors: [{ messageId: "package" }],
    },
    {
      name: "le domaine sort des modules vers platform/",
      filename: inModule("catalogue", "domain/movie.ts"),
      code: 'import { send } from "../../../platform/http.ts";',
      errors: [
        {
          messageId: "outsideModules",
          data: { layer: "domain", source: "../../../platform/http.ts" },
        },
      ],
    },
    {
      name: "le contrat sort des modules",
      filename: inModule("catalogue", "contracts/movie-id.ts"),
      code: 'import { configOf } from "../../../platform/config.ts";',
      errors: [
        {
          messageId: "outsideModules",
          data: { layer: "contracts", source: "../../../platform/config.ts" },
        },
      ],
    },
  ],
});
