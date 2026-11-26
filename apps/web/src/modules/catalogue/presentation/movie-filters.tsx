import { Search } from "lucide-react";

import { SearchToken, TextField } from "@prime/ui";

import type { Genre, MovieFilters } from "../domain/movie.ts";
import { useDraft } from "./use-draft.ts";

import styles from "./movie-filters.module.css";

const YEAR = /^\d{4}$/;

const titleOf = (text: string): string | undefined => text.trim() || undefined;

const yearOf = (text: string): number | undefined => (YEAR.test(text) ? Number(text) : undefined);

const textOf = (value: string | number | undefined): string =>
  value === undefined ? "" : String(value);

export const MovieFilterBar = ({
  filters,
  genres,
  onChange,
}: {
  readonly filters: MovieFilters;
  readonly genres: readonly Genre[];
  readonly onChange: (change: MovieFilters, options: { readonly replace: boolean }) => void;
}) => {
  const [title, setTitle] = useDraft({
    committed: filters.title,
    interpret: titleOf,
    format: textOf,
    commit: (next) => onChange({ title: next }, { replace: true }),
  });
  const [year, setYear] = useDraft({
    committed: filters.year,
    interpret: yearOf,
    format: textOf,
    commit: (next) => onChange({ year: next }, { replace: true }),
  });
  return (
    <form
      role="search"
      aria-label="Filtres"
      className={styles.filters}
      onSubmit={(event) => event.preventDefault()}
    >
      <div className={styles.fields}>
        <div className={styles.title}>
          <TextField
            type="search"
            label="Rechercher un titre"
            placeholder="Rechercher un titre"
            symbol={<Search />}
            value={title}
            onChange={setTitle}
          />
        </div>
        <div className={styles.year}>
          <TextField
            label="Année"
            placeholder="Année"
            inputMode="numeric"
            maxLength={4}
            value={year}
            onChange={setYear}
          />
        </div>
      </div>
      {genres.length > 0 && (
        <div role="group" aria-label="Genre" className={styles.genres}>
          <SearchToken
            label="Tous"
            selected={filters.genre === undefined}
            onClick={() => onChange({ genre: undefined }, { replace: false })}
          />
          {genres.map((genre) => (
            <SearchToken
              key={genre.id}
              label={genre.name}
              selected={filters.genre === genre.id}
              onClick={() => onChange({ genre: genre.id }, { replace: false })}
            />
          ))}
        </div>
      )}
    </form>
  );
};
