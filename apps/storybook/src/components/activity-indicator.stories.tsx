import type { Meta, StoryObj } from "@storybook/react-vite";

import { ActivityIndicator } from "@prime/ui";

import { Row } from "../story-layout.tsx";

const meta = {
  title: "Composants/ActivityIndicator",
  component: ActivityIndicator,
  args: { size: "medium", label: "Chargement" },
  argTypes: {
    size: { control: "inline-radio", options: ["small", "medium", "large"] },
  },
} satisfies Meta<typeof ActivityIndicator>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

export const Tailles: Story = {
  render: (args) => (
    <Row>
      <ActivityIndicator {...args} size="small" />
      <ActivityIndicator {...args} size="medium" />
      <ActivityIndicator {...args} size="large" />
    </Row>
  ),
};
