import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Link } from "@prime/ui";

import { Row } from "../story-layout.tsx";

const meta = {
  title: "Composants/Link",
  component: Link,
  args: {
    label: "En savoir plus",
    href: "#",
    size: "small",
    symbolPlacement: "leading",
  },
  argTypes: {
    symbol: { control: false },
    render: { control: false },
    size: { control: "inline-radio", options: ["small", "regular"] },
    symbolPlacement: { control: "inline-radio", options: ["leading", "trailing"] },
    appearance: { control: "inline-radio", options: ["platter", "plain", "prominent", "glass"] },
  },
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PiluleDeTexte: Story = {};

export const SansFond: Story = {
  args: { appearance: "plain" },
};

export const AvecSymbole: Story = {
  args: {
    size: "regular",
    label: "Suivant",
    symbol: <ChevronRight />,
    symbolPlacement: "trailing",
  },
};

export const Pagination: Story = {
  render: () => (
    <Row>
      <Link size="regular" href="#" label="Précédent" symbol={<ChevronLeft />} />
      <Link
        size="regular"
        href="#"
        label="Suivant"
        symbol={<ChevronRight />}
        symbolPlacement="trailing"
      />
    </Row>
  ),
};

export const RenduParLeRouteur: Story = {
  name: "Rendu par le routeur de l'application",
  render: () => (
    <Link
      size="regular"
      label="Lien rendu par l'application"
      render={(anchor) => <a {...anchor} href="#routeur" />}
    />
  ),
};
