import styles from "./page-control.module.css";

export type PageControlProps = {
  readonly label: string;
  readonly count: number;
  readonly current: number;
  readonly onSelect: (page: number) => void;
};

const pagesUpTo = (count: number): readonly number[] =>
  Array.from({ length: count }, (_, index) => index + 1);

export const PageControl = ({ label, count, current, onSelect }: PageControlProps) => (
  <nav aria-label={label}>
    <ul className={styles.dots}>
      {pagesUpTo(count).map((page) => (
        <li key={page}>
          <button
            type="button"
            className={styles.dot}
            aria-label={`Page ${page}`}
            aria-current={page === current ? "page" : undefined}
            onClick={() => onSelect(page)}
          />
        </li>
      ))}
    </ul>
  </nav>
);
