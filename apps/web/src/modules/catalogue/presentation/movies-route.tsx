import { useQuery } from "@tanstack/react-query";
import { type AnyRootRoute, createRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { z } from "zod";

import type { Result } from "@prime/result";
import {
  ActivityIndicator,
  ButtonTextAndSymbol,
  MovieThumb,
  PageControl,
  SectionHeader,
} from "@prime/ui";

import type { AgeRating, CatalogueFailure, Movie, MoviePage } from "../domain/movie.ts";
import { formatDuration } from "./duration.ts";

import styles from "./movies-route.module.css";

type ListMovies = (query: {
  readonly page: number;
}) => Promise<Result<MoviePage, CatalogueFailure>>;

const FIRST_PAGE = 1;

const Page = z.coerce.number().int().min(FIRST_PAGE).catch(FIRST_PAGE);

const ageRatingLabel = (ageRating: AgeRating) => (ageRating === "ALL" ? "Tous publics" : ageRating);

const MovieCard = ({ movie }: { readonly movie: Movie }) => {
  const titleId = `movie-${movie.id}`;
  return (
    <article className={styles.card} aria-labelledby={titleId}>
      <MovieThumb title={movie.title} />
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
            <Link className={styles.pageLink} to="/" search={{ page: page - 1 }}>
              <ChevronLeft aria-hidden="true" />
              Précédent
            </Link>
          )}
          <PageControl
            label="Pagination"
            count={lastPage}
            current={page}
            onSelect={(selected) => void navigate({ to: "/", search: { page: selected } })}
          />
          {page < lastPage && (
            <Link className={styles.pageLink} to="/" search={{ page: page + 1 }}>
              Suivant
              <ChevronRight aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
      <p className={styles.pageNumber}>
        Page {page} sur {lastPage}
      </p>
    </div>
  );
};

const Movies = ({
  page,
  listMovies,
}: {
  readonly page: number;
  readonly listMovies: ListMovies;
}) => {
  const { data, refetch } = useQuery({
    queryKey: ["movies", page],
    queryFn: () => listMovies({ page }),
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
    return <p className={styles.status}>Aucun film pour le moment.</p>;
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

export const moviesRoute = ({
  parent,
  listMovies,
}: {
  readonly parent: AnyRootRoute;
  readonly listMovies: ListMovies;
}) => {
  const route = createRoute({
    getParentRoute: () => parent,
    path: "/",
    validateSearch: (search: Readonly<Record<string, unknown>>) => ({
      page: Page.parse(search["page"]),
    }),
    component: function MoviesPage() {
      const { page } = route.useSearch();
      return (
        <main className={styles.page}>
          <h1 className={styles.brand}>Prime Video</h1>
          <section className={styles.catalogue}>
            <SectionHeader title="Catalogue" />
            <Movies page={page} listMovies={listMovies} />
          </section>
        </main>
      );
    },
  });
  return route;
};
