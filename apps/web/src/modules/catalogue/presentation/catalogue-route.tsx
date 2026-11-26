import { useQuery } from "@tanstack/react-query";
import {
  type AnyRootRoute,
  createRoute,
  Link as RouterLink,
  useNavigate,
} from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { z } from "zod";

import { ActivityIndicator, ButtonTextAndSymbol, Link, MovieThumb, PageControl } from "@prime/ui";

import type { AgeRating, Movie, MovieFilters } from "../domain/movie.ts";
import { formatDuration } from "./duration.ts";
import { MovieFilterBar } from "./movie-filters.tsx";
import type { ListGenres, ListMovies } from "./use-cases.ts";

import styles from "./catalogue-route.module.css";

const FIRST_PAGE = 1;

const Page = z.coerce.number().int().min(FIRST_PAGE).catch(FIRST_PAGE);

const Title = z.string().trim().min(1).optional().catch(undefined);

const Identifier = z.number().int().positive().optional().catch(undefined);

type CatalogueSearch = { readonly page: number } & MovieFilters;

const hasFilters = ({ title, year, genre }: MovieFilters) =>
  [title, year, genre].some((value) => value !== undefined);

const ageRatingLabel = (ageRating: AgeRating) => (ageRating === "ALL" ? "Tous publics" : ageRating);

const MovieCard = ({ movie }: { readonly movie: Movie }) => {
  const titleId = `movie-${movie.id}`;
  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <MovieThumb
        title={movie.title}
        {...(movie.posterUrl === undefined ? {} : { image: movie.posterUrl })}
      />
      <h3 id={titleId} className={styles.cardTitle}>
        {movie.title}
      </h3>
      <p className={styles.cardDetails}>
        {movie.releaseYear} · {formatDuration(movie.duration)} · {ageRatingLabel(movie.ageRating)}
      </p>
      <p className={styles.cardGenres}>{movie.genres.join(", ")}</p>
    </article>
  );
};

const Pagination = ({ page, lastPage }: { readonly page: number; readonly lastPage: number }) => {
  const navigate = useNavigate();
  return (
    <div className={styles.pagination}>
      {lastPage > FIRST_PAGE && (
        <div className={styles.pages}>
          {page > FIRST_PAGE && (
            <Link
              size="regular"
              label="Précédent"
              symbol={<ChevronLeft />}
              render={(anchor) => (
                <RouterLink
                  {...anchor}
                  to="/catalogue"
                  search={(search: CatalogueSearch) => ({ ...search, page: page - 1 })}
                />
              )}
            />
          )}
          <PageControl
            label="Pagination"
            count={lastPage}
            current={page}
            onSelect={(selected) =>
              void navigate({
                to: "/catalogue",
                search: (search: CatalogueSearch) => ({ ...search, page: selected }),
              })
            }
          />
          {page < lastPage && (
            <Link
              size="regular"
              label="Suivant"
              symbol={<ChevronRight />}
              symbolPlacement="trailing"
              render={(anchor) => (
                <RouterLink
                  {...anchor}
                  to="/catalogue"
                  search={(search: CatalogueSearch) => ({ ...search, page: page + 1 })}
                />
              )}
            />
          )}
        </div>
      )}
      <p className={styles.pageNumber}>
        Page {page} sur {lastPage}
      </p>
    </div>
  );
};

const NoMatch = () => (
  <div className={styles.status}>
    <p>Aucun film ne correspond à ces filtres.</p>
    <Link
      label="Effacer les filtres"
      render={(anchor) => <RouterLink {...anchor} to="/catalogue" search={{ page: FIRST_PAGE }} />}
    />
  </div>
);

const Movies = ({
  page,
  filters,
  listMovies,
}: {
  readonly page: number;
  readonly filters: MovieFilters;
  readonly listMovies: ListMovies;
}) => {
  const { data, refetch } = useQuery({
    queryKey: ["movies", page, filters],
    queryFn: () => listMovies({ page, filters }),
  });
  if (data === undefined) {
    return (
      <div className={styles.status}>
        <ActivityIndicator label="Chargement des films" />
        <p>Chargement des films…</p>
      </div>
    );
  }
  if (!data.ok) {
    return (
      <div role="alert" className={styles.status}>
        <p>Impossible de charger les films.</p>
        <ButtonTextAndSymbol
          label="Réessayer"
          symbol={<RotateCw />}
          onClick={() => void refetch()}
        />
      </div>
    );
  }
  const { movies, lastPage } = data.value;
  if (movies.length === 0) {
    return hasFilters(filters) ? (
      <NoMatch />
    ) : (
      <p className={styles.status}>Aucun film pour le moment.</p>
    );
  }
  return (
    <>
      <ul className={styles.grid}>
        {movies.map((movie) => (
          <li key={movie.id}>
            <MovieCard movie={movie} />
          </li>
        ))}
      </ul>
      <Pagination page={page} lastPage={lastPage} />
    </>
  );
};

export const catalogueRoute = ({
  parent,
  listMovies,
  listGenres,
}: {
  readonly parent: AnyRootRoute;
  readonly listMovies: ListMovies;
  readonly listGenres: ListGenres;
}) => {
  const route = createRoute({
    getParentRoute: () => parent,
    path: "/catalogue",
    validateSearch: (search: Readonly<Record<string, unknown>>): CatalogueSearch => ({
      page: Page.parse(search["page"]),
      title: Title.parse(search["title"]),
      year: Identifier.parse(search["year"]),
      genre: Identifier.parse(search["genre"]),
    }),
    component: function MoviesPage() {
      const { page, title, year, genre } = route.useSearch();
      const navigate = useNavigate();
      const genres = useQuery({ queryKey: ["genres"], queryFn: listGenres });
      const filters = { title, year, genre };
      return (
        <div className={styles.page}>
          <section className={styles.catalogue} aria-labelledby="catalogue-title">
            <h1 id="catalogue-title" className={styles.title}>
              Catalogue
            </h1>
            <MovieFilterBar
              filters={filters}
              genres={genres.data?.ok === true ? genres.data.value : []}
              onChange={(change, { replace }) =>
                void navigate({
                  to: "/catalogue",
                  search: (search: CatalogueSearch) => ({ ...search, ...change, page: FIRST_PAGE }),
                  replace,
                })
              }
            />
            <Movies page={page} filters={filters} listMovies={listMovies} />
          </section>
        </div>
      );
    },
  });
  return route;
};
