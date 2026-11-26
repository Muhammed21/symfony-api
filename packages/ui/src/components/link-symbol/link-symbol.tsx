import type { ReactElement, ReactNode } from "react";

import type { ButtonSymbolSize } from "../button-symbol/button-symbol.tsx";
import type { ControlAppearance } from "../control/control.ts";

import styles from "./link-symbol.module.css";

export type LinkSymbolAnchor = {
  readonly className: string | undefined;
  readonly "aria-label": string;
  readonly "data-size": ButtonSymbolSize;
  readonly "data-appearance": ControlAppearance | undefined;
  readonly children: ReactNode;
};

type LinkSymbolTarget =
  | { readonly href: string; readonly render?: never }
  | { readonly render: (anchor: LinkSymbolAnchor) => ReactElement; readonly href?: never };

export type LinkSymbolProps = {
  readonly label: string;
  readonly symbol: ReactNode;
  readonly size?: ButtonSymbolSize;
  readonly appearance?: ControlAppearance;
} & LinkSymbolTarget;

export const LinkSymbol = ({
  label,
  symbol,
  size = "regular",
  appearance,
  href,
  render = (anchor) => <a {...anchor} href={href} />,
}: LinkSymbolProps) =>
  render({
    className: styles.link,
    "aria-label": label,
    "data-size": size,
    "data-appearance": appearance,
    children: (
      <span aria-hidden="true" className={styles.symbol}>
        {symbol}
      </span>
    ),
  });
