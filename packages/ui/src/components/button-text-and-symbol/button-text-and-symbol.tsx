import type { ReactNode } from "react";

import type { ControlAppearance } from "../control/control.ts";

import styles from "./button-text-and-symbol.module.css";

export type ButtonTextAndSymbolSize = "regular" | "large";

export type ButtonTextAndSymbolType = "button" | "submit";

export type ButtonTextAndSymbolPlacement = "leading" | "trailing";

export type ButtonTextAndSymbolProps = {
  readonly label: string;
  readonly symbol: ReactNode;
  readonly symbolPlacement?: ButtonTextAndSymbolPlacement;
  readonly size?: ButtonTextAndSymbolSize;
  readonly appearance?: ControlAppearance;
  readonly disabled?: boolean;
  readonly type?: ButtonTextAndSymbolType;
  readonly onClick?: () => void;
};

export const ButtonTextAndSymbol = ({
  label,
  symbol,
  symbolPlacement = "leading",
  size = "regular",
  appearance,
  disabled = false,
  type = "button",
  onClick,
}: ButtonTextAndSymbolProps) => (
  <button
    type={type}
    className={styles.button}
    data-size={size}
    data-appearance={appearance}
    disabled={disabled}
    onClick={onClick}
  >
    {symbolPlacement === "trailing" && label}
    <span aria-hidden="true" className={styles.symbol}>
      {symbol}
    </span>
    {symbolPlacement === "leading" && label}
  </button>
);
