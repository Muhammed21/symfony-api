import { useQuery } from "@tanstack/react-query";
import { type AnyRootRoute, createRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

import type { Result } from "@prime/result";

import type { AgeRating, CatalogueFailure, Movie, MoviePage } from "../domain/movie.ts";
import { formatDuration } from "./duration.ts";

type ListMovies = (query: {
  readonly page: number;
}) => Promise<Result<MoviePage, CatalogueFailure>>;

const FIRST_PAGE = 1;

const Page = z.coerce.number().int().min(FIRST_PAGE).catch(FIRST_PAGE);

const ageRatingLabel = (ageRating: AgeRating) => (ageRating === "ALL" ? "Tous publics" : ageRating);

const MovieCard = ({ movie }: { readonly movie: Movie }) => {
  const titleId = `movie-${movie.id}`;
  return (
    <article aria-labelledby={titleId}>
      <h2 id={titleId}>{movie.title}</h2>
      <p>
        {movie.releaseYear} · {formatDuration(movie.duration)} · {ageRatingLabel(movie.ageRating)}
      </p>
      <p>{movie.genres.join(", ")}</p>
    </article>
  );
};

const Pagination = ({ page, lastPage }: { readonly page: number; readonly lastPage: number }) => (
  <nav aria-label="Pagination">
    {page > FIRST_PAGE && (
      <Link to="/" search={{ page: page - 1 }}>
        Précédent
      </Link>
    )}
    <p>
      Page {page} sur {lastPage}
    </p>
    {page < lastPage && (
      <Link to="/" search={{ page: page + 1 }}>
        Suivant
      </Link>
    )}
  </nav>
);

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
    return <p>Chargement des films…</p>;
  }
  if (!data.ok) {
    return (
      <div role="alert">
        <p>Impossible de charger les films.</p>
        <button type="button" onClick={() => void refetch()}>
          Réessayer
        </button>
      </div>
    );
  }
  const { movies, lastPage } = data.value;
  if (movies.length === 0) {
    return <p>Aucun film pour le moment.</p>;
  }
  return (
    <>
      <ul>
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
        <main>
          <h1>Prime Video</h1>
          <Movies page={page} listMovies={listMovies} />
        </main>
      );
    },
  });
  return route;
};
