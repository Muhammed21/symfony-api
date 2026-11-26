import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronRight } from "lucide-react";

import { ButtonSymbol, SectionHeader } from "@prime/ui";

const meta = {
  title: "Composants/SectionHeader",
  component: SectionHeader,
  args: { title: "Ma liste", level: 2 },
  argTypes: {
    accessory: { control: false },
    level: { control: "inline-radio", options: [2, 3, 4, 5, 6] },
  },
} satisfies Meta<typeof SectionHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Standard: Story = {};

export const AvecLienVersLaSuite: Story = {
  args: {
    title: "Recommandés pour vous",
    accessory: <ButtonSymbol size="mini" label="Tout voir" symbol={<ChevronRight />} />,
  },
};
