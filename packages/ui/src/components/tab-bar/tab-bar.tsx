import { type ReactElement, type ReactNode, useLayoutEffect, useRef, useState } from "react";

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

export type TabBarSize = "regular" | "small";

export type TabBarProps = {
  readonly label: string;
  readonly tabs: readonly Tab[];
  readonly orientation?: TabBarOrientation;
  readonly size?: TabBarSize;
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

type Box = {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
};

const boxOf = (element: HTMLElement): Box => ({
  left: element.offsetLeft,
  top: element.offsetTop,
  width: element.offsetWidth,
  height: element.offsetHeight,
});

const useCurrentTabBox = (currentIndex: number) => {
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const [box, setBox] = useState<Box | undefined>(undefined);

  useLayoutEffect(() => {
    const current = items.current[currentIndex]?.firstElementChild;
    if (!(current instanceof HTMLElement)) {
      setBox(undefined);
      return undefined;
    }
    const measure = () => setBox(boxOf(current));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(current);
    return () => observer.disconnect();
  }, [currentIndex]);

  return { items, box };
};

export const TabBar = ({
  label,
  tabs,
  orientation = "vertical",
  size = "regular",
}: TabBarProps) => {
  const { items, box } = useCurrentTabBox(tabs.findIndex((tab) => tab.current));
  return (
    <nav aria-label={label}>
      <ul className={styles.bar} data-orientation={orientation} data-size={size}>
        {box !== undefined && (
          <li
            aria-hidden="true"
            className={styles.indicator}
            style={{
              translate: `${box.left}px ${box.top}px`,
              width: box.width,
              height: box.height,
            }}
          />
        )}
        {tabs.map((tab, index) => (
          <li
            key={tab.label}
            ref={(item) => {
              items.current[index] = item;
            }}
          >
            {renderTab(tab)}
          </li>
        ))}
      </ul>
    </nav>
  );
};
