import { composeStory, type Meta, type StoryObj } from "@storybook/react-vite";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-react";

import * as designSystem from "@prime/ui";

type StoriesModule = { readonly default: Meta } & Readonly<Record<string, StoryObj>>;

const storiesModules = import.meta.glob<StoriesModule>("../**/*.stories.tsx", { eager: true });

const isComponent = (name: string, value: unknown): boolean =>
  typeof value === "function" && /^[A-Z]/.test(name);

const publicComponents = Object.entries(designSystem).filter(([name, value]) =>
  isComponent(name, value),
);

const documentedComponents: readonly unknown[] = Object.values(storiesModules).map(
  (module) => module.default.component,
);

const stories = Object.entries(storiesModules).flatMap(([file, { default: meta, ...exports }]) =>
  Object.entries(exports).map(
    ([name, story]) => [`${file} › ${name}`, composeStory(story, meta, undefined, name)] as const,
  ),
);

describe("Storybook", () => {
  it("documente chaque composant public de @prime/ui", () => {
    const undocumented = publicComponents
      .filter(([, component]) => !documentedComponents.includes(component))
      .map(([name]) => name);

    expect(publicComponents.length).toBeGreaterThan(0);
    expect(undocumented).toEqual([]);
  });

  it.each(stories)("%s s'affiche", async (_name, Story) => {
    const screen = await render(<Story />);

    expect(screen.container.childElementCount).toBeGreaterThan(0);
  });
});
