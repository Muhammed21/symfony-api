import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { PageControl, type PageControlProps } from "@prime/ui";

const meta = {
  title: "Composants/PageControl",
  component: PageControl,
  args: { label: "Pagination", count: 8, current: 3, onSelect: fn() },
  argTypes: {
    count: { control: { type: "range", min: 2, max: 12 } },
    current: { control: { type: "number", min: 1 } },
  },
} satisfies Meta<typeof PageControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Statique: Story = {};

const InteractivePageControl = (props: PageControlProps) => {
  const [current, setCurrent] = useState(props.current);
  return (
    <PageControl
      {...props}
      current={current}
      onSelect={(page) => {
        setCurrent(page);
        props.onSelect(page);
      }}
    />
  );
};

export const Interactif: Story = {
  render: (args) => <InteractivePageControl {...args} />,
};
