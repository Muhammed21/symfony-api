export type ThemeVariable = {
  readonly name: string;
  readonly value: string;
};

const DECLARATION = /^\s*(--prime-[a-z0-9-]+):\s*(.+);$/gm;

export const themeVariables = (stylesheet: string, group: string): readonly ThemeVariable[] =>
  Array.from(stylesheet.matchAll(DECLARATION), ([, name = "", value = ""]) => ({
    name,
    value,
  })).filter(({ name }) => name.startsWith(`--prime-${group}-`));
