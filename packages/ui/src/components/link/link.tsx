import type { ReactElement, ReactNode } from "react";

import type { ControlAppearance } from "../control/control.ts";

import styles from "./link.module.css";

export type LinkSize = "small" | "regular";

export type LinkSymbolPlacement = "leading" | "trailing";

export type LinkAnchor = {
  readonly className: string | undefined;
  readonly "data-size": LinkSize;
  readonly "data-appearance": ControlAppearance | undefined;
  readonly children: ReactNode;
};

type LinkTarget =
  | { readonly href: string; readonly render?: never }
  | { readonly render: (anchor: LinkAnchor) => ReactElement; readonly href?: never };

export type LinkProps = {
  readonly label: string;
  readonly symbol?: ReactNode;
  readonly symbolPlacement?: LinkSymbolPlacement;
  readonly size?: LinkSize;
  readonly appearance?: ControlAppearance;
} & LinkTarget;

const contentOf = ({
  label,
  symbol,
  symbolPlacement,
}: {
  readonly label: string;
  readonly symbol: ReactNode;
  readonly symbolPlacement: LinkSymbolPlacement | undefined;
}): ReactNode => {
  if (symbol === undefined) {
    return label;
  }
  const decorative = (
    <span aria-hidden="true" className={styles.symbol}>
      {symbol}
    </span>
  );
  return symbolPlacement === "trailing" ? (
    <>
      {label}
      {decorative}
    </>
  ) : (
    <>
      {decorative}
      {label}
    </>
  );
};

export const Link = ({
  label,
  symbol,
  symbolPlacement,
  size = "small",
  appearance,
  href,
  render = (anchor) => <a {...anchor} href={href} />,
}: LinkProps) =>
  render({
    className: styles.link,
    "data-size": size,
    "data-appearance": appearance,
    children: contentOf({ label, symbol, symbolPlacement }),
  });
