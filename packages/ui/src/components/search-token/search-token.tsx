import styles from "./search-token.module.css";

export type SearchTokenProps = {
  readonly label: string;
  readonly selected: boolean;
  readonly onClick: () => void;
};

export const SearchToken = ({ label, selected, onClick }: SearchTokenProps) => (
  <button
    type="button"
    className={styles.token}
    aria-pressed={selected}
    data-appearance={selected ? "prominent" : "plain"}
    onClick={onClick}
  >
    {label}
  </button>
);
