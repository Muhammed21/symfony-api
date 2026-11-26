import type { Meta, StoryObj } from "@storybook/react-vite";
import { House, Search } from "lucide-react";

import { TabBar } from "@prime/ui";

const meta = {
  title: "Composants/TabBar",
  component: TabBar,
  args: {
    label: "Navigation principale",
    tabs: [
      { label: "Accueil", symbol: <House />, current: true, href: "#accueil" },
      { label: "Catalogue", symbol: <Search />, current: false, href: "#catalogue" },
    ],
  },
  argTypes: {
    tabs: { control: false },
    orientation: { control: "inline-radio", options: ["vertical", "horizontal"] },
  },
} satisfies Meta<typeof TabBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AccueilSelectionne: Story = {
  name: "Accueil sélectionné",
};

export const CatalogueSelectionne: Story = {
  name: "Catalogue sélectionné",
  args: {
    tabs: [
      { label: "Accueil", symbol: <House />, current: false, href: "#accueil" },
      { label: "Catalogue", symbol: <Search />, current: true, href: "#catalogue" },
    ],
  },
};

export const Horizontale: Story = {
  name: "Horizontale, en haut à droite",
  args: { orientation: "horizontal" },
};
