export const fontFamily = [
  "SF Pro",
  "SF Pro Text",
  "SF Pro Display",
  "-apple-system",
  "BlinkMacSystemFont",
  "system-ui",
  "sans-serif",
] as const;

const BOLD = 700;
const MEDIUM = 510;
const REGULAR = 400;

export const text = {
  xlTitle1: { weight: BOLD, size: 48, lineHeight: 56 },
  xlTitle2: { weight: BOLD, size: 38, lineHeight: 46 },
  largeTitle: { weight: BOLD, size: 29, lineHeight: 38 },
  title1: { weight: BOLD, size: 24, lineHeight: 32 },
  title2: { weight: BOLD, size: 22, lineHeight: 28 },
  title3: { weight: BOLD, size: 19, lineHeight: 24 },
  headline: { weight: BOLD, size: 17, lineHeight: 22 },
  body: { weight: MEDIUM, size: 17, lineHeight: 22 },
  callout: { weight: MEDIUM, size: 15, lineHeight: 20 },
  subheadline: { weight: REGULAR, size: 15, lineHeight: 20 },
  footnote: { weight: MEDIUM, size: 13, lineHeight: 18 },
  caption1: { weight: MEDIUM, size: 12, lineHeight: 16 },
  caption2: { weight: MEDIUM, size: 12, lineHeight: 16 },
} as const;
