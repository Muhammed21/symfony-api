import { RuleTester } from "oxlint/plugins-dev";
import { describe, it } from "vitest";

import { designSystemLayers } from "../design-system-layers.ts";

RuleTester.describe = describe;
RuleTester.it = it;

const tester = new RuleTester();

const UI = "/repo/packages/ui/src";

tester.run("design-system-layers", designSystemLayers, {
  valid: [
    {
      name: "un jeton importe un autre jeton",
      filename: `${UI}/tokens/index.ts`,
      code: 'import { color } from "./color.ts";',
    },
    {
      name: "le thème importe les jetons",
      filename: `${UI}/theme/theme-stylesheet.ts`,
      code: 'import type { DesignTokens } from "../tokens/design-tokens.ts";',
    },
    {
      name: "le thème importe le thème",
      filename: `${UI}/theme/index.ts`,
      code: 'import { themeStylesheet } from "./theme-stylesheet.ts";',
    },
    {
      name: "un composant importe React",
      filename: `${UI}/components/button-symbol/button-symbol.tsx`,
      code: 'import type { ReactNode } from "react";',
    },
    {
      name: "un composant importe un sous-chemin de React",
      filename: `${UI}/components/button-symbol/button-symbol.tsx`,
      code: 'import { jsx } from "react/jsx-runtime";',
    },
    {
      name: "un composant importe son module CSS",
      filename: `${UI}/components/button-symbol/button-symbol.tsx`,
      code: 'import styles from "./button-symbol.module.css";',
    },
    {
      name: "un composant importe un autre composant",
      filename: `${UI}/components/button-symbol/button-symbol.tsx`,
      code: 'import type { ControlAppearance } from "../control/control.ts";',
    },
    {
      name: "un test importe ce dont il a besoin",
      filename: `${UI}/components/__tests__/theme-variables.test.ts`,
      code: 'import { tokens } from "../../tokens/index.ts";\nimport { readFile } from "node:fs/promises";',
    },
    {
      name: "un test de composant importe ce dont il a besoin",
      filename: `${UI}/components/button-symbol/__tests__/button-symbol.test.tsx`,
      code: 'import { render } from "vitest-browser-react";',
    },
    {
      name: "la racine du paquet importe toutes les couches",
      filename: `${UI}/index.ts`,
      code: 'export { tokens } from "./tokens/index.ts";\nexport { ButtonSymbol } from "./components/button-symbol/button-symbol.tsx";',
    },
    {
      name: "fichier hors du design system",
      filename: "/repo/apps/web/src/main.tsx",
      code: 'import { tokens } from "../../packages/ui/src/tokens/index.ts";',
    },
    {
      name: "export sans source",
      filename: `${UI}/tokens/color.ts`,
      code: "export const color = {};",
    },
  ],
  invalid: [
    ...[
      ["tokens", "../theme/theme-stylesheet.ts", "theme"],
      ["tokens", "../components/button-symbol/button-symbol.tsx", "components"],
      ["theme", "../components/button-symbol/button-symbol.tsx", "components"],
      ["components", "../../tokens/index.ts", "tokens"],
      ["components", "../../theme/theme-stylesheet.ts", "theme"],
      ["components", "../../index.ts", "racine du paquet"],
    ].map(([from = "", source = "", to = ""]) => ({
      name: `la couche ${from} importe ${to}`,
      filename:
        from === "components"
          ? `${UI}/components/button-symbol/button-symbol.tsx`
          : `${UI}/${from}/x.ts`,
      code: `import { a } from "${source}";`,
      errors: [{ messageId: "forbiddenLayer", data: { from, to } }],
    })),
    {
      name: "export depuis une couche interdite",
      filename: `${UI}/tokens/index.ts`,
      code: 'export { themeStylesheet } from "../theme/theme-stylesheet.ts";',
      errors: [{ messageId: "forbiddenLayer", data: { from: "tokens", to: "theme" } }],
    },
    {
      name: "import dynamique d'une couche interdite",
      filename: `${UI}/theme/x.ts`,
      code: 'const load = () => import("../components/button-symbol/button-symbol.tsx");',
      errors: [{ messageId: "forbiddenLayer", data: { from: "theme", to: "components" } }],
    },
    ...[
      ["tokens", "zod"],
      ["tokens", "react"],
      ["theme", "node:fs"],
      ["theme", "react"],
      ["components", "lucide-react"],
      ["components", "react-dom"],
      ["components", "@prime/result"],
    ].map(([from = "", source = ""]) => ({
      name: `la couche ${from} importe le paquet ${source}`,
      filename: `${UI}/${from}/x.ts`,
      code: `import { a } from "${source}";`,
      errors: [{ messageId: "package", data: { from, source } }],
    })),
  ],
});
