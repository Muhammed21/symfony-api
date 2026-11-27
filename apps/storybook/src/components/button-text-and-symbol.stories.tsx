import type { Meta, StoryObj } from "@storybook/react-vite";
import { Play } from "lucide-react";
import { fn } from "storybook/test";

import { ButtonTextAndSymbol } from "@prime/ui";

import { Row } from "../story-layout.tsx";

const meta = {
  title: "Composants/ButtonTextAndSymbol",
  component: ButtonTextAndSymbol,
  args: {
    label: "Lecture",
    symbol: <Play />,
    size: "regular",
    appearance: "platter",
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    symbol: { control: false },
    size: { control: "inline-radio", options: ["regular", "large"] },
    appearance: { control: "inline-radio", options: ["platter", "plain", "prominent", "glass"] },
  },
} satisfies Meta<typeof ButtonTextAndSymbol>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SurVerre: Story = {};

export const SansFond: Story = {
  args: { appearance: "plain" },
};

export const MisEnAvant: Story = {
  args: { appearance: "prominent" },
};

export const Desactive: Story = {
  args: { disabled: true },
};

export const Tailles: Story = {
  render: (args) => (
    <Row>
      <ButtonTextAndSymbol {...args} size="regular" />
      <ButtonTextAndSymbol {...args} size="large" />
    </Row>
  ),
};
