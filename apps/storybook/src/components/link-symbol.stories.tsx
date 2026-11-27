import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronRight } from "lucide-react";

import { LinkSymbol, SectionHeader } from "@prime/ui";

const meta = {
  title: "Composants/LinkSymbol",
  component: LinkSymbol,
  args: { label: "Tout voir", symbol: <ChevronRight />, href: "#catalogue", size: "regular" },
  argTypes: {
    symbol: { control: false },
    render: { control: false },
    size: {
      control: "inline-radio",
      options: ["mini", "small", "medium", "regular", "large", "extra-large"],
    },
    appearance: { control: "inline-radio", options: ["platter", "plain", "prominent", "glass"] },
  },
} satisfies Meta<typeof LinkSymbol>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Regulier: Story = {
  name: "Régulier",
};

export const DansUnTitreDeSection: Story = {
  name: "Dans un titre de section",
  render: () => (
    <SectionHeader
      title="Nouveautés"
      accessory={
        <LinkSymbol size="mini" label="Tout voir" symbol={<ChevronRight />} href="#catalogue" />
      }
    />
  ),
};
