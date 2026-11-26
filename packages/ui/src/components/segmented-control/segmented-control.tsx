import type { ReactElement, ReactNode } from "react";

import styles from "./segmented-control.module.css";

export type SegmentAnchor = {
  readonly className: string | undefined;
  readonly "aria-current": "page" | undefined;
  readonly children: ReactNode;
};

type SegmentTarget =
  | { readonly href: string; readonly render?: never }
  | { readonly render: (anchor: SegmentAnchor) => ReactElement; readonly href?: never };

export type Segment = {
  readonly label: string;
  readonly current: boolean;
} & SegmentTarget;

export type SegmentedControlProps = {
  readonly label: string;
  readonly segments: readonly Segment[];
};

const renderSegment = ({
  label,
  current,
  href,
  render = (anchor) => <a {...anchor} href={href} />,
}: Segment) =>
  render({
    className: styles.segment,
    "aria-current": current ? "page" : undefined,
    children: label,
  });

export const SegmentedControl = ({ label, segments }: SegmentedControlProps) => (
  <nav aria-label={label}>
    <ul className={styles.bar}>
      {segments.map((segment) => (
        <li key={segment.label} className={styles.item}>
          {renderSegment(segment)}
        </li>
      ))}
    </ul>
  </nav>
);
