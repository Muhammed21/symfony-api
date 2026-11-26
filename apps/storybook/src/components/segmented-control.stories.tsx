import type { Meta, StoryObj } from "@storybook/react-vite";

import { SegmentedControl } from "@prime/ui";

const meta = {
  title: "Composants/SegmentedControl",
  component: SegmentedControl,
  args: {
    label: "Mode du compte",
    segments: [
      { label: "Se connecter", current: true, href: "#connexion" },
      { label: "Créer un compte", current: false, href: "#inscription" },
    ],
  },
  argTypes: { segments: { control: false } },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: "320px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SegmentedControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ConnexionSelectionnee: Story = {
  name: "Connexion sélectionnée",
};

export const CreationSelectionnee: Story = {
  name: "Création sélectionnée",
  args: {
    segments: [
      { label: "Se connecter", current: false, href: "#connexion" },
      { label: "Créer un compte", current: true, href: "#inscription" },
    ],
  },
};
