import type { DesignTokens, Pixels, Scale, Shadow, TextStyle } from "../tokens/design-tokens.ts";

type Declaration = readonly [name: string, value: string];

const PREFIX = "--prime";

const FONT_FAMILY = `${PREFIX}-font-family`;

const kebabCase = (name: string): string =>
  name.replaceAll(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

const pixels = (value: Pixels): string => `${value}px`;

const fontFamilyName = (name: string): string => (name.includes(" ") ? `"${name}"` : name);

const font = ({ weight, size, lineHeight }: TextStyle): string =>
  `${weight} ${pixels(size)}/${pixels(lineHeight)} var(${FONT_FAMILY})`;

const boxShadow = ({ x, y, blur, spread, color, inset }: Shadow): string =>
  `${inset ? "inset " : ""}${[x, y, blur, spread].map(pixels).join(" ")} ${color}`;

const scaleDeclarations = <Value>(
  group: string,
  values: Scale<Value>,
  format: (value: Value) => string,
): readonly Declaration[] =>
  Object.entries(values).map(([name, value]) => [`${group}-${kebabCase(name)}`, format(value)]);

const nestedDeclarations = <Value>(
  group: string,
  scales: Scale<Scale<Value>>,
  format: (value: Value) => string,
): readonly Declaration[] =>
  Object.entries(scales).flatMap(([name, values]) =>
    scaleDeclarations(`${group}-${kebabCase(name)}`, values, format),
  );

const declarationsOf = (tokens: DesignTokens): readonly Declaration[] => [
  ...nestedDeclarations(`${PREFIX}-color`, tokens.color, String),
  [FONT_FAMILY, tokens.fontFamily.map(fontFamilyName).join(", ")],
  ...scaleDeclarations(`${PREFIX}-text`, tokens.text, font),
  ...scaleDeclarations(`${PREFIX}-space`, tokens.space, pixels),
  ...scaleDeclarations(`${PREFIX}-radius`, tokens.radius, pixels),
  ...nestedDeclarations(`${PREFIX}-size`, tokens.size, pixels),
  ...scaleDeclarations(`${PREFIX}-scale`, tokens.scale, String),
  ...scaleDeclarations(`${PREFIX}-duration`, tokens.duration, (value) => `${value}ms`),
  ...scaleDeclarations(`${PREFIX}-easing`, tokens.easing, String),
  ...scaleDeclarations(`${PREFIX}-shadow`, tokens.shadow, (shadows) =>
    shadows.map(boxShadow).join(", "),
  ),
  ...scaleDeclarations(`${PREFIX}-blur`, tokens.blur, pixels),
];

export const themeStylesheet = (tokens: DesignTokens): string => {
  const lines = [
    "color-scheme: dark",
    ...declarationsOf(tokens).map(([name, value]) => `${name}: ${value}`),
  ];
  return `:root {\n${lines.map((line) => `  ${line};\n`).join("")}}\n`;
};
