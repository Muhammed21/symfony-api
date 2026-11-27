import type { ReactNode } from "react";

import type { ControlAppearance } from "../control/control.ts";

import styles from "./button-symbol.module.css";

export type ButtonSymbolSize = "mini" | "small" | "medium" | "regular" | "large" | "extra-large";

export type ButtonSymbolProps = {
  readonly label: string;
  readonly symbol: ReactNode;
  readonly size?: ButtonSymbolSize;
  readonly appearance?: ControlAppearance;
  readonly disabled?: boolean;
  readonly onClick?: () => void;
};

export const ButtonSymbol = ({
  label,
  symbol,
  size = "regular",
  appearance,
  disabled = false,
  onClick,
}: ButtonSymbolProps) => (
  <button
    type="button"
    className={styles.button}
    data-size={size}
    data-appearance={appearance}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
  >
    <span aria-hidden="true" className={styles.symbol}>
      {symbol}
    </span>
  </button>
);
