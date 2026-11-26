import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { SearchToken } from "@prime/ui";

import { Row } from "../story-layout.tsx";

const meta = {
  title: "Composants/SearchToken",
  component: SearchToken,
  args: { label: "Drame", selected: false, onClick: fn() },
} satisfies Meta<typeof SearchToken>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NonSelectionne: Story = {
  name: "Non sélectionné",
};

export const Selectionne: Story = {
  name: "Sélectionné",
  args: { selected: true },
};

const GENRES = ["Tous", "Action", "Animation", "Aventure", "Comédie", "Drame"] as const;

const GenreFilter = () => {
  const [selected, setSelected] = useState<string>("Tous");
  return (
    <Row>
      {GENRES.map((genre) => (
        <SearchToken
          key={genre}
          label={genre}
          selected={genre === selected}
          onClick={() => setSelected(genre)}
        />
      ))}
    </Row>
  );
};

export const FiltreDeGenres: Story = {
  name: "Filtre de genres",
  render: () => <GenreFilter />,
};
