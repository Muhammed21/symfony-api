export const shadow = {
  small: [{ x: 0, y: 2, blur: 4, spread: 0, color: "rgba(0, 0, 0, 0.1)", inset: false }],
  big: [
    { x: 0, y: 40, blur: 80, spread: 0, color: "rgba(0, 0, 0, 0.3)", inset: false },
    { x: 0, y: 7, blur: 10, spread: 0, color: "rgba(0, 0, 0, 0.09)", inset: false },
  ],
  floating: [{ x: 0, y: 16, blur: 52, spread: 0, color: "rgba(0, 0, 0, 0.6)", inset: false }],
  recessed: [
    { x: 0, y: 1.5, blur: 4, spread: 0, color: "rgba(0, 0, 0, 0.18)", inset: true },
    { x: 0, y: -0.5, blur: 1, spread: 0, color: "rgba(255, 255, 255, 0.25)", inset: true },
  ],
  liquidGlass: [
    { x: 0, y: 1, blur: 0, spread: 0, color: "rgba(255, 255, 255, 0.4)", inset: true },
    { x: 0, y: -1, blur: 0, spread: 0, color: "rgba(255, 255, 255, 0.1)", inset: true },
    { x: 0, y: 0, blur: 0, spread: 1, color: "rgba(255, 255, 255, 0.12)", inset: true },
    { x: 0, y: 8, blur: 32, spread: 0, color: "rgba(0, 0, 0, 0.3)", inset: false },
  ],
  liquidGlassSelected: [
    { x: 0, y: 1, blur: 0, spread: 0, color: "rgba(255, 255, 255, 0.45)", inset: true },
    { x: 0, y: 2, blur: 8, spread: 0, color: "rgba(0, 0, 0, 0.2)", inset: false },
  ],
} as const;

export const blur = {
  glass: 50,
  liquidGlass: 16,
} as const;

export const duration = {
  fast: 150,
  page: 320,
  slow: 600,
  spin: 1000,
  glide: 450,
} as const;

export const easing = {
  standard: "cubic-bezier(0.2, 0, 0, 1)",
  decelerate: "cubic-bezier(0.05, 0.7, 0.1, 1)",
  spring: "cubic-bezier(0.34, 1.3, 0.64, 1)",
} as const;
