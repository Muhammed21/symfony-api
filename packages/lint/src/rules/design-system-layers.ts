import { dirname, resolve } from "node:path/posix";

import { defineRule } from "@oxlint/plugins";

import { onImport } from "./imports.ts";
import { isInternalImport } from "./paths.ts";

type Layer = {
  readonly name: string;
  readonly layers: readonly string[];
  readonly packages: readonly string[];
};

const LAYERS = new Map<string | undefined, Layer>(
  [
    { name: "tokens", layers: ["tokens"], packages: [] },
    { name: "theme", layers: ["tokens", "theme"], packages: [] },
    { name: "components", layers: ["components"], packages: ["react"] },
  ].map((layer) => [layer.name, layer]),
);

const LAYER_PATH = /\/packages\/ui\/src\/([^/]+)\//;

const PACKAGE_ROOT = "racine du paquet";

const layerOf = (path: string): string | undefined => LAYER_PATH.exec(path)?.[1];

const isTest = (path: string): boolean => path.includes(".test.");

const isAllowedPackage = (source: string, packages: readonly string[]): boolean =>
  packages.some((name) => source === name || source.startsWith(`${name}/`));

export const designSystemLayers = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Design system : jetons ← thème ← composants, les composants lisent les jetons par les variables CSS (ADR 0004)",
    },
    messages: {
      forbiddenLayer:
        "La couche {{from}} du design system n'importe pas {{to}} : jetons ← thème ← composants, et les composants ne lisent les jetons qu'à travers les variables CSS (ADR 0004).",
      package:
        "La couche {{from}} du design system n'importe pas le paquet {{source}} : jetons et thème n'importent aucun paquet, les composants seulement react (ADR 0004).",
    },
  },
  create(context) {
    const layer = LAYERS.get(layerOf(context.filename));
    if (layer === undefined || isTest(context.filename)) {
      return {};
    }
    const from = layer.name;
    return onImport((source, node) => {
      if (!isInternalImport(source)) {
        if (!isAllowedPackage(source, layer.packages)) {
          context.report({ node, messageId: "package", data: { from, source } });
        }
        return;
      }
      const to = layerOf(resolve(dirname(context.filename), source)) ?? PACKAGE_ROOT;
      if (!layer.layers.includes(to)) {
        context.report({ node, messageId: "forbiddenLayer", data: { from, to } });
      }
    });
  },
});
