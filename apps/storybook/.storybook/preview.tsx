import "@prime/ui/theme.css";
import "./preview.css";
import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: {
      options: {
        night: { name: "Nuit", value: "#141414" },
        black: { name: "Noir", value: "#000000" },
      },
    },
    controls: { expanded: true },
  },
  initialGlobals: {
    backgrounds: { value: "night" },
  },
};

export default preview;
