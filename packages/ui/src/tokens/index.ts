import { color } from "./color.ts";
import type { DesignTokens } from "./design-tokens.ts";
import { blur, duration, easing, shadow } from "./effect.ts";
import { radius, scale, size, space } from "./layout.ts";
import { fontFamily, text } from "./typography.ts";

export type {
  Color,
  DesignTokens,
  Pixels,
  Shadow,
  TextStyle,
  TimingFunction,
} from "./design-tokens.ts";

export const tokens = {
  color,
  fontFamily,
  text,
  space,
  radius,
  size,
  scale,
  duration,
  easing,
  shadow,
  blur,
} as const satisfies DesignTokens;
