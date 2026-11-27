export const color = {
  system: {
    red: "#ff453a",
    orange: "#ff9f0a",
    yellow: "#ffd60a",
    green: "#32d74b",
    mint: "#66d4cf",
    teal: "#6ac4dc",
    cyan: "#5ac8f5",
    blue: "#0a84ff",
    indigo: "#5e5ce6",
    purple: "#bf5af2",
    pink: "#ff375f",
    brown: "#ac8e68",
    gray: "#98989d",
    black: "#000000",
    white: "#fefefe",
  },
  text: {
    primary: "rgba(255, 255, 255, 0.96)",
    secondary: "rgba(255, 255, 255, 0.56)",
    tertiary: "rgba(255, 255, 255, 0.32)",
    onProminent: "#000000",
  },
  control: {
    idle: "rgba(255, 255, 255, 0.12)",
    hover: "rgba(255, 255, 255, 0.18)",
    pressed: "rgba(255, 255, 255, 0.26)",
    prominent: "rgba(255, 255, 255, 0.96)",
    disabled: "rgba(255, 255, 255, 0.06)",
  },
  view: {
    thin: "rgba(255, 255, 255, 0.1)",
    regular: "rgba(40, 40, 40, 0.5)",
    thicker: "rgba(20, 20, 20, 0.8)",
    recessed: "rgba(0, 0, 0, 0.2)",
    scrim: "rgba(0, 0, 0, 0.8)",
  },
  window: {
    glass: "rgba(128, 128, 128, 0.3)",
  },
  liquidGlass: {
    fill: "rgba(255, 255, 255, 0.08)",
    selected: "rgba(255, 255, 255, 0.2)",
  },
  separator: {
    default: "rgba(255, 255, 255, 0.12)",
  },
} as const;
