import { definePlugin } from "@oxlint/plugins";

import { designSystemLayers } from "./rules/design-system-layers.ts";
import { layerDependencies } from "./rules/layer-dependencies.ts";
import { moduleBoundaries } from "./rules/module-boundaries.ts";
import { noDisableArchitecture } from "./rules/no-disable-architecture.ts";
import { pureDomain } from "./rules/pure-domain.ts";
import { uiInPresentation } from "./rules/ui-in-presentation.ts";

export default definePlugin({
  meta: { name: "prime" },
  rules: {
    "design-system-layers": designSystemLayers,
    "module-boundaries": moduleBoundaries,
    "layer-dependencies": layerDependencies,
    "no-disable-architecture": noDisableArchitecture,
    "pure-domain": pureDomain,
    "ui-in-presentation": uiInPresentation,
  },
});
