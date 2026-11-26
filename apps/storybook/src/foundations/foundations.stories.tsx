import type { Meta, StoryObj } from "@storybook/react-vite";
import type { CSSProperties } from "react";

import { Column, Row } from "../story-layout.tsx";
import { type ThemeVariable, themeVariables } from "./theme-variables.ts";

import stylesheet from "@prime/ui/theme.css?raw";

const meta = {
  title: "Fondations",
  parameters: { layout: "padded" },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

const captionStyle: CSSProperties = {
  font: "var(--prime-text-footnote)",
  color: "var(--prime-color-text-secondary)",
};

const Caption = ({ variable }: { readonly variable: ThemeVariable }) => (
  <span style={captionStyle}>
    <code>{variable.name}</code>
    <br />
    {variable.value}
  </span>
);

const Specimens = ({
  group,
  specimen,
}: {
  readonly group: string;
  readonly specimen: (variable: ThemeVariable) => CSSProperties;
}) => (
  <Row>
    {themeVariables(stylesheet, group).map((variable) => (
      <figure
        key={variable.name}
        style={{ display: "grid", gap: "var(--prime-space-s)", margin: 0 }}
      >
        <div style={specimen(variable)} />
        <figcaption>
          <Caption variable={variable} />
        </figcaption>
      </figure>
    ))}
  </Row>
);

const SQUARE = "var(--prime-size-control-extra-large)";

export const Couleurs: Story = {
  render: () => (
    <Specimens
      group="color"
      specimen={({ name }) => ({
        inlineSize: SQUARE,
        blockSize: SQUARE,
        borderRadius: "var(--prime-radius-medium)",
        background: `var(${name})`,
        backdropFilter: "blur(var(--prime-blur-glass))",
      })}
    />
  ),
};

export const Typographie: Story = {
  render: () => (
    <Column>
      {themeVariables(stylesheet, "text").map((variable) => (
        <div key={variable.name}>
          <p style={{ font: `var(${variable.name})`, margin: 0 }}>Les Anneaux de Pouvoir</p>
          <Caption variable={variable} />
        </div>
      ))}
    </Column>
  ),
};

export const Espacements: Story = {
  render: () => (
    <Specimens
      group="space"
      specimen={({ name }) => ({
        inlineSize: `var(${name})`,
        blockSize: SQUARE,
        background: "var(--prime-color-system-blue)",
      })}
    />
  ),
};

export const Rayons: Story = {
  render: () => (
    <Specimens
      group="radius"
      specimen={({ name }) => ({
        inlineSize: SQUARE,
        blockSize: SQUARE,
        borderRadius: `var(${name})`,
        background: "var(--prime-color-control-idle)",
      })}
    />
  ),
};

export const Ombres: Story = {
  render: () => (
    <Specimens
      group="shadow"
      specimen={({ name }) => ({
        inlineSize: "var(--prime-size-thumb-width)",
        blockSize: "var(--prime-size-thumb-landscape-height)",
        borderRadius: "var(--prime-radius-medium)",
        background: "var(--prime-color-view-regular)",
        boxShadow: `var(${name})`,
      })}
    />
  ),
};
