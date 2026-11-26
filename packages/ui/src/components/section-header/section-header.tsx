import type { ReactNode } from "react";

import styles from "./section-header.module.css";

export type HeadingLevel = 2 | 3 | 4 | 5 | 6;

export type SectionHeaderProps = {
  readonly title: string;
  readonly level?: HeadingLevel;
  readonly accessory?: ReactNode;
};

export const SectionHeader = ({ title, level = 2, accessory }: SectionHeaderProps) => {
  const Heading = `h${level}` as const;
  return (
    <div className={styles.header}>
      <Heading className={styles.title}>{title}</Heading>
      {accessory}
    </div>
  );
};
