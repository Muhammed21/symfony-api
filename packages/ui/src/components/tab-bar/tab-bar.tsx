import type { ReactElement, ReactNode } from "react";

import styles from "./tab-bar.module.css";

export type TabAnchor = {
  readonly className: string | undefined;
  readonly "aria-label": string;
  readonly "aria-current": "page" | undefined;
  readonly children: ReactNode;
};

type TabTarget =
  | { readonly href: string; readonly render?: never }
  | { readonly render: (anchor: TabAnchor) => ReactElement; readonly href?: never };

export type Tab = {
  readonly label: string;
  readonly symbol: ReactNode;
  readonly current: boolean;
} & TabTarget;

export type TabBarOrientation = "vertical" | "horizontal";

export type TabBarProps = {
  readonly label: string;
  readonly tabs: readonly Tab[];
  readonly orientation?: TabBarOrientation;
};

const renderTab = ({
  label,
  symbol,
  current,
  href,
  render = (anchor) => <a {...anchor} href={href} />,
}: Tab) =>
  render({
    className: styles.tab,
    "aria-label": label,
    "aria-current": current ? "page" : undefined,
    children: (
      <>
        <span aria-hidden="true" className={styles.symbol}>
          {symbol}
        </span>
        <span aria-hidden="true" className={styles.label}>
          {label}
        </span>
      </>
    ),
  });

export const TabBar = ({ label, tabs, orientation = "vertical" }: TabBarProps) => (
  <nav aria-label={label}>
    <ul className={styles.bar} data-orientation={orientation}>
      {tabs.map((tab) => (
        <li key={tab.label}>{renderTab(tab)}</li>
      ))}
    </ul>
  </nav>
);
