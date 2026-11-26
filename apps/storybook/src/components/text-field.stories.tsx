import type { Meta, StoryObj } from "@storybook/react-vite";
import { Eye, Search } from "lucide-react";
import { useState } from "react";
import { fn } from "storybook/test";

import { ButtonSymbol, TextField, type TextFieldProps } from "@prime/ui";

const meta = {
  title: "Composants/TextField",
  component: TextField,
  args: { label: "Année", value: "", placeholder: "1994", onChange: fn() },
  argTypes: {
    symbol: { control: false },
    accessory: { control: false },
    type: { control: "inline-radio", options: ["text", "search", "email", "password"] },
    inputMode: { control: "inline-radio", options: ["text", "numeric"] },
  },
  decorators: [
    (Story) => (
      <div style={{ inlineSize: "320px" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;

type Story = StoryObj<typeof meta>;

const InteractiveTextField = (props: TextFieldProps) => {
  const [value, setValue] = useState(props.value);
  return (
    <TextField
      {...props}
      value={value}
      onChange={(next) => {
        setValue(next);
        props.onChange(next);
      }}
    />
  );
};

export const ChampDeTexte: Story = {
  render: (args) => <InteractiveTextField {...args} />,
};

export const Rempli: Story = {
  args: { value: "1972" },
};

export const ChampDeRecherche: Story = {
  args: {
    type: "search",
    label: "Rechercher un titre",
    placeholder: "Rechercher un titre",
    symbol: <Search />,
  },
  render: (args) => <InteractiveTextField {...args} />,
};

export const Annee: Story = {
  name: "Année (clavier numérique, 4 chiffres)",
  args: { inputMode: "numeric", maxLength: 4 },
  render: (args) => <InteractiveTextField {...args} />,
};

export const EMailAvecLibelle: Story = {
  name: "E-mail, libellé visible",
  args: {
    type: "email",
    label: "E-mail",
    placeholder: "vous@exemple.fr",
    autoComplete: "email",
    labelVisible: true,
  },
  render: (args) => <InteractiveTextField {...args} />,
};

export const MotDePasseAvecAide: Story = {
  name: "Mot de passe, aide et bouton œil",
  args: {
    type: "password",
    label: "Mot de passe",
    autoComplete: "new-password",
    labelVisible: true,
    hint: "8 caractères minimum",
    accessory: (
      <ButtonSymbol
        size="mini"
        appearance="plain"
        label="Afficher le mot de passe"
        symbol={<Eye />}
      />
    ),
  },
  render: (args) => <InteractiveTextField {...args} />,
};

export const EnErreur: Story = {
  name: "En erreur",
  args: {
    type: "email",
    label: "E-mail",
    value: "pas-un-email",
    labelVisible: true,
    error: "Cet e-mail n'est pas valide.",
  },
};
