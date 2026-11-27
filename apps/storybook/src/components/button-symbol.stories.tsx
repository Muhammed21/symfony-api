import type { Meta, StoryObj } from "@storybook/react-vite";
import { Info, Play, Plus } from "lucide-react";
import { fn } from "storybook/test";

import { ButtonSymbol, type ButtonSymbolSize } from "@prime/ui";

import { Row } from "../story-layout.tsx";

const SIZES: readonly ButtonSymbolSize[] = [
  "mini",
  "small",
  "medium",
  "regular",
  "large",
  "extra-large",
];

const meta = {
  title: "Composants/ButtonSymbol",
  component: ButtonSymbol,
  args: {
    label: "Ajouter à ma liste",
    symbol: <Plus />,
    size: "large",
    appearance: "platter",
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    symbol: { control: false },
    size: { control: "inline-radio", options: SIZES },
    appearance: { control: "inline-radio", options: ["platter", "plain", "prominent", "glass"] },
  },
} satisfies Meta<typeof ButtonSymbol>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SurVerre: Story = {};

export const SansFond: Story = {
  args: { appearance: "plain", label: "Informations", symbol: <Info /> },
};

export const MisEnAvant: Story = {
  args: { appearance: "prominent", size: "extra-large", label: "Lecture", symbol: <Play /> },
};

export const Desactive: Story = {
  args: { disabled: true },
};

export const Tailles: Story = {
  render: (args) => (
    <Row>
      {SIZES.map((size) => (
        <ButtonSymbol key={size} {...args} size={size} />
      ))}
    </Row>
  ),
};

export const ActionsDuHero: Story = {
  render: (args) => (
    <Row>
      <ButtonSymbol
        {...args}
        appearance="prominent"
        size="extra-large"
        label="Lecture"
        symbol={<Play />}
      />
      <ButtonSymbol {...args} label="Ajouter à ma liste" symbol={<Plus />} />
      <ButtonSymbol {...args} label="Informations" symbol={<Info />} />
    </Row>
  ),
};
