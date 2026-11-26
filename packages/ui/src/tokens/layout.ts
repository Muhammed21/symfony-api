export const space = {
  "2xs": 4,
  xs: 6,
  s: 8,
  m: 12,
  l: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 40,
} as const;

export const radius = {
  small: 8,
  medium: 12,
  large: 16,
  panel: 32,
  bar: 34,
  pill: 9999,
} as const;

export const size = {
  control: { mini: 28, small: 32, regular: 44, large: 52, extraLarge: 64 },
  symbol: { mini: 14, small: 16, regular: 20, large: 24, extraLarge: 28 },
  link: { small: 26 },
  navigation: { bar: 92 },
  hero: { height: 560, scrim: 320 },
  avatar: { small: 44, medium: 52, large: 88, extraLarge: 128 },
  activityIndicator: { small: 20, medium: 28, large: 44 },
  pageControl: { dot: 8, height: 28 },
  thumb: { width: 224, landscapeHeight: 125, portraitHeight: 336 },
} as const;

export const scale = {
  thumbHover: 1.18,
} as const;
