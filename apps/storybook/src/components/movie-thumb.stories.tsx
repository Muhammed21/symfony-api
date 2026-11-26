import type { Meta, StoryObj } from "@storybook/react-vite";

import { MovieThumb, SectionHeader } from "@prime/ui";

import { Column, Row } from "../story-layout.tsx";

const gradientPoster = (from: string, to: string): string =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9"><defs><linearGradient id="g"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs><rect width="16" height="9" fill="url(#g)"/></svg>`,
  )}`;

const meta = {
  title: "Composants/MovieThumb",
  component: MovieThumb,
  parameters: { layout: "padded" },
  args: { title: "Le Grand Voyage", orientation: "landscape" },
  argTypes: {
    orientation: { control: "inline-radio", options: ["landscape", "portrait"] },
  },
} satisfies Meta<typeof MovieThumb>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SansImage: Story = {};

export const AvecImage: Story = {
  args: { image: gradientPoster("#0a84ff", "#bf5af2") },
};

export const AvecLegende: Story = {
  name: "Avec légende",
  args: { image: gradientPoster("#0a84ff", "#bf5af2"), captioned: true },
};

export const ImageIntrouvable: Story = {
  name: "Image introuvable",
  args: { image: "data:image/png;base64,AAAA" },
};

export const Portrait: Story = {
  args: { orientation: "portrait", image: gradientPoster("#ff9f0a", "#ff375f") },
};

const ROW = [
  ["Le Grand Voyage", "#0a84ff", "#5e5ce6"],
  ["Nuit Blanche", "#32d74b", "#6ac4dc"],
  ["L'Horizon", "#ff9f0a", "#ff453a"],
  ["Sans Retour", undefined, undefined],
  ["Les Marées", "#bf5af2", "#ff375f"],
] as const;

export const RangeeDeVignettes: Story = {
  render: () => (
    <Column>
      <SectionHeader title="Ma liste" />
      <Row>
        {ROW.map(([title, from, to]) =>
          from === undefined ? (
            <MovieThumb key={title} title={title} />
          ) : (
            <MovieThumb key={title} title={title} image={gradientPoster(from, to)} />
          ),
        )}
      </Row>
    </Column>
  ),
};
