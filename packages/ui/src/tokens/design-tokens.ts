export type Color = string;

export type Pixels = number;

export type Milliseconds = number;

export type TimingFunction = string;

export type TextStyle = {
  readonly weight: number;
  readonly size: Pixels;
  readonly lineHeight: Pixels;
};

export type Shadow = {
  readonly x: Pixels;
  readonly y: Pixels;
  readonly blur: Pixels;
  readonly spread: Pixels;
  readonly color: Color;
  readonly inset: boolean;
};

export type Scale<Value> = Readonly<Record<string, Value>>;

export type DesignTokens = {
  readonly color: Scale<Scale<Color>>;
  readonly fontFamily: readonly string[];
  readonly text: Scale<TextStyle>;
  readonly space: Scale<Pixels>;
  readonly radius: Scale<Pixels>;
  readonly size: Scale<Scale<Pixels>>;
  readonly scale: Scale<number>;
  readonly duration: Scale<Milliseconds>;
  readonly easing: Scale<TimingFunction>;
  readonly shadow: Scale<readonly Shadow[]>;
  readonly blur: Scale<Pixels>;
};
