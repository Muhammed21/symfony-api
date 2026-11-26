import type { Meta, StoryObj } from "@storybook/react-vite";

import { Avatar } from "@prime/ui";

const meta = {
  title: "Composants/Avatar",
  component: Avatar,
  args: { initial: "A" },
  argTypes: { size: { control: "inline-radio", options: ["small", "medium"] } },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Petit: Story = {};

export const Moyen: Story = {
  args: { size: "medium" },
};
